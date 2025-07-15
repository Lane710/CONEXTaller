// src/app/services/producto-propiedad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoPropiedad } from '../../models/ProductoPropiedad';

@Injectable({
  providedIn: 'root'
})
export class ProductoPropiedadService {

  private baseUrl = 'http://localhost:8080/producto-propiedades'; // Ajusta la URL base de tu backend

  constructor(private http: HttpClient) { }

  findAll(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/findAll`);
  }

  findById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/findById/${id}`);
  }

  save(productoPropiedad: ProductoPropiedad): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save`, productoPropiedad);
  }

  update(id: number, productoPropiedad: ProductoPropiedad): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/updateById/${id}`, productoPropiedad);
  }

  deleteById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/deleteById/${id}`);
  }

  listarAtributoProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/listadoAtributoProducto/${id}`);
  }
}
