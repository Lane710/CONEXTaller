// src/app/services/tipo-propiedad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { tipoPropiedad } from '../../models/ProductoStockModel/tipoPropiedad';


@Injectable({
  providedIn: 'root'
})
export class TipoPropiedadService {

  // La URL base debe coincidir con el @RequestMapping del backend
  private baseUrl = 'https://bdconex.onrender.com/tipo-propiedades/'; 

  constructor(private http: HttpClient) { }

  /**
   * GET: /tipo-propiedades/findAll
   * Obtiene todas las propiedades.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  /**
   * GET: /tipo-propiedades/findById/{id}
   * Obtiene una propiedad por su ID.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  /**
   * POST: /tipo-propiedades/save
   * Guarda una nueva propiedad.
   */
  save(tipoPropiedad: tipoPropiedad): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, tipoPropiedad);
  }

  /**
   * PUT: /tipo-propiedades/updateById/{id}
   * Actualiza una propiedad existente por su ID.
   */
  update(id: number, tipoPropiedad: tipoPropiedad): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, tipoPropiedad);
  }

  /**
   * DELETE: /tipo-propiedades/deleteById/{id}
   * Elimina una propiedad por su ID.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }

  /**
   * GET: /tipo-propiedades/findByTipo/{tipo}
   * Busca propiedades por el valor del campo 'tipo'.
   */
  findByTipo(tipo: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findByTipo/${tipo}`);
  }

  /**
   * GET: /tipo-propiedades/findByNombre/{nombre}
   * Busca propiedades por el nombre.
   */
  findByNombre(nombre: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findByNombre/${nombre}`);
  }

  // Agrega este método al servicio
findByTipoAndNombreExacto(tipo: string, nombre: string): Observable<ApiResponse> {
  return this.http.get<ApiResponse>(`${this.baseUrl}findByTipoAndNombreExacto/${tipo}/${nombre}`);
}
}