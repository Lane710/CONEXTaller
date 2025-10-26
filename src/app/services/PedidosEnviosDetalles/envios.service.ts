import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { envios } from '../../models/PedidosEnviosDetalles/envios';

@Injectable({
  providedIn: 'root'
})
export class EnviosService {

  private Url='http://localhost:8080/envios/';
  
  constructor( private http:HttpClient) { }

  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  findById(idEnvio: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findById/${idEnvio}`);
  }

  save(envio:envios):Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.Url}save`,envio);
  }

  /**
   * --- ¡CORREGIDO! ---
   * La URL ahora apunta a "updateById/{id}" para que coincida con el controlador.
   */
  update(idEnvio: number, envioData: any): Observable<ApiResponse> {
    // CAMBIO: de "update/" a "updateById/"
    return this.http.put<ApiResponse>(`${this.Url}updateById/${idEnvio}`, envioData);
  }

  cambiarStado(idEnvio:number,estado:string):Observable<ApiResponse>{
    console.log('cambiarStado', idEnvio, estado);
    return this.http.put<ApiResponse>(`${this.Url}updateEstado/${idEnvio}/${estado}`,'');
  }

  findByPedidoId(idPedido: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByPedidoId/${idPedido}`);
  }
}
