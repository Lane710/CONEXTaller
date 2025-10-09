import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '../../models/api-response';
import { Observable } from 'rxjs';
import { direccionesEnvio } from '../../models/PedidosEnviosDetalles/direccionesEnvio';

@Injectable({
  providedIn: 'root'
})
export class DireccionEnvioService { // <-- ¡Nombre de la clase cambiado!

  private Url='http://localhost:8080/direcciones-envio/';;

  constructor( private http:HttpClient) { }


  /**
   * GET: /direcciones-envio/findAll
   * Obtiene todas las direcciones de envío.
   */
  findAll(): Observable<ApiResponse>{ // Renombrado de 'listado' a 'findAll'
    return this.http.get<ApiResponse>(`${this.Url}findAll`);
  }

  /**
   * POST: /direcciones-envio/save
   * Guarda una nueva dirección de envío.
   */
  save(envio:direccionesEnvio):Observable<ApiResponse>{
    return this.http.post<ApiResponse>(`${this.Url}save`, envio);
  }
  
  /**
   * GET: /direcciones-envio/findById/{id}
   * Obtiene una dirección por su ID.
   */
  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findById/${id}`);
  }

  /**
   * PUT: /direcciones-envio/updateById/{id}
   * Actualiza una dirección existente.
   */
  update(envio: direccionesEnvio, id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.Url}updateById/${id}`, envio);
  }

  /**
   * DELETE: /direcciones-envio/deleteById/{id}
   * Elimina una dirección por su ID.
   */
  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.Url}deleteById/${id}`);
  }

  /**
   * GET: /direcciones-envio/findByUsername/{username}
   * Busca direcciones por el nombre de usuario.
   */
  findByUsername(username: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.Url}findByUsername/${username}`);
  }

  /**
   * PUT: /direcciones-envio/setAsDefault/{idDireccionEnvio}/{username}
   * Establece una dirección como predeterminada.
   */
  setAsDefault(idDireccionEnvio: number, username: string): Observable<ApiResponse> {
    // Se envía 'null' como cuerpo ya que los parámetros van en la URL.
    return this.http.put<ApiResponse>(`${this.Url}setAsDefault/${idDireccionEnvio}/${username}`, null); 
  }
}