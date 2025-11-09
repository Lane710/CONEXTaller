import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StockDTO } from '../../../DTOs/dtosBD/StockDTO';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { ApiResponse } from '../../../models/api-response';
import { PreventaService } from '../../../services/ventasTienda/pre-ventas.service';

@Component({
  selector: 'app-pre-sale',
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './pre-sale.component.html',
  styleUrl: './pre-sale.component.css'
})
export class PreSaleComponent implements OnInit {
  productos: StockDTO[] = [];
  productosFiltrados: StockDTO[] = [];
  productosPaginaActual: StockDTO[] = [];
  
  // Mapa para rastrear qué productos están seleccionados
  productosSeleccionadosMap: Map<number, boolean> = new Map();

  // Variables para paginación
  paginaActual: number = 1;
  productosPorPagina: number = 40;
  totalPaginas: number = 0;
  paginas: number[] = [];

  // Variables para filtros
  busqueda: string = '';
  precioMin: number | null = null;
  precioMax: number | null = null;
  
  categoriasDisponibles: categorias[] = [];
  subcategoriasDisponibles: subcategoria[] = [];
  
  categoriasSeleccionadasIds: number[] = [];
  subcategoriasSeleccionadasIds: number[] = [];

  cargando: boolean = false;

  constructor(
    private stockService: StockService,
    private categoriasService: CategoriasService,
    private subcategoriaService: SubcategoriaService,
    private preventaService: PreventaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarListasFiltro();
    this.cargarProductosIniciales();
  }
  
  cargarListasFiltro(): void {
    this.categoriasService.findAll().subscribe({
      next: (res: ApiResponse) => {
        this.categoriasDisponibles = res.data || []; 
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }
  
  cargarSubcategoriasPorCategoria(): void {
    this.subcategoriasDisponibles = [];
    this.subcategoriasSeleccionadasIds = [];
    
    if (this.categoriasSeleccionadasIds.length === 0) {
      this.aplicarFiltros();
      return;
    }

    if (this.categoriasSeleccionadasIds.length === 1) {
        const idCategoria = this.categoriasSeleccionadasIds[0];
        this.subcategoriaService.ListadoSubCategoriasPorCategoria(idCategoria).subscribe({
            next: (res: ApiResponse) => {
                this.subcategoriasDisponibles = res.data || [];
                this.aplicarFiltros();
            },
            error: (err) => console.error('Error al cargar subcategorías:', err)
        });
    } else {
        console.warn('Filtro de subcategoría desactivado para múltiples categorías seleccionadas.');
        this.aplicarFiltros();
    }
  }

  cargarProductosIniciales(): void {
    this.cargando = true;
    this.stockService.getLatestProducts(200).subscribe({
      next: (res: ApiResponse) => {
        this.productos = res.data || [];
        this.productosFiltrados = [...this.productos];
        
        // Inicializar el mapa de selección
        this.inicializarMapaSeleccion();
        
        // Configurar paginación
        this.configurarPaginacion();
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.cargando = false;
      }
    });
  }

  // Inicializar el mapa de selección para todos los productos
  inicializarMapaSeleccion(): void {
    this.productosSeleccionadosMap.clear();
    const productosEnPreventa = this.preventaService.getProductosSeleccionados();
    
    this.productos.forEach(prod => {
      const yaEstaSeleccionado = productosEnPreventa.some(p => 
        p.producto.idProducto === prod.producto.idProducto
      );
      this.productosSeleccionadosMap.set(prod.producto.idProducto, yaEstaSeleccionado);
    });
  }

  // Verificar si un producto está seleccionado
  estaSeleccionado(prod: StockDTO): boolean {
    return this.productosSeleccionadosMap.get(prod.producto.idProducto) || false;
  }

  // Verificar si un producto tiene stock disponible
  tieneStock(prod: StockDTO): boolean {
    return prod.cantidad >= 1;
  }

  // Obtener el producto original con stock actualizado
  obtenerProductoOriginal(idProducto: number): StockDTO | undefined {
    return this.productos.find(p => p.producto.idProducto === idProducto);
  }

  // Obtener stock disponible para un producto
  obtenerStockDisponible(idProducto: number): number {
    const productoOriginal = this.obtenerProductoOriginal(idProducto);
    return productoOriginal ? productoOriginal.cantidad : 0;
  }

  // Obtener cantidad actual en el carrito para un producto
  obtenerCantidadEnCarrito(idProducto: number): number {
    return this.preventaService.getCantidadProducto(idProducto);
  }

  // Obtener stock restante (disponible - en carrito)
  obtenerStockRestante(idProducto: number): number {
    const stockDisponible = this.obtenerStockDisponible(idProducto);
    const cantidadEnCarrito = this.obtenerCantidadEnCarrito(idProducto);
    return stockDisponible - cantidadEnCarrito;
  }

  // Verificar si un producto ya está en la lista de venta
  yaEstaEnListaVenta(prod: StockDTO): boolean {
    return this.preventaService.estaEnPreventa(prod.producto.idProducto);
  }

  aplicarFiltros(): void {
    this.cargando = true;
    
    let idCategoria = this.categoriasSeleccionadasIds.length === 1 ? this.categoriasSeleccionadasIds[0] : 0;
    let idSubcategoria = this.subcategoriasSeleccionadasIds.length === 1 ? this.subcategoriasSeleccionadasIds[0] : 0;
    
    if (idCategoria > 0 || idSubcategoria > 0) {
        this.stockService.getProductsByCategoryAndSubcategory(idCategoria, idSubcategoria).subscribe({
            next: (res: ApiResponse) => {
                let productosFiltradosBackend: StockDTO[] = res.data || [];
                this.filtrarEnCliente(productosFiltradosBackend);
                this.cargando = false;
            },
            error: (err) => {
                console.error('Error al filtrar productos por categoría/subcategoría:', err);
                this.cargando = false;
            }
        });
    } else {
        this.filtrarEnCliente(this.productos);
        this.cargando = false;
    }
  }

  filtrarEnCliente(listaProductos: StockDTO[]): void {
      this.productosFiltrados = listaProductos.filter(prod => {
          const nombreCoincide =
            this.busqueda === '' ||
            prod.producto.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
            prod.producto.descripcion?.toLowerCase().includes(this.busqueda.toLowerCase());

          const precioCoincide =
            (!this.precioMin || (prod.producto.precio ?? 0) >= this.precioMin) &&
            (!this.precioMax || (prod.producto.precio ?? 0) <= this.precioMax);

          return nombreCoincide && precioCoincide;
      });

      // Configurar paginación después de filtrar
      this.configurarPaginacion();
  }

  // Configurar paginación
  configurarPaginacion(): void {
    this.paginaActual = 1;
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    this.actualizarPaginas();
    this.actualizarProductosPagina();
  }

  // Actualizar array de páginas para mostrar
  actualizarPaginas(): void {
    this.paginas = [];
    const paginasAMostrar = 5;
    
    let inicio = Math.max(1, this.paginaActual - Math.floor(paginasAMostrar / 2));
    let fin = Math.min(this.totalPaginas, inicio + paginasAMostrar - 1);
    
    if (fin - inicio + 1 < paginasAMostrar) {
      inicio = Math.max(1, fin - paginasAMostrar + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      this.paginas.push(i);
    }
  }

  // Actualizar productos de la página actual
  actualizarProductosPagina(): void {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    this.productosPaginaActual = this.productosFiltrados.slice(inicio, fin);
  }

  // Cambiar de página
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginas();
      this.actualizarProductosPagina();
    }
  }

  reiniciarFiltros(): void {
    this.busqueda = '';
    this.precioMin = null;
    this.precioMax = null;
    this.categoriasSeleccionadasIds = [];
    this.subcategoriasSeleccionadasIds = [];
    this.subcategoriasDisponibles = [];
    this.cargarProductosIniciales();
  }

  toggleSeleccionId(lista: number[], id: number): void {
    const index = lista.indexOf(id);
    if (index > -1) {
      lista.splice(index, 1);
    } else {
      if (lista === this.categoriasSeleccionadasIds) {
          lista.length = 0;
      } else if (lista === this.subcategoriasSeleccionadasIds) {
          lista.length = 0;
      }
      lista.push(id);
    }
    
    if (lista === this.categoriasSeleccionadasIds) {
        this.cargarSubcategoriasPorCategoria();
    } else {
        this.aplicarFiltros();
    }
  }

  // AGREGAR PRODUCTO A LA LISTA DE VENTA
  agregarAListaVenta(prod: StockDTO): void {
    // Validar que tenga stock
    if (!this.tieneStock(prod)) {
      alert('❌ Producto sin stock disponible');
      return;
    }

    // Crear StockDTO para el servicio
    const stockDTO: StockDTO = {
      producto: prod.producto,
      cantidad: 1,
      idStock: prod.idStock
    };

    // Agregar al servicio de preventa
    this.preventaService.agregarProducto(stockDTO);
    
    // Actualizar UI
    this.productosSeleccionadosMap.set(prod.producto.idProducto, true);
  }

  // AUMENTAR CANTIDAD DE PRODUCTO
  aumentarCantidad(item: StockDTO): void {
    const idProducto = item.producto.idProducto;
    const stockRestante = this.obtenerStockRestante(idProducto);
    
    if (stockRestante <= 0) {
      alert('❌ No hay más stock disponible para este producto');
      return;
    }

    // Aumentar cantidad en el servicio de preventa
    this.preventaService.aumentarCantidad(idProducto);
  }

  // DISMINUIR CANTIDAD DE PRODUCTO
  disminuirCantidad(item: StockDTO): void {
    const idProducto = item.producto.idProducto;
    const cantidadActual = this.obtenerCantidadEnCarrito(idProducto);
    
    if (cantidadActual <= 1) {
      // Si la cantidad es 1, eliminar el producto
      this.removerDeListaVenta(item);
    } else {
      // Disminuir cantidad en el servicio de preventa
      this.preventaService.disminuirCantidad(idProducto);
    }
  }

  // Método para remover producto de la lista de venta
  removerDeListaVenta(item: StockDTO): void {
    // Eliminar del servicio de preventa
    this.preventaService.eliminarProducto(item.producto.idProducto);
    
    // Actualizar UI
    this.productosSeleccionadosMap.set(item.producto.idProducto, false);
  }

  // Método para alternar selección (agregar/remover)
  toggleSeleccionProducto(prod: StockDTO): void {
    if (this.estaSeleccionado(prod)) {
      this.removerDeListaVenta(prod);
    } else {
      this.agregarAListaVenta(prod);
    }
  }

  // Método para obtener la lista actual de productos seleccionados
  obtenerProductosSeleccionados(): StockDTO[] {
    return this.preventaService.getProductosSeleccionados();
  }

  // Método para limpiar la lista de productos seleccionados
  limpiarListaVenta(): void {
    // Limpiar el servicio de preventa
    this.preventaService.limpiarPreventa();
    
    // Limpiar el mapa de selección
    this.productosSeleccionadosMap.forEach((value, key) => {
      this.productosSeleccionadosMap.set(key, false);
    });
  }

  // Ir al registro de venta
  irARegistroVenta(): void {
    const productosSeleccionados = this.obtenerProductosSeleccionados();
    
    if (productosSeleccionados.length === 0) {
      alert('❌ No hay productos seleccionados para la venta');
      return;
    }

    this.router.navigate(['/home/ventasTienda']);
  }

  // Getter para la cantidad de productos seleccionados
  get cantidadProductosSeleccionados(): number {
    return this.obtenerProductosSeleccionados().length;
  }
}