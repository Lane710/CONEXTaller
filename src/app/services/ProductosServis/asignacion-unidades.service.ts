import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AsignacionUnidadesService {
  private apiUrl = 'https://conex-api-backend.duckdns.org/asignaciones/';

  constructor(private http: HttpClient) { }

  // ==========================================
  // --- MÉTODOS PARA VENTAS FÍSICAS ---
  // ==========================================

  // Enviar lista de strings ["PROD-001", "PROD-002"] a un detalle de venta específico
  asignarCodigosVenta(idDetalleVenta: number, codigos: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}venta/${idDetalleVenta}`, codigos);
  }

  // Verificar si la venta tiene todos sus códigos asignados
  verificarEstadoVenta(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}verificar-venta/${idVenta}`);
  }


  // ==========================================
  // --- MÉTODOS PARA PEDIDOS ONLINE (NUEVOS) ---
  // ==========================================

  // Enviar lista de strings ["PROD-001", "PROD-002"] a un detalle de pedido específico
  asignarCodigosPedido(idDetallePedido: number, codigos: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}pedido/${idDetallePedido}`, codigos);
  }

  // Verificar si el pedido tiene todos sus códigos asignados
  verificarEstadoPedido(idPedido: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}verificar-pedido/${idPedido}`);
  }

}