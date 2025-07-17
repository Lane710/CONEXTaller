import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // ¡Importa HttpClient!
import { Observable } from 'rxjs'; // ¡Importa Observable para manejar respuestas asíncronas!
import { ApiResponse } from '../../models/api-response';
import { AgregarDetalleCarritoRequest } from '../../models/CartModel/AgregarDetalleCarritoRequest';

// Importa tus interfaces actualizadas (que ahora usan 'Decimal' internamente)

@Injectable({
  providedIn: 'root'
})
export class CarritoService {

  private baseUrl = 'http://localhost:8080/carrito/';
  private baseUrl2 = 'http://localhost:8080/detalle-carrito/'; 

  // Inyecta el HttpClient en el constructor
  constructor(private http: HttpClient) { }

 
  listarProductosDeUsuario(usuario: string): Observable<ApiResponse> {
    
    return this.http.get<ApiResponse>(`${this.baseUrl}${usuario}/productos`);
  }

  agregarProductoACarrito(usuario: string | null, request: AgregarDetalleCarritoRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}${usuario}/productos`, request);
  }

  
  eliminarProductoDeCarrito(usuario: string, idDetalleCarrito: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}${usuario}/productos/${idDetalleCarrito}`);
  }

 
  actualizarCantidadDetalle(idDetalleCarrito: number, cantidad: number): Observable<ApiResponse> {
   
    return this.http.put<ApiResponse>(`${this.baseUrl2}AumentoCandtidad/${idDetalleCarrito}/${cantidad}`, {});
  }
}