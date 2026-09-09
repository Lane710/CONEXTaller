import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { tipo } from '../../models/ProductoStockModel/tipo';

@Injectable({
  providedIn: 'root'
})
export class TipoService {
  private baseUrl = 'https://conex-api-backend.duckdns.org/tipos/';

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  findBySubcategoria(idSubcategoria: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findBySubcategoria/${idSubcategoria}`);
  }

  // ================== NUEVO MÉTODO ==================
  save(tipo:tipo): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, tipo);
  }
// ... dentro de TipoService
update(id: number, tipo: tipo): Observable<ApiResponse> {
  return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, tipo);
}
  // =================================================================
// GET: /tipos/findByNombre/{nombre}
// =================================================================
/**
 * Obtiene un tipo por su nombre.
 * @param nombre Nombre del tipo a buscar.
 */
findByNombre(nombre: string): Observable<ApiResponse> {
  return this.http.get<ApiResponse>(`${this.baseUrl}findByNombre/${nombre}`);
}
}
