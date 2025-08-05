import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { pedidos } from '../../models/PedidosEnviosDetalles/pedidos';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private Url= 'http://localhost:8080/pedidos/';

  constructor( private http: HttpClient) { }

  finAll():Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(pedido:pedidos):Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.Url}save`,pedido);
  }
}
