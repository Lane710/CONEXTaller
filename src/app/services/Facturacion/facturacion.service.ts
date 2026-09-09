import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private baseUrl = 'https://conex-api-backend.duckdns.org/api/facturacion';

  constructor(private http: HttpClient) { }

  emitirFacturaPedidoOnline(idPedido: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/pedido/${idPedido}`, {});
  }

  emitirFacturaVentaFisica(idVenta: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/venta/${idVenta}`, {});
  }

  obtenerFacturaPedido(idPedido: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/pedido/${idPedido}`);
  }

  obtenerFacturaVenta(idVenta: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/venta/${idVenta}`);
  }

  // --- NUEVO MÉTODO PARA ENVIAR CORREO ---
  enviarFacturaCorreo(email: string, pdfFile: Blob, fileName: string): Observable<any> {
    const formData = new FormData();
    
    // Los nombres 'email' y 'pdf' deben coincidir EXACTAMENTE con los @RequestParam del backend
    formData.append('email', email);
    formData.append('pdf', pdfFile, fileName);

    // Cuando usas FormData, Angular automáticamente configura el Content-Type a 'multipart/form-data'
    return this.http.post(`${this.baseUrl}/enviar-correo`, formData);
  }
}