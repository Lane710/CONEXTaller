import { Component, OnInit } from '@angular/core';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service'; // Importar

import { ApiResponse } from '../../../models/api-response';
import { DetalleCarrito } from '../../../models/CartModel/DetalleCarrito';
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { categorias } from '../../../models/ProductoStockModel/categorias'; // Importar el modelo de categoría
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias'; // Importar el modelo de subcategoría
import { switchMap } from 'rxjs/operators'; // Necesario para encadenar observables
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store',
  standalone:true,
  imports:[NgIf,NgFor,FormsModule],
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css']
})
export class StoreComponent implements OnInit {

  productos: StockDTO[] = [];
  productosFiltrados: StockDTO[] = []; // Se mantiene, aunque el filtro principal será por backend

  // Variables para filtros y listas dinámicas
  busqueda: string = '';
  precioMin: number | null = null;
  precioMax: number | null = null;
  
  // Usamos IDs y modelos para los filtros de categoría/subcategoría
  categoriasDisponibles: categorias[] = []; // Lista para el *checkbox*
  subcategoriasDisponibles: subcategoria[] = []; // Lista para el *checkbox*
  
  // Almacena los IDs de las categorías y subcategorías seleccionadas
  categoriasSeleccionadasIds: number[] = [];
  subcategoriasSeleccionadasIds: number[] = [];

  // Variables para filtros que no cambian (marcas)
  marcasSeleccionadas: string[] = [];
  marcas: string[] = ['Apple', 'Samsung', 'Nike', 'Ikea']; // Marcas simuladas/reales
  
  usuarioActual: string = localStorage.getItem('current_username') || '';; 
  cargando: boolean = false;

  constructor(
    private stockService: StockService,
    private carritoService: CarritoService,
    private categoriasService: CategoriasService, // Inyectar
    private subcategoriaService: SubcategoriaService, // Inyectar
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarListasFiltro();
    this.cargarProductosIniciales();
  }
  
  /** 🔹 Carga las listas de categorías y subcategorías disponibles */
  cargarListasFiltro(): void {
    this.categoriasService.findAll().subscribe({
      next: (res: ApiResponse) => {
        // Asumiendo que res.data es un array de categorias[]
        this.categoriasDisponibles = res.data || []; 
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }
  
  /** 🔹 Carga las subcategorías basándose en las categorías seleccionadas */
  cargarSubcategoriasPorCategoria(): void {
    this.subcategoriasDisponibles = []; // Limpiar antes de cargar nuevas
    this.subcategoriasSeleccionadasIds = []; // Limpiar selecciones de subcategoría
    
    // Si no hay categorías seleccionadas, no cargamos subcategorías
    if (this.categoriasSeleccionadasIds.length === 0) {
      this.aplicarFiltros(); // Aplicar otros filtros
      return;
    }

    // Si se selecciona solo una categoría
    if (this.categoriasSeleccionadasIds.length === 1) {
        const idCategoria = this.categoriasSeleccionadasIds[0];
        this.subcategoriaService.ListadoSubCategoriasPorCategoria(idCategoria).subscribe({
            next: (res: ApiResponse) => {
                this.subcategoriasDisponibles = res.data || [];
                this.aplicarFiltros(); // Aplicar el filtro después de actualizar las listas
            },
            error: (err) => console.error('Error al cargar subcategorías:', err)
        });
    } else {
        console.warn('Filtro de subcategoría desactivado para múltiples categorías seleccionadas.');
        this.aplicarFiltros();
    }
  }

  /** 🔹 Carga los 50 productos más recientes */
  cargarProductosIniciales(): void {
    this.cargando = true;
    this.stockService.getLatestProducts(50).subscribe({
      next: (res: ApiResponse) => {
        this.productos = res.data || [];
        this.productosFiltrados = [...this.productos];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.cargando = false;
      }
    });
  }

  /** 🔹 Aplica los filtros: Lógica centralizada para obtener productos del backend */
  aplicarFiltros(): void {
    this.cargando = true;
    
    let idCategoria = this.categoriasSeleccionadasIds.length === 1 ? this.categoriasSeleccionadasIds[0] : 0;
    let idSubcategoria = this.subcategoriasSeleccionadasIds.length === 1 ? this.subcategoriasSeleccionadasIds[0] : 0;
    
    // Lógica para filtrar por Categoría/Subcategoría (usando la API que tienes)
    if (idCategoria > 0 || idSubcategoria > 0) {
        this.stockService.getProductsByCategoryAndSubcategory(idCategoria, idSubcategoria).subscribe({
            next: (res: ApiResponse) => {
                let productosFiltradosBackend: StockDTO[] = res.data || [];
                // Aplicar filtros de texto, precio y marca en el cliente (si no tienes API para ello)
                this.filtrarEnCliente(productosFiltradosBackend);
                this.cargando = false;
            },
            error: (err) => {
                console.error('Error al filtrar productos por categoría/subcategoría:', err);
                this.cargando = false;
            }
        });
    } else {
        // Si no hay categoría/subcategoría seleccionada, usamos la lista completa (`this.productos`)
        // y aplicamos los filtros restantes.
        this.filtrarEnCliente(this.productos);
        this.cargando = false;
    }
  }

  /** 🔹 Aplica filtros restantes (texto, precio, marca) en el cliente */
  filtrarEnCliente(listaProductos: StockDTO[]): void {
      this.productosFiltrados = listaProductos.filter(prod => {
          const nombreCoincide =
            this.busqueda === '' ||
            prod.producto.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
            prod.producto.descripcion?.toLowerCase().includes(this.busqueda.toLowerCase());

          const marcaCoincide =
            this.marcasSeleccionadas.length === 0 ||
            this.marcasSeleccionadas.includes(prod.producto.marca || '');

          const precioCoincide =
            (!this.precioMin || (prod.producto.precio ?? 0) >= this.precioMin) &&
            (!this.precioMax || (prod.producto.precio ?? 0) <= this.precioMax);

          return nombreCoincide && marcaCoincide && precioCoincide;
      });
  }

  /** 🔹 Reinicia todos los filtros y recarga productos iniciales */
  reiniciarFiltros(): void {
    this.busqueda = '';
    this.precioMin = null;
    this.precioMax = null;
    this.categoriasSeleccionadasIds = [];
    this.subcategoriasSeleccionadasIds = [];
    this.marcasSeleccionadas = [];
    this.subcategoriasDisponibles = []; // Limpiar subcategorías
    this.cargarProductosIniciales(); // Recargar la lista inicial de 50
  }

  /** 🔹 Manejador de checkboxes para IDs numéricos (Categorías/Subcategorías) */
  toggleSeleccionId(lista: number[], id: number): void {
    const index = lista.indexOf(id);
    if (index > -1) {
      lista.splice(index, 1);
    } else {
      // Permitir solo una selección de categoría o subcategoría para simplificar el uso de la API
      // Si quieres permitir múltiples, elimina esta comprobación.
      if (lista === this.categoriasSeleccionadasIds) {
          lista.length = 0; // Limpiar selección anterior
      } else if (lista === this.subcategoriasSeleccionadasIds) {
          lista.length = 0; // Limpiar selección anterior
      }
      lista.push(id);
    }
    
    // Lógica específica: Si cambian las categorías, actualizamos las subcategorías.
    if (lista === this.categoriasSeleccionadasIds) {
        this.cargarSubcategoriasPorCategoria();
    } else {
        this.aplicarFiltros(); // Si cambia la subcategoría, solo aplicamos filtros
    }
  }
  
  /** 🔹 Manejador de checkboxes para strings (Marcas) */
  toggleSeleccionString(lista: string[], valor: string): void {
      if (lista.includes(valor)) {
          lista.splice(lista.indexOf(valor), 1);
      } else {
          lista.push(valor);
      }
      this.aplicarFiltros();
  }

  // ============== MÉTODO FALTANTE ==============
  /** 🔹 Agregar producto al carrito */
  /** 🔹 Agregar producto al carrito - VERSIÓN CORREGIDA */
/** 🔹 Agregar producto al carrito - VERSIÓN SIN ALERTAS */
  agregarAlCarrito(prod: StockDTO): void {
    console.log('Intentando agregar al carrito:', prod);
    
    // Verificar que el producto tenga stock disponible
    if (!prod.cantidad || prod.cantidad <= 0) {
      console.warn('Producto sin stock disponible');
      return; // Salimos silenciosamente o puedes dejar un console.warn
    }

    // Construir el objeto detalleCarrito según lo que espera tu backend
    const nuevoDetalle: DetalleCarrito = {
      idDetalleCarrito: 0, // 0 para nuevo detalle
      cantidad: 1,
      stock: prod,
      subtotal: (prod.producto.precio ?? 0),
      precioUnitario: (prod.producto.precio ?? 0)
    };

    this.carritoService.agregarProductoACarrito(this.usuarioActual, nuevoDetalle).subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          // AQUÍ ES LA MAGIA: En lugar de alert(), solo cambiamos el estado
          prod.anadidoAlCarrito = true;
        } else {
          console.error(`Error: ${res.message || 'No se pudo agregar al carrito'}`);
        }
      },
      error: (err) => {
        console.error('Error al añadir al carrito', err);
      }
    });
  }

  /** 🔹 Navegar al carrito cuando el botón cambia de estado */
  irAlCarrito(): void {
    // Asegúrate de que '/carrito' sea la ruta real configurada en tu app-routing.module.ts
    this.router.navigate(['/home/Carrito']); 
  }
  // ==============================================
}