import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs'; 
import { ApiResponse } from '../../models/api-response';
import { RawDetalleCarritoProducto } from '../../DTOs/Cart/ProductoEnCarrito';
import { DetalleCarrito } from '../../models/CartModel/DetalleCarrito';

// Importa las interfaces necesarias


@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  // URL base para todas las operaciones relacionadas con el carrito.
  private baseUrl = 'http://localhost:8080/carrito/';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de productos en el carrito de un usuario.
   * @param usuario El nombre de usuario.
   */
  listarProductosDeUsuario(usuario: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}${usuario}/productos`);
  }

  /**
   * Agrega un producto al carrito de un usuario.
   * @param usuario El nombre de usuario.
   * @param nuevoDetalle El objeto RawDetalleCarritoProducto a agregar.
   */
  agregarProductoACarrito(usuario: string, nuevoDetalle: DetalleCarrito): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}${usuario}/productos`, nuevoDetalle);
  }

  /**
   * Elimina un producto del carrito de un usuario.
   * @param usuario El nombre de usuario.
   * @param idDetalleCarrito El ID del detalle del carrito a eliminar.
   */
  eliminarProductoDeCarrito(usuario: string, idDetalleCarrito: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}${usuario}/productos/${idDetalleCarrito}`);
  }

  /**
   * Actualiza la cantidad de un producto en el carrito.
   * @param idDetalleCarrito El ID del detalle del carrito.
   * @param operacion La operación a realizar (1 para aumentar, 0 para disminuir).
   */
  actualizarCantidadDetalle(idDetalleCarrito: number, operacion: 0 | 1): Observable<ApiResponse> {
    // Se usa el endpoint de aumento/disminución de cantidad.
    return this.http.put<ApiResponse>(`${this.baseUrl}actualizarCantidad/${idDetalleCarrito}/${operacion}`, {});
  }
}
