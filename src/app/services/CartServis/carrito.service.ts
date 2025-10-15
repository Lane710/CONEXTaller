// src/app/services/Cart/carrito.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs'; 
import { ApiResponse } from '../../models/api-response';
import { DetalleCarrito } from '../../models/CartModel/DetalleCarrito';


@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private baseUrl = 'http://localhost:8080/carrito/';
  private baseUrl2 = 'http://localhost:8080/detalle-carrito/';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de productos (stock) en el carrito de un usuario.
   * @param usuario Nombre de usuario.
   */
  listarProductosDeUsuario(usuario: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}${usuario}/productos`);
  }

  /**
   * Agrega un stock (producto) al carrito de un usuario.
   * @param usuario Nombre de usuario.
   * @param nuevoDetalle Objeto DetalleCarritoProducto a agregar.
   */
  agregarProductoACarrito(usuario: string, nuevoDetalle: DetalleCarrito): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}${usuario}/productos`, nuevoDetalle);
  }

  /**
   * Elimina un detalle del carrito de un usuario.
   * @param usuario Nombre de usuario.
   * @param idDetalleCarrito ID del detalle a eliminar.
   */
  eliminarProductoDeCarrito(usuario: string, idDetalleCarrito: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}${usuario}/productos/${idDetalleCarrito}`);
  }

  /**
   * Actualiza la cantidad de un detalle del carrito.
   * @param idDetalleCarrito ID del detalle.
   * @param operacion 1 = aumentar, 0 = disminuir.
   */
  actualizarCantidadDetalle(idDetalleCarrito: number, operacion: 0 | 1): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl2}actualizarCantidad/${idDetalleCarrito}/${operacion}`, {});
  }

}
