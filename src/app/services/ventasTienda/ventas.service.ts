import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { ventas } from '../../models/Ventas/ventas';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private apiUrl = 'http://localhost:8080/ventas/';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ventas.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  /**
   * Busca una venta por su ID.
   * @param idVenta El ID de la venta a buscar.
   */
  findById(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${idVenta}`);
  }

  /**
   * Busca ventas por el ID de un cliente.
   * @param idCliente El ID del cliente.
   */
  findByCliente(idCliente: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findByCliente/${idCliente}`);
  }

  /**
   * Registra una nueva venta.
   * @param venta El objeto venta a guardar.
   */
  save(venta: ventas): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, venta);
  }

  /**
   * Actualiza una venta existente.
   * @param venta El objeto venta con los datos actualizados.
   */
  update(venta: ventas): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${venta.idVenta}`, venta);
  }

  /**
   * Cambia el estado de una venta (por ejemplo, a "cancelado").
   * @param idVenta El ID de la venta a cancelar/confirmar.
   */
  cancelarConfirmarVenta(idVenta: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}cancelarConfirmarVenta/${idVenta}`,
      null
    );
  }

  /**
   * Elimina una venta por su ID.
   * @param idVenta El ID de la venta a eliminar.
   */
  deleteById(idVenta: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${idVenta}`);
  }

  clienteConVenta(ci: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}clienteVenta/${ci}`);
  }

  // 🔥 NUEVO MÉTODO AÑADIDO
  /**
   * Busca una venta solo si tiene un envío registrado.
   * @param idVenta El ID de la venta a verificar.
   */
  findVentaConEnvio(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findVentaConEnvio/${idVenta}`);
  }
}