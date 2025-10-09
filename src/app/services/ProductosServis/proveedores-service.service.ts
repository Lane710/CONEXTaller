// src/app/services/proveedores.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { proveedor } from '../../models/proveedor';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService { // Nombre del servicio basado en el recurso

  // La URL base coincide con el @RequestMapping("/proveedores/") del backend
  private baseUrl = 'http://localhost:8080/proveedores/'; 

  constructor(private http: HttpClient) { }

  /**
   * GET: /proveedores/findAll
   * Obtiene la lista completa de todos los proveedores.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  /**
   * GET: /proveedores/findById/{id}
   * Obtiene un proveedor por su ID.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  /**
   * POST: /proveedores/save
   * Guarda un nuevo proveedor.
   */
  save(proveedor: proveedor): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, proveedor);
  }

  /**
   * PUT: /proveedores/updateById/{id}
   * Actualiza un proveedor existente por su ID.
   */
  update(id: number, proveedor: proveedor): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, proveedor);
  }

  /**
   * DELETE: /proveedores/deleteById/{id}
   * Elimina un proveedor por su ID.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }
}