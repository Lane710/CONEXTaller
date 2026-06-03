import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { variante } from '../../models/ProductoStockModel/variante';

@Injectable({
  providedIn: 'root'
})
export class VariantesService {

  private baseUrl = 'https://bdconex.onrender.com/variantes/';

  constructor(private http: HttpClient) {}

  // =================================================================
  // GET: /variantes/findAll
  // =================================================================
  /**
   * Obtiene la lista completa de todas las variantes.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  // =================================================================
  // GET: /variantes/findById/{id}
  // =================================================================
  /**
   * Obtiene una variante por su ID.
   * @param id ID de la variante a buscar.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  // =================================================================
  // GET: /variantes/findByTipo/{idTipo}
  // =================================================================
  /**
   * Obtiene las variantes asociadas a un tipo específico.
   * @param idTipo ID del tipo al que pertenecen las variantes.
   */
  findByTipo(idTipo: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findByTipo/${idTipo}`);
  }

  // =================================================================
  // POST: /variantes/save
  // =================================================================
  /**
   * Crea una nueva variante.
   * @param variante Objeto con los datos de la variante a guardar.
   */
  save(variante: variante): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, variante);
  }

  // =================================================================
  // PUT: /variantes/updateById/{id}
  // =================================================================
  /**
   * Actualiza una variante existente por su ID.
   * @param id ID de la variante a actualizar.
   * @param variante Objeto con los datos actualizados.
   */
  update(id: number, variante: variante): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, variante);
  }

  // =================================================================
  // DELETE: /variantes/deleteById/{id}
  // =================================================================
  /**
   * Elimina una variante por su ID.
   * @param id ID de la variante a eliminar.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }

  // =================================================================
// GET: /variantes/findByNombre/{nombre}
// =================================================================
/**
 * Obtiene una variante por su nombre.
 * @param nombre Nombre de la variante a buscar.
 */
findByNombre(nombre: string): Observable<ApiResponse> {
  return this.http.get<ApiResponse>(`${this.baseUrl}findByNombre/${nombre}`);
}

}
