import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { categorias } from '../../models/ProductoStockModel/categorias';


@Injectable({
  providedIn: 'root'
})
export class CategoriasService {

  private baseUrl = 'http://localhost:8080/categorias/'; 

  constructor(private http: HttpClient) { }

  /**
   * GET: /categorias/findAll
   * Obtiene la lista completa de todas las categorías.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  /**
   * GET: /categorias/findById/{id}
   * Obtiene una categoría por su ID.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  // =================================================================
  // POST: /categorias/save - Implementación con FormData
  // =================================================================
  /**
   * Guarda una nueva categoría enviando datos JSON y un archivo (opcional)
   * como multipart/form-data.
   * @param categoria Objeto de categoría (se convertirá a JSON string).
   * @param file Archivo de imagen a subir, puede ser null.
   */
  save(categoria: categorias, file: File | null): Observable<ApiResponse> {
    const formData = new FormData();

    // 1. Agregar el objeto categoría como JSON string bajo la clave "categoria"
    formData.append('categoria', JSON.stringify(categoria));

    // 2. Agregar el archivo bajo la clave "file" (si existe)
    if (file) {
      formData.append('file', file, file.name);
    }
    
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, formData);
  }

  // =================================================================
  // PUT: /categorias/updateById/{id} - Implementación con FormData
  // =================================================================
  /**
   * Actualiza una categoría existente por su ID, con datos JSON y un archivo (opcional).
   * @param id ID de la categoría a actualizar.
   * @param categoria Objeto de categoría con los datos actualizados.
   * @param file Nuevo archivo de imagen a subir (opcional).
   */
  update(id: number, categoria: categorias, file: File | null): Observable<ApiResponse> {
    const formData = new FormData();

    // 1. Agregar el objeto categoría como JSON string bajo la clave "categoria"
    formData.append('categoria', JSON.stringify(categoria));

    // 2. Agregar el archivo bajo la clave "file" (si existe)
    if (file) {
      formData.append('file', file, file.name);
    }
    
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, formData);
  }

  /**
   * DELETE: /categorias/deleteById/{id}
   * Elimina una categoría por su ID (eliminación física).
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }

  // =================================================================
  // PUT: /categorias/updateEstado/{id} - Eliminación Lógica
  // =================================================================
  /** 
   * PUT: /categorias/updateEstado/{id}
   * Realiza la eliminación lógica (inactivación) de una categoría.
   */

   cambiarByIdEstado(id: number,estado:number): Observable<ApiResponse> {
    // Usamos PUT sin cuerpo para enviar la solicitud de cambio de estado (inactivación).
    console.log(`Servicio: Cambiando estado de ID ${id} a ${estado}`);
    return this.http.put<ApiResponse>(`${this.baseUrl}updateEstado/${id}/${estado}`, null);
  }
}
  