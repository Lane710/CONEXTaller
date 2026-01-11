import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // ==========================
  // MÉTODOS PARA PRODUCTOS
  // ==========================

  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/productos`);
  }

  addProducto(producto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/productos`, producto);
  }

  updateProducto(id: number | string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/productos/${id}`, updates);
  }

  deleteProducto(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/productos/${id}`);
  }

  // ==========================
  // Métodos anteriores (Stock)
  // ==========================

  getStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stock`);
  }

  addStock(item: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/stock`, item);
  }

  updateStock(id: number | string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/stock/${id}`, updates);
  }

  deleteStock(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/stock/${id}`);
  }

  // ==========================
  // Categorías
  // ==========================

  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categoria`);
  }

  // ==========================
  // Pedidos
  // ==========================

  getPedidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pedidos`);
  }

  addPedido(pedido: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pedidos`, pedido);
  }

  updatePedido(id: number | string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/pedidos/${id}`, updates);
  }

  deletePedido(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/pedidos/${id}`);
  }

  // ==========================
  // Ventas
  // ==========================

  getVentas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas`);
  }

  addVenta(venta: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ventas`, venta);
  }

  updateVenta(id: number | string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/ventas/${id}`, updates);
  }

  deleteVenta(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/ventas/${id}`);
  }

  // ==========================
  // Usuarios
  // ==========================

  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`);
  }

  addUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios`, usuario);
  }

  updateUsuario(id: number | string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/usuarios/${id}`, updates);
  }

  deleteUsuario(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`);
  }
}
