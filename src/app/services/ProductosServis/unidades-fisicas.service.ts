import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response'; // Asegúrate de que la ruta sea correcta
import { UnidadesFisicas } from '../../models/ProductoStockModel/UnidadesFisicas';


@Injectable({
  providedIn: 'root'
})
export class UnidadesFisicasService {

  // URL base coincidiendo con tu @RequestMapping("/unidades-fisicas")
  private apiUrl = 'https://bdconex.onrender.com/unidades-fisicas';

  constructor(private http: HttpClient) { }

  /**
   * 1. Historial completo (Admin)
   * Obtiene todas las unidades (Vendidas, dañadas, disponibles) de un producto.
   */
  findByProducto(idProducto: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/findByProducto/${idProducto}`);
  }

  /**
   * 2. 🔥 SOLO DISPONIBLES (Individual)
   * Obtiene solo las unidades con estado = 1 para un producto específico.
   */
  findDisponibles(idProducto: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/disponibles/${idProducto}`);
  }

  /**
   * 3. Buscar por código exacto
   * Útil si tienes un input para verificar un serial específico.
   */
  findByCodigo(codigo: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/codigo/${codigo}`);
  }

  /**
   * 4. Registrar nueva unidad
   * Guarda una unidad física individual en la BD.
   */
  save(unidad: UnidadesFisicas): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/save`, unidad);
  }

  /**
   * 5. Actualizar estado
   * Cambia el estado de una unidad (ej: 1->3 para Dañado).
   */
  updateEstado(id: number, nuevoEstado: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/updateEstado/${id}/${nuevoEstado}`, null);
  }

  /**
   * 🔥🔥 6. CARGA MASIVA PARA VENTAS (Batch)
   * Envía un array de IDs de productos [10, 25, 40] y recibe todos sus códigos disponibles.
   * Este es el que usarás al abrir el modal de escaneo.
   */
  findDisponiblesBatch(productIds: number[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/disponibles-batch`, productIds);
  }
}