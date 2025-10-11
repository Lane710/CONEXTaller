// src/app/services/producto-valor-propiedad.service.ts (Nombre sugerido)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';
// Se asume que ApiResponse o 'any' es el tipo de respuesta (dejaremos 'any' como estaba)

@Injectable({
  providedIn: 'root'
})
export class ProductoValorPropiedadService { // <-- Nombre de clase cambiado

  // URL base ajustada para coincidir con el @RequestMapping del backend
  private baseUrl = 'http://localhost:8080/producto-valores-propiedad/'; 

  constructor(private http: HttpClient) { }

  findAll(): Observable<any> {
    // GET: /producto-valores-propiedad/findAll
    return this.http.get<any>(`${this.baseUrl}findAll`); 
  }

  findById(id: number): Observable<any> {
    // GET: /producto-valores-propiedad/findById/{id}
    return this.http.get<any>(`${this.baseUrl}findById/${id}`);
  }

save(productoValorPropiedad: ProductoValorPropiedad): Observable<any> {
  // POST: /producto-valores-propiedad/save
  return this.http.post<any>(`${this.baseUrl}save`, productoValorPropiedad);
}

  update(id: number, productoValorPropiedad: ProductoValorPropiedad): Observable<any> {
    // PUT: /producto-valores-propiedad/updateById/{id}
    return this.http.put<any>(`${this.baseUrl}updateById/${id}`, productoValorPropiedad);
  }

  deleteById(id: number): Observable<any> {
    // DELETE: /producto-valores-propiedad/deleteById/{id}
    return this.http.delete<any>(`${this.baseUrl}deleteById/${id}`);
  }
  
  // *** El método listarAtributoProducto ha sido eliminado (Ver sección 2) ***
}