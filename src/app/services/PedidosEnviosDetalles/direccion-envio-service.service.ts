import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { direccionesEnvio } from '../../models/PedidosEnviosDetalles/direccionesEnvio';

@Injectable({
  providedIn: 'root'
})
export class DireccionEnvioService {

  private Url='https://bdconex.onrender.com/direcciones-envio/';

  constructor( private http:HttpClient) { }
 
  save(direccion: direccionesEnvio): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.Url}save`, direccion);
  }

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }
  
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findById/${id}`);
  }

  /**
   * --- ¡MÉTODO CORREGIDO! ---
   * Actualiza una dirección existente.
   * La firma ahora es (id, body) para seguir la convención.
   */
  update(id: number, direccion: direccionesEnvio): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.Url}updateById/${id}`, direccion);
  }

  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.Url}deleteById/${id}`);
  }

  findByUsername(username: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByUsername/${username}`);
  }

  setAsDefault(idDireccionEnvio: number, username: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.Url}setAsDefault/${idDireccionEnvio}/${username}`, null); 
  }
}
