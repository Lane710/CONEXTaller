// src/app/services/productos.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { HttpClient } from '@angular/common/http';
import { productos } from '../models/productos'; // Importa 'productos'


@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  // ¡IMPORTANTE! Asegúrate de que el puerto aquí coincida con tu backend (8080 o 8081)
  // He puesto 8081 según tu instrucción, pero si tu backend sigue en 8080, cámbialo.
  private apiUrl = 'http://localhost:8080/productos/';
  private apiUrlCategoria = 'http://localhost:8080/categorias/';
  private apiUrlProveedor = 'http://localhost:8080/proveedores/';

  constructor(private http: HttpClient) { }

  findAll(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  findById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${id}`);
  }
  save(producto: productos, file?: File): Observable<ApiResponse> {
    const formData = new FormData();

    // Añade el archivo si existe
    if (file) {
      formData.append('file', file, file.name);
    }

    // Convierte el objeto producto a un string JSON y añádelo al FormData
    // El nombre del campo ('producto') debe coincidir con el @RequestParam del backend.
    formData.append('producto', JSON.stringify(producto));

    return this.http.post<ApiResponse>(`${this.apiUrl}save`, formData);
  }
  update(producto: productos, id: number, file?: File): Observable<ApiResponse> {
    const formData = new FormData();

    // Añade el archivo si existe
    if (file) {
      formData.append('file', file, file.name);
    }

    // Convierte el objeto producto a un string JSON y añádelo al FormData
    formData.append('producto', JSON.stringify(producto));

    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${id}`, formData);
  }

  // Métodos para obtener categorías y proveedores
  getCategorias(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrlCategoria}findAll`);
  }

  getProveedores(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrlProveedor}findAll`);
  }

  toggleProductStatus(id: number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}toggleStatus/${id}`, {});
  }

  checkProductExistence(productToCheck: productos): Observable<ApiResponse> {
    console.log('Verificando existencia del producto:', productToCheck);
    return this.http.post<ApiResponse>(`${this.apiUrl}check-existence`, productToCheck);
  }

  
}
