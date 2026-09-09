import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { pedidos } from '../../models/PedidosEnviosDetalles/pedidos';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private Url = 'https://conex-api-backend.duckdns.org/pedidos/';

  constructor(private http: HttpClient) {}

  finAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(pedido: pedidos): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.Url}save`, pedido);
  } // Nuevo método para actualizar el estado del pedido

  actualizarEstado(id: number, nuevoEstado: string): Observable<ApiResponse> {
    // La URL debe coincidir con el endpoint de tu backend:
    // https://bdconex.onrender.com/pedidos/actualizarEstado/{id}/{nuevoEstado}
    return this.http.put<ApiResponse>(
      `${this.Url}actualizarEstado/${id}/${nuevoEstado}`,
      {}
    );
  } // Nuevo método para obtener la lista de pedidos por nombre de usuario
  getListadoProductosPorPedidoUsuario(
    username: string
  ): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(
      `${this.Url}ListadoProductosPorPedidoUsuario/${username}`
    );
  }

  //modfiicar estado del productod de detalle pedido
  modificarEstado(id: string, estado: string) {
    return this.http.put<ApiResponse>(
      `${this.Url}updateEstado/${id}/${estado}`,
      {}    
    );
  }

  update(id:number,pedido:pedidos){
    return this.http.put<ApiResponse>(`${this.Url}updateById/${id}`,pedido)
  }


  // Nuevo método para confirmar y despachar (pasando a ENTREGADO con códigos)
 confirmarYDespachar(id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.Url}despachar/${id}`, {});
  }

  // Nuevo método para cancelar enviando la razón
  cancelarPedidoConRazon(id: number, razon: string): Observable<ApiResponse> {
    // Enviamos un objeto JSON con la razón al backend
    return this.http.put<ApiResponse>(`${this.Url}cancelar/${id}`, { razonCancelacion: razon });
  }
}
