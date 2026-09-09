import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importa HttpHeaders
import { clientes } from '../../models/Ventas/clientes';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = 'https://conex-api-backend.duckdns.org/clientes/';

  constructor(private http: HttpClient) { }

  // 🔥 DESCOMENTAR Y ARREGLAR LOS HEADERS
  private getHeaders(): HttpHeaders {
    // Obtener el token de donde lo guardes al hacer Login (ej: localStorage)
    const token = localStorage.getItem('token'); // Cambia 'token' por el nombre que uses
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // Si hay token, lo adjuntamos a la petición
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`, { headers: this.getHeaders() });
  }

  findById(ci: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${ci}`, { headers: this.getHeaders() });
  }

  save(cliente: clientes): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, cliente, { headers: this.getHeaders() });
  }

  update(cliente: clientes): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${cliente.ci}`, cliente, { headers: this.getHeaders() });
  }

  deleteById(ci: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${ci}`, { headers: this.getHeaders() });
  }

  findOrCreate(cliente: clientes): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}findOrCreate`, cliente, { headers: this.getHeaders() });
  }
}