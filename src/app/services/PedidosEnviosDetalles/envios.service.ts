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

  // Método para obtener el listado de envíos por el ID de un pedido
  findByPedidoId(idPedido: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByPedidoId/${idPedido}`);
  }

  // Se mantiene el método de listado general, aunque ya no lo uses directamente
  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(envio:envios):Observable<ApiResponse>{
      return this.http.post<ApiResponse>(`${this.Url}save`,envio);
    }
  cambiarStado(idEnvio:number,estado:string):Observable<ApiResponse>{
    console.log('cambiarStado', idEnvio, estado);
    return this.http.put<ApiResponse>(`${this.Url}updateEstado/${idEnvio}/${estado}`,'');
  }

}
