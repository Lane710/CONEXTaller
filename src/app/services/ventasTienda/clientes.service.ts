// src/app/services/ventas/clientes.service.ts

import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { clientes } from '../../models/Ventas/clientes';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = 'http://localhost:8080/clientes/';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los clientes.
   */
  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  /**
   * Busca un cliente por su ID.
   * @param ci El ID del cliente a buscar.
   */
  findById(ci: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${ci}`);
  }

  /**
   * Busca un cliente por su correo electrónico.
   * @param email El correo electrónico del cliente a buscar.
   */
  findByEmail(email: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findByEmail/${email}`);
  }

  /**
   * Registra un nuevo cliente.
   * @param cliente El objeto cliente a guardar.
   */
  save(cliente: clientes): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, cliente);
  }

  /**
   * Actualiza un cliente existente.
   * @param cliente El objeto cliente con los datos actualizados.
   */
  update(cliente: clientes): Observable<ApiResponse> {
    console.log('Actualizando cliente:', cliente.ci);
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${cliente.ci}`, cliente);
  }

  /**
   * Elimina un cliente por su ID.
   * @param ci El ID del cliente a eliminar.
   */
  deleteById(ci: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${ci}`);
  }
}