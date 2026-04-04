import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private baseUrl = 'http://localhost:8080/api/facturacion';

  constructor(private http: HttpClient) { }

  // Llama al endpoint de pedido online
  emitirFacturaPedidoOnline(idPedido: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/pedido/${idPedido}`, {});
  }

  // Llama al endpoint de venta en tienda (para cuando lo necesites en otro módulo)
  emitirFacturaVentaFisica(idVenta: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/venta/${idVenta}`, {});
  }

  // NUEVO: Consulta si ya existe una factura para este pedido
  obtenerFacturaPedido(idPedido: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pedido/${idPedido}`);
  }

  // Añade este método a tu FacturacionService
  obtenerFacturaVenta(idVenta: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/venta/${idVenta}`);
  }
}