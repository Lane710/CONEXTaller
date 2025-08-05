import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { detallePedido } from '../../models/PedidosEnviosDetalles/detallePedido';

@Injectable({
  providedIn: 'root'
})
export class DetallePedidosService {

  private Url= 'http://localhost:8080/detalle-pedidos/';

  constructor(private http:HttpClient) { }

  listado():Observable<ApiResponse>{
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  save(detallePedidido:detallePedido): Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.Url}save`,detallePedidido);
  }
}
