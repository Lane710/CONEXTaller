import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { ventas } from '../../models/Ventas/ventas';

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private apiUrl = 'http://localhost:8080/ventas/';

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }
  save(venta: ventas): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, venta);
  }

  //cambiar el estado de comletado a cancelado
  cancelarConfirmarVenta(idVenta: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}cancelarConfirmarVenta/${idVenta}`,
      null
    );
  }

  findById(idVenta: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${idVenta}`);
  }
}
