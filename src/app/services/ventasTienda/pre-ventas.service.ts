// services/preventa.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StockDTO } from '../../DTOs/dtosBD/StockDTO';

@Injectable({
  providedIn: 'root'
})
export class PreventaService {
  private productosSeleccionadosSubject = new BehaviorSubject<StockDTO[]>([]);
  public productosSeleccionados$ = this.productosSeleccionadosSubject.asObservable();

  constructor() {
    // Cargar datos del localStorage al inicializar
    this.cargarDesdeStorage();
  }

  agregarProducto(producto: StockDTO): void {
    const productosActuales = this.productosSeleccionadosSubject.value;
    const productoExistente = productosActuales.find(p => 
      p.producto.idProducto === producto.producto.idProducto
    );

    if (productoExistente) {
      // Incrementar cantidad si ya existe
      productoExistente.cantidad += producto.cantidad;
    } else {
      // Agregar nuevo producto
      productosActuales.push({...producto});
    }

    this.actualizarStorage([...productosActuales]);
  }

  eliminarProducto(idProducto: number): void {
    const productosActuales = this.productosSeleccionadosSubject.value
      .filter(p => p.producto.idProducto !== idProducto);
    this.actualizarStorage([...productosActuales]);
  }

  actualizarCantidad(idProducto: number, cantidad: number): void {
    const productosActuales = this.productosSeleccionadosSubject.value;
    const producto = productosActuales.find(p => 
      p.producto.idProducto === idProducto
    );
    
    if (producto) {
      producto.cantidad = cantidad;
      this.actualizarStorage([...productosActuales]);
    }
  }

  aumentarCantidad(idProducto: number): void {
    const productosActuales = this.productosSeleccionadosSubject.value;
    const producto = productosActuales.find(p => p.producto.idProducto === idProducto);
    
    if (producto) {
      producto.cantidad += 1;
      this.actualizarStorage([...productosActuales]);
    }
  }

  disminuirCantidad(idProducto: number): void {
    const productosActuales = this.productosSeleccionadosSubject.value;
    const producto = productosActuales.find(p => p.producto.idProducto === idProducto);
    
    if (producto && producto.cantidad > 1) {
      producto.cantidad -= 1;
      this.actualizarStorage([...productosActuales]);
    } else if (producto && producto.cantidad === 1) {
      // Si la cantidad es 1, eliminar el producto
      this.eliminarProducto(idProducto);
    }
  }

  limpiarPreventa(): void {
    this.actualizarStorage([]);
  }

  getProductosSeleccionados(): StockDTO[] {
    return this.productosSeleccionadosSubject.value;
  }

  // Métodos privados para manejar el localStorage
  private actualizarStorage(productos: StockDTO[]): void {
    this.productosSeleccionadosSubject.next(productos);
    
    // Guardar en localStorage para persistencia
    try {
      localStorage.setItem('preventa_productos', JSON.stringify(productos));
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  }

  private cargarDesdeStorage(): void {
    try {
      const datosGuardados = localStorage.getItem('preventa_productos');
      if (datosGuardados) {
        const productos: StockDTO[] = JSON.parse(datosGuardados);
        this.productosSeleccionadosSubject.next(productos);
      }
    } catch (error) {
      console.error('Error al cargar desde localStorage:', error);
      // En caso de error, limpiar el localStorage
      localStorage.removeItem('preventa_productos');
    }
  }

  // Método adicional para obtener el total de productos
  getTotalProductos(): number {
    return this.productosSeleccionadosSubject.value.reduce(
      (total, producto) => total + producto.cantidad, 0
    );
  }

  // Método para obtener el total monetario
  getTotalMonetario(): number {
    return this.productosSeleccionadosSubject.value.reduce(
      (total, producto) => total + (producto.producto.precio * producto.cantidad), 0
    );
  }

  // Método para verificar si un producto está en la preventa
  estaEnPreventa(idProducto: number): boolean {
    return this.productosSeleccionadosSubject.value.some(
      p => p.producto.idProducto === idProducto
    );
  }

  // Método para obtener la cantidad de un producto específico
  getCantidadProducto(idProducto: number): number {
    const producto = this.productosSeleccionadosSubject.value.find(
      p => p.producto.idProducto === idProducto
    );
    return producto ? producto.cantidad : 0;
  }
}