// src/app/services/proveedores.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response';
import { proveedores } from '../../models/ProductoStockModel/proveedores';


@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private baseUrl = 'http://localhost:8080/proveedores/'; 
  private categoriaUrl = 'http://localhost:8080/categorias/'; // 🆕 URL para categorías

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
  save(proveedor: proveedores): Observable<ApiResponse> {
    // 🆕 Asegurar que la categoría se envíe correctamente
    const proveedorToSend = this.prepareProveedorForBackend(proveedor);
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, proveedorToSend);
  }

  /**
   * PUT: /proveedores/updateById/{id}
   * Actualiza un proveedor existente por su ID.
   */
  update(id: number, proveedor: proveedores): Observable<ApiResponse> {
    // 🆕 Asegurar que la categoría se envíe correctamente
    const proveedorToSend = this.prepareProveedorForBackend(proveedor);
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, proveedorToSend);
  }

  /**
   * DELETE: /proveedores/deleteById/{id}
   * Elimina un proveedor por su ID.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }

  /**
   * PUT: /proveedores/changeEstado/{id}
   * Cambia el estado lógico del proveedor (true = activo, false = inactivo)
   */
  changeEstado(id: number, nuevoEstado: boolean): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}changeEstado/${id}`, nuevoEstado);
  }

  // 🆕 NUEVOS MÉTODOS PARA CATEGORÍAS

  /**
   * GET: /categorias/findAll
   * Obtiene todas las categorías para los dropdowns
   */
  findAllCategorias(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.categoriaUrl}findAll`);
  }

  /**
   * GET: /proveedores/findByCategoria/{idCategoria}
   * Obtiene proveedores por categoría
   */
  findByCategoria(idCategoria: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findByCategoria/${idCategoria}`);
  }

  // 🆕 MÉTODO PRIVADO PARA PREPARAR LOS DATOS
  private prepareProveedorForBackend(proveedor: proveedores): any {
    // Si se usa idCategoria directamente, crear objeto categoria
    if (proveedor.idCategoria && !proveedor.categoria) {
      return {
        ...proveedor,
        categoria: { idCategoria: proveedor.idCategoria }
      };
    }
    
    // Si ya viene con objeto categoria, usarlo directamente
    return proveedor;
  }


  /**
 * GET: /proveedores/verificarExistenciaProveedor
 * Verifica si ya existe un proveedor con nombreEmpresa, email o teléfono
 */
verificarExistenciaProveedor(
  nombreEmpresa: string,
  emailContacto: string,
  telefonoContacto: string
): Observable<ApiResponse> {
  const params = {
    nombreEmpresa,
    emailContacto,
    telefonoContacto
  };

  return this.http.get<ApiResponse>(`${this.baseUrl}verificarExistenciaProveedor`, { params });
}

}