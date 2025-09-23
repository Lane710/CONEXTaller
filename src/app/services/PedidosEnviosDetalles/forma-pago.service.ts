// src/app/services/plataforma/forma-pago.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response'; // Asegúrate de que la ruta sea correcta
import { forma_pago } from '../../models/PedidosEnviosDetalles/forma_pago';


@Injectable({
  providedIn: 'root'
})
export class FormaPagoService {
  
  private apiUrl = 'http://localhost:8080/formas-pago/'; // Reemplaza la URL si es necesario

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las formas de pago.
   * @returns Un Observable con la respuesta de la API.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  /**
   * Busca una forma de pago por su ID.
   * @param id El ID de la forma de pago.
   * @returns Un Observable con la respuesta de la API.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${id}`);
  }

  /**
   * Guarda una nueva forma de pago.
   * @param formaPago El objeto de tipo forma_pago a guardar.
   * @returns Un Observable con la respuesta de la API.
   */
  save(formaPago: forma_pago): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, formaPago);
  }

  /**
   * Actualiza una forma de pago existente por su ID.
   * @param formaPago El objeto de tipo forma_pago con los datos actualizados.
   * @param id El ID de la forma de pago a actualizar.
   * @returns Un Observable con la respuesta de la API.
   */
  update(formaPago: forma_pago, id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${id}`, formaPago);
  }

  /**
   * Elimina una forma de pago por su ID.
   * @param id El ID de la forma de pago a eliminar.
   * @returns Un Observable con la respuesta de la API.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${id}`);
  }
}