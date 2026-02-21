import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class AsignacionUnidadesService {
  private apiUrl = 'http://localhost:8080/asignaciones/';

  constructor(private http: HttpClient) { }

  // Enviar lista de strings ["PROD-001", "PROD-002"] a un detalle específico
  asignarCodigosVenta(idDetalleVenta: number, codigos: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}venta/${idDetalleVenta}`, codigos);
  }
}