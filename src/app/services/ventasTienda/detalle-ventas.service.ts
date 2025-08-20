import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { detalleVenta } from '../../models/Ventas/detalleVenta';

@Injectable({
  providedIn: 'root',
})
export class DetalleVentasService {
  private apiUrl = 'http://localhost:8080/detalleventas/';

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }
  save(detalleventa: detalleVenta): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, detalleventa);
  }
  listarPorIdVenta(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}listaPorVenta/${idVenta}`);
  }
  update(detalleventa: detalleVenta): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}modificarDetalle`, detalleventa);
  }
  delete(idDetalleVenta: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${idDetalleVenta}`);
  }
}
