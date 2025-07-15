// src/app/services/stock.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiResponse } from '../models/api-response'; // Asegúrate de que esta ruta sea correcta
import { HttpClient } from '@angular/common/http';
import { productos } from '../models/productos'; // Asumiendo que aún necesitas la interfaz productos

// Si ProductosService no se usa en este archivo para 'findAll' o 'findByIdStock',
// no es necesario importarlo aquí, pero se mantiene si se usa para otras funciones.
import { ProductosService } from './productos.service'; // Mantener si necesario para otras operaciones
import { stock } from '../models/stock';

@Injectable({
  providedIn: 'root'
})
export class StockService { // Renombrado a StockService

  // ¡IMPORTANTE! Asegúrate de que este puerto y ruta base sean correctos para tu backend de stock.
  private apiUrl = 'http://localhost:8080/stock/'; // URL del API actualizada a /stock/
  private apiUrlP = 'http://localhost:8080/productos/';

  constructor(private http: HttpClient, private productosService: ProductosService) { } // Mantener productosService si es usado

  /**
   * Obtiene todos los ítems de stock.
   * Asume que la API de stock devuelve el objeto 'producto' completo dentro de cada 'stock'.
   */
  findAll(): Observable<ApiResponse> {
    // Si tu backend realmente devuelve el producto anidado, esta llamada es directa.
    // Si tu backend solo devuelve el ID del producto, necesitarías la lógica de switchMap y forkJoin de antes.
    return this.http.get<ApiResponse>(`${this.apiUrl}findAll`);
  }

  /**
   * Obtiene un ítem de stock por su ID.
   * Asume que la API de stock devuelve el objeto 'producto' completo dentro del 'stock'.
   */
  findByIdStock(idStock: number): Observable<ApiResponse> { // Renombrado a findByIdStock
    // Similar a findAll, asume que el backend devuelve el producto anidado.
    return this.http.get<ApiResponse>(`${this.apiUrl}findById/${idStock}`); // Uso de idStock
  }

  /**
   * Guarda un nuevo item de stock.
   * Envía el objeto 'stock' completo al backend, incluyendo el objeto 'producto' anidado.
   * @param stockData El objeto stock a guardar.
   */
  saveStock(stockData: stock): Observable<ApiResponse> { 
    return this.http.post<ApiResponse>(`${this.apiUrl}save`, stockData);
  }

  /**
   * Actualiza un item de stock existente.
   * Envía el objeto 'stock' completo al backend.
   * @param stockData El objeto stock con los datos actualizados.
   * @param idStock El ID del stock a actualizar.
   */
  updateStock(stockData: stock, idStock: number): Observable<ApiResponse> { // Renombrado a updateStock, tipo stock, idStock
    // Enviar el objeto 'stock' tal como lo recibimos del componente.
    return this.http.put<ApiResponse>(`${this.apiUrl}updateById/${idStock}`, stockData);
  }

  /**
   * Elimina un item de stock por su ID.
   * @param idStock El ID del stock a eliminar.
   */
  deleteByIdStock(idStock: number): Observable<ApiResponse> { // Nuevo método de eliminación, renombrado a deleteByIdStock
    return this.http.delete<ApiResponse>(`${this.apiUrl}deleteById/${idStock}`);
  }

  addStockProductos(idStock: number, cantidad:number): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}add-quantity/${idStock}/${cantidad}`, {});
  }

  ProductoporCategoria(num1: number,num2: number,num3: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrlP}ProductoCategorias/${num1}/${num2}/${num3}`);
  }

  StockDelProducto(num:number|undefined): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}producto/${num}`);
  }


}
