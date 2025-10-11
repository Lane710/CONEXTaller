import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { tipo } from '../../models/ProductoStockModel/tipo';

@Injectable({
  providedIn: 'root'
})
export class TiposService {

  private baseUrl = 'http://localhost:8080/tipos/';

  constructor(private http: HttpClient) {}

  // =================================================================
  // GET: /tipos/findAll
  // =================================================================
  /**
   * Obtiene la lista completa de todos los tipos.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  // =================================================================
  // GET: /tipos/findById/{id}
  // =================================================================
  /**
   * Obtiene un tipo por su ID.
   * @param id ID del tipo a buscar.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  // =================================================================
  // GET: /tipos/findBySubcategoria/{idSubcategoria}
  // =================================================================
  /**
   * Obtiene los tipos asociados a una subcategoría específica.
   * @param idSubcategoria ID de la subcategoría.
   */
  findBySubcategoria(idSubcategoria: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findBySubcategoria/${idSubcategoria}`);
  }

  // =================================================================
  // POST: /tipos/save
  // =================================================================
  /**
   * Crea un nuevo tipo.
   * @param tipo Objeto con los datos del tipo.
   */
  save(tipo: tipo): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, tipo);
  }

  // =================================================================
  // PUT: /tipos/updateById/{id}
  // =================================================================
  /**
   * Actualiza un tipo existente por su ID.
   * @param id ID del tipo a actualizar.
   * @param tipo Objeto con los datos actualizados.
   */
  update(id: number, tipo: tipo): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, tipo);
  }

  // =================================================================
  // DELETE: /tipos/deleteById/{id}
  // =================================================================
  /**
   * Elimina un tipo por su ID.
   * @param id ID del tipo a eliminar.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }
}
