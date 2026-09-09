import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { envios } from '../../models/PedidosEnviosDetalles/envios';

@Injectable({
  providedIn: 'root'
})
export class EnviosService {

  private Url='https://conex-api-backend.duckdns.org/envios/';
  
  constructor( private http:HttpClient) { }

  // Métodos existentes...
  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  findById(idEnvio: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findById/${idEnvio}`);
  }

  save(envio:envios):Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.Url}save`,envio);
  }

  update(idEnvio: number, envioData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.Url}updateById/${idEnvio}`, envioData);
  }

  cambiarStado(idEnvio:number,estado:string):Observable<ApiResponse>{
    console.log('cambiarStado', idEnvio, estado);
    return this.http.put<ApiResponse>(`${this.Url}updateEstado/${idEnvio}/${estado}`,'');
  }

  findByPedidoId(idPedido: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByPedidoId/${idPedido}`);
  }

  // NUEVOS MÉTODOS:

  /**
   * Buscar envío por ID de venta
   */
  findByVentaId(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByVentaId/${idVenta}`);
  }

  /**
   * Buscar envío por código de seguimiento
   */
  findByCodigoSeguimiento(codigoSeguimiento: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByCodigoSeguimiento/${codigoSeguimiento}`);
  }

  /**
   * Buscar envío por ID de pedido o venta (endpoint combinado)
   */
  buscarEnvio(idPedido?: number, idVenta?: number): Observable<ApiResponse> {
    let params: any = {};
    
    if (idPedido !== undefined && idPedido !== null) {
      params.idPedido = idPedido.toString();
    }
    
    if (idVenta !== undefined && idVenta !== null) {
      params.idVenta = idVenta.toString();
    }

    return this.http.get<ApiResponse>(`${this.Url}buscar`, { params });
  }

  /**
   * Eliminar envío por ID
   */
  deleteById(idEnvio: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.Url}deleteById/${idEnvio}`);
  }
}