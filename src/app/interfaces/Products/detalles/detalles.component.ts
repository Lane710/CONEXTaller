import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgClass, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Modelos y DTOs
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { ProductoImagen } from '../../../models/ProductoStockModel/ProductoImagen';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';

// Servicios
import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { CarritoService } from '../../../services/CartServis/carrito.service';

@Component({
  selector: 'app-detalles',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, CurrencyPipe, FormsModule, RouterModule], 
  templateUrl: './detalles.component.html',
  styleUrls: ['./detalles.component.css']
})
export class DetallesComponent implements OnInit {
  productId: number | null = null;
  productDetails: StockDTO | null = null;
  isLoading = true;
  error: string | null = null;

  // Arreglos de propiedades
  especificaciones: ProductoValorPropiedad[] = [];
  atributos: ProductoValorPropiedad[] = [];
  caracteristicas: ProductoValorPropiedad[] = [];

  // Imágenes y carrito
  mainImageUrl = '';
  ImagenProducts: ProductoImagen[] = [];
  cantidadSeleccionada = 1;

  // --- VARIABLES PARA PRODUCTOS RELACIONADOS PAGINADOS ---
  techoProducts: StockDTO[] = [];
  paginaActual: number = 0;
  tamañoPagina: number = 8;
  esUltimaPagina: boolean = false;
  isLoadingMas: boolean = false;

  // --- MAPA PARA CONTROLAR EL ESTADO DEL BOTÓN DE FORMA PERMANENTE ---
  carritoAgregadoMap: { [idStock: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private productoValorPropiedadService: ProductoValorPropiedadService, 
    private productoImagenService: ProductoImagenService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.error = 'No se encontró el ID del producto en la URL.';
        this.isLoading = false;
        return;
      }

      this.productId = +idParam;

      this.isLoading = true;
      this.error = null;
      this.productDetails = null;
      this.especificaciones = [];
      this.atributos = [];
      this.caracteristicas = [];
      this.ImagenProducts = [];
      this.cantidadSeleccionada = 1;
      
      this.techoProducts = [];
      this.paginaActual = 0;
      this.esUltimaPagina = false;

      this.cargarDetallesProducto();
    });
  }

  private cargarDetallesProducto(): void {
    if (!this.productId) return;

    this.stockService.findByIdStock(this.productId).subscribe({
      next: (response) => {
        this.productDetails = response.data;

        if (!this.productDetails) {
          this.error = 'No se encontró un producto con el ID proporcionado.';
          this.isLoading = false;
          return;
        }

        this.isLoading = false;

        if (this.productDetails.producto?.imagen) {
          this.mainImageUrl = this.productDetails.producto.imagen;
        }

        const idProductoReal = this.productDetails.producto?.idProducto;

        if (idProductoReal) {
          this.cargarImagenesSecundarias(idProductoReal);
          this.cargarPropiedadesProducto(idProductoReal);
        }

        this.cargarProductosSimilares(this.paginaActual);
      },
      error: (err) => {
        console.error('Error al cargar detalles del producto:', err);
        this.error = 'Error al cargar los detalles del producto.';
        this.isLoading = false;
      }
    });
  }

  private cargarPropiedadesProducto(idProducto: number): void {
    this.productoValorPropiedadService.findByProductoId(idProducto).subscribe({
       next: (response) => {
         const todasLasPropiedades: ProductoValorPropiedad[] = response.data || [];
         
         this.especificaciones = todasLasPropiedades.filter(p => {
           const tipo = p.tipoPropiedad?.tipo?.toLowerCase() || '';
           return tipo.includes('especificacion') || tipo.includes('especificación');
         });

         this.atributos = todasLasPropiedades.filter(p => {
           const tipo = p.tipoPropiedad?.tipo?.toLowerCase() || '';
           return tipo.includes('atributo');
         });

         this.caracteristicas = todasLasPropiedades.filter(p => {
           const tipo = p.tipoPropiedad?.tipo?.toLowerCase() || '';
           return tipo.includes('caracteristica') || tipo.includes('característica');
         });
       },
       error: (err) => console.error('Error al cargar propiedades del producto:', err)
    });
  }

  private cargarImagenesSecundarias(idProducto: number): void {
    this.productoImagenService.getProductImages(idProducto).subscribe({
      next: (response) => {
        this.ImagenProducts = response.data || [];
      },
      error: (err) => console.error('Error al obtener imágenes secundarias:', err)
    });
  }

  cargarProductosSimilares(page: number): void {
    if (page > 0) {
      this.isLoadingMas = true;
    }

    this.stockService.obtenerTiendaPaginada(page, this.tamañoPagina).subscribe({
      next: (response) => {
        const pageData = response.data;

        if (pageData && pageData.content) {
          const productosFiltrados = pageData.content.filter(
            (p: StockDTO) => p.idStock !== this.productId
          );

          if (page === 0) {
            this.techoProducts = productosFiltrados;
          } else {
            this.techoProducts = [...this.techoProducts, ...productosFiltrados];
          }

          this.esUltimaPagina = pageData.last;
          this.paginaActual = pageData.number;
        }
        this.isLoadingMas = false;
      },
      error: (err) => {
        console.error('Error al cargar productos similares:', err);
        this.isLoadingMas = false;
      }
    });
  }

  cargarMasProductos(): void {
    if (!this.esUltimaPagina && !this.isLoadingMas) {
      const siguientePagina = this.paginaActual + 1;
      this.cargarProductosSimilares(siguientePagina);
    }
  }

  changeMainImage(imageUrl: string): void {
    this.mainImageUrl = imageUrl;
  }

  AddProductCarrito(stockItem: StockDTO): void {
    const id = stockItem.idStock || 0;

    // LÓGICA NUEVA: Si el producto ya fue agregado, el botón sirve para ir al carrito
    if (this.carritoAgregadoMap[id]) {
      // Reemplaza '/carrito' si la ruta de tu carrito se llama de otra manera en tu app
      this.router.navigate(['/home/Carrito']); 
      return;
    }

    // Si no ha sido agregado, procedemos a agregarlo
    const usuarioId = localStorage.getItem('current_username');
    if (!usuarioId) {
      alert('Debes iniciar sesión para agregar productos al carrito.');
      return;
    }

    const precioUnitario = stockItem.producto.precio ?? 0;
    const cantidadAAgregar = stockItem.idStock === this.productId ? this.cantidadSeleccionada : 1;

    const detalle: DetalleCarrito = {
      stock: stockItem, 
      cantidad: cantidadAAgregar,
      precioUnitario: precioUnitario,
      subtotal: (precioUnitario * cantidadAAgregar)
    };

    this.carritoService.agregarProductoACarrito(usuarioId, detalle).subscribe({
      next: () => {
        // Al tener éxito, activamos el estado permanentemente para este ID
        this.carritoAgregadoMap[id] = true;
      },
      error: (err) => {
        console.error('Error al agregar producto al carrito:', err);
        alert('Hubo un problema al añadir el producto al carrito.');
      }
    });
  }

  verDetalles(idStock: number | undefined): void {
    if (idStock) {
      this.router.navigate(['/detalles', idStock]).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
}