import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { detallePedido } from '../../models/PedidosEnviosDetalles/detallePedido';

@Injectable({
  providedIn: 'root'
})
export class DetallePedidosService {

  // URL base para el servicio de pedidos, asegúrate de que sea la correcta.
  private apiUrl = 'https://conex-api-backend.duckdns.org/detalle-pedidos/';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista completa de todos los pedidos y sus detalles.
   * @returns Un Observable con la respuesta de la API.
   */
  listado(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  /**
   * Guarda un nuevo detalle de pedido en la base de datos.
   * @param detallePedidido El objeto de detalle de pedido a guardar.
   * @returns Un Observable con la respuesta de la API.
   */
  save(detallePedidido: detallePedido): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, detallePedidido);
  }

  /**
   * Actualiza el estado de un pedido específico.
   * Asume que el backend tiene un endpoint PUT para esta operación.
   * @param idPedido El ID del pedido a actualizar.
   * @param nuevoEstado El nuevo estado del pedido (ej: 'Entregado', 'Cancelado').
   * @returns Un Observable con la respuesta de la API.
   */
  updateEstado(idPedido: number, nuevoEstado: string): Observable<ApiResponse> {
    // Es común que los endpoints de actualización de estado acepten el ID en la URL y el nuevo estado en el cuerpo de la solicitud.
    // También se podría enviar el nuevo estado como un parámetro de consulta.
    // Esta es una implementación sugerida, ajústala según tu API.
    return this.http.put<ApiResponse>(`${this.apiUrl}updateEstado/${idPedido}`, { estado: nuevoEstado });
  }

  /**
   * Obtiene la lista de detalles de un pedido específico por su ID.
   * Ahora la URL del endpoint coincide con el error que mostraste.
   * @param idPedido El ID del pedido para el cual se buscan los detalles.
   * @returns Un Observable con la respuesta de la API que contiene la lista de detalles.
   */
  getById(idPedido: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findByPedidoId/${idPedido}`);
  }
}
