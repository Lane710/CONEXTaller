// src/app/services/personas.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { personas } from '../models/personas';

@Injectable({
  providedIn: 'root'
})
export class PersonasService {

  // ¡IMPORTANTE! Asegúrate de que el puerto aquí coincida con tu backend (8080 en tu configuración de Spring Boot)
  private apiUrl = 'http://localhost:8080/personas/';

  constructor(private http: HttpClient) { }

  /**
   * Guarda una nueva persona SIN foto.
   * Envía el objeto persona como JSON directamente en el cuerpo de la solicitud.
   * @param persona El objeto persona a guardar (sin la foto).
   */
  save(persona: personas): Observable<ApiResponse> {
    // HttpClient.post envía automáticamente el objeto como JSON con Content-Type: application/json
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, persona);
  }

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  findById(ci: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${ci}`);
  }

  /**
   * Actualiza una persona existente, permitiendo opcionalmente la subida de una nueva imagen.
   * Envía los datos como FormData (archivo + JSON).
   * @param persona El objeto persona con los datos actualizados.
   * @param ci El CI (ID) de la persona a actualizar.
   * @param file El nuevo archivo de imagen (opcional).
   */
  update(persona: personas, ci: string, file?: File): Observable<ApiResponse> {
    const formData = new FormData();

    // Añade el archivo si existe
    if (file) {
      formData.append('file', file, file.name);
    }

    // Convierte el objeto persona a un string JSON y añádelo al FormData
    // El nombre del campo debe coincidir con el @RequestParam del backend ("persona")
    formData.append('persona', JSON.stringify(persona));

    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${ci}`, formData);
  }

  /**
   * Realiza una eliminación lógica de la persona (cambia el estado si tu backend lo soporta con PUT).
   * @param ci El CI (ID) de la persona a eliminar.
   */
  deleteById(ci: string): Observable<ApiResponse> {
    // Si tu backend usa PUT para eliminación lógica, este es el enfoque correcto.
    // Si usa DELETE, la firma del método debería ser this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${ci}`);
    return this.http.put<ApiResponse>(`${this.apiUrl}deleteById/${ci}`, {});
  }
}
