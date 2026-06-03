import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { subcategoria } from '../../models/ProductoStockModel/subcategorias';

export interface ValidationResult {
  canDelete: boolean;
  message: string;
  relatedProducts?: number;
  relatedProductsList?: any[];
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubcategoriaService {

  private baseUrl = 'https://bdconex.onrender.com/subcategorias/'; 

  constructor(private http: HttpClient) { }

  /**
   * GET: /subcategorias/findAll
   * Obtiene la lista completa de todas las subcategorías.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  /**
   * GET: /subcategorias/findById/{id}
   * Obtiene una subcategoría por su ID.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  /**
   * GET: /subcategorias/ListForCategoria/{idCategoria}
   * Obtiene subcategorías por categoría
   */
  ListadoSubCategoriasPorCategoria(idCategoria: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}ListForCategoria/${idCategoria}`);
  }

  // =================================================================
  // POST: /subcategorias/save - Implementación con FormData
  // =================================================================
  /**
   * Guarda una nueva subcategoría enviando datos JSON y un archivo (opcional)
   * como multipart/form-data.
   * @param subcategoria Objeto de subcategoría (se convertirá a JSON string).
   * @param file Archivo de imagen a subir, puede ser null.
   */
  save(subcategoria: subcategoria, file: File | null): Observable<ApiResponse> {
    const formData = new FormData();

    // 1. Agregar el objeto subcategoría como JSON string bajo la clave "subcategoria"
    formData.append('subcategoria', JSON.stringify(subcategoria));

    // 2. Agregar el archivo bajo la clave "file" (si existe)
    if (file) {
      formData.append('file', file, file.name);
    }
    
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, formData);
  }

  // =================================================================
  // PUT: /subcategorias/updateById/{id} - Implementación con FormData
  // =================================================================
  /**
   * Actualiza una subcategoría existente por su ID, con datos JSON y un archivo (opcional).
   * @param id ID de la subcategoría a actualizar.
   * @param subcategoria Objeto de subcategoría con los datos actualizados.
   * @param file Nuevo archivo de imagen a subir (opcional).
   */
  update(id: number, subcategoria: subcategoria, file: File | null): Observable<ApiResponse> {
    const formData = new FormData();

    // 1. Agregar el objeto subcategoría como JSON string bajo la clave "subcategoria"
    formData.append('subcategoria', JSON.stringify(subcategoria));

    // 2. Agregar el archivo bajo la clave "file" (si existe)
    if (file) {
      formData.append('file', file, file.name);
    }
    
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, formData);
  }

  /**
   * DELETE: /subcategorias/deleteById/{id}
   * Elimina una subcategoría por su ID (eliminación física).
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }

  // =================================================================
  // PUT: /subcategorias/updateEstado/{id} - Eliminación Lógica
  // =================================================================
  /**
   * PUT: /subcategorias/updateEstado/{id}
   * Realiza la eliminación lógica (inactivación) de una subcategoría.
   */
  cambiarEstado(id: number, estadoNumerico: number): Observable<ApiResponse> {
    console.log("Servicio cambiarEstado:", id, estadoNumerico);
    return this.http.put<ApiResponse>(`${this.baseUrl}updateEstado/${id}/${estadoNumerico}`, null);
  }

  // =================================================================
  // ✅ NUEVO MÉTODO: Validar si se puede eliminar subcategoría
  // =================================================================
  /**
   * GET: /subcategorias/{id}/can-delete
   * Valida si una subcategoría puede ser eliminada (sin productos asociados)
   */
  canDeleteSubcategoria(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}${id}/can-delete`);
  }
}