// src/app/services/ventas/clientes.service.ts

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

  constructor(private http: HttpClient) { }

  // 🔥 TEMPORAL: Comenta los headers para pruebas
  /*
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
  */

  findAll(): Observable<ApiResponse> {
    // return this.http.get<ApiResponse>(`${this.apiUrl}findAll`, { headers: this.getHeaders() });
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`); // Sin headers
  }

  findById(ci: string): Observable<ApiResponse> {
    // return this.http.get<ApiResponse>(`${this.apiUrl}findById/${ci}`, { headers: this.getHeaders() });
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${ci}`);
  }

  save(cliente: clientes): Observable<ApiResponse> {
    // return this.http.post<ApiResponse>(`${this.apiUrl}save`, cliente, { headers: this.getHeaders() });
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, cliente);
  }

  update(cliente: clientes): Observable<ApiResponse> {
    console.log('Actualizando cliente:', cliente.ci);
    // return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${cliente.ci}`, cliente, { headers: this.getHeaders() });
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${cliente.ci}`, cliente);
  }

  deleteById(ci: string): Observable<ApiResponse> {
    // return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${ci}`, { headers: this.getHeaders() });
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${ci}`);
  }


// En tu clientes.service.ts
findOrCreate(cliente: clientes): Observable<ApiResponse> {
  console.log('Ejecutando findOrCreate para cliente:', cliente);
  return this.http.post<ApiResponse>(`${this.apiUrl}findOrCreate`, cliente);
}
  
}