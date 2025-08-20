import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { clientes } from '../../models/Ventas/clientes';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = 'http://localhost:8080/clientes/';

   constructor( private http: HttpClient) { }

  findAll(): Observable<ApiResponse> {
      return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
    }
  save(cliente:clientes): Observable<ApiResponse> {
      return this.http.post<ApiResponse>(`${this.apiUrl}save`,cliente);
    }
    update(cliente:clientes): Observable<ApiResponse> {
      console.log('Actualizando cliente:', cliente.idCliente);
      return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${cliente.idCliente}`,cliente);
    }
}
