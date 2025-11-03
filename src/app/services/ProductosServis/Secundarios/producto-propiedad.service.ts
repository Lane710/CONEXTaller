// src/app/services/producto-valor-propiedad.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';
import { ApiResponse } from '../../../models/api-response';

@Injectable({
  providedIn: 'root'
})
export class ProductoValorPropiedadService {
  private baseUrl = 'http://localhost:8080/producto-valores-propiedad/';

  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findAll`);
  }

  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findById/${id}`);
  }

  save(productoValorPropiedad: ProductoValorPropiedad): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}save`, productoValorPropiedad);
  }

  update(id: number, productoValorPropiedad: ProductoValorPropiedad): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}updateById/${id}`, productoValorPropiedad);
  }

  deleteById(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}deleteById/${id}`);
  }


   findByProductoId(idProducto: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}findByProductoId/${idProducto}`);
  }
}