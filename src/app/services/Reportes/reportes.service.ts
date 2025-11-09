import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response'; // Asegúrate de que esta ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  
  // URLS ANTIGUAS
  private baseUrl = 'http://localhost:8080/reportes/';
  
  // URL NUEVA PARA REPORTES DE GANANCIAS
  private gananciasBaseUrl = 'http://localhost:8080/api/reportes/ganancias/';

  constructor(private http: HttpClient) { }

  /**
   * GET: /reportes/ventas-detallado
   * Obtiene el reporte detallado de ventas con filtros.
   */
  findReporteVentas(fechaInicio: string, fechaFin: string, estadoVenta?: string, idFormaPago?: string, usernameTrabajador?: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (estadoVenta) params = params.append('estadoVenta', estadoVenta);
    if (idFormaPago) params = params.append('idFormaPago', idFormaPago);
    if (usernameTrabajador) params = params.append('usernameTrabajador', usernameTrabajador);

    return this.http.get<ApiResponse>(`${this.baseUrl}ventas-detallado`, { params });
  }

  /**
   * GET: /reportes/pedidos-detallado
   * Obtiene el reporte detallado de pedidos con filtros.
   */
  findReportePedidos(fechaInicio: string, fechaFin: string, estadoPedido?: string, idFormaPago?: number, usernameCliente?: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (estadoPedido) params = params.append('estadoPedido', estadoPedido);
    if (idFormaPago) params = params.append('idFormaPago', idFormaPago.toString());
    if (usernameCliente) params = params.append('usernameCliente', usernameCliente);

    return this.http.get<ApiResponse>(`${this.baseUrl}pedidos-detallado`, { params });
  }

  /**
   * GET: /reportes/productos/bajo-stock
   * Obtiene el reporte de productos con bajo stock.
   */
  findReporteBajoStock(umbralStock: number, idCategoria?: number): Observable<ApiResponse> {
    let params = new HttpParams().set('umbralStock', umbralStock.toString());
    if (idCategoria) params = params.append('idCategoria', idCategoria.toString());

    return this.http.get<ApiResponse>(`${this.baseUrl}productos/bajo-stock`, { params });
  }

  /**
   * GET: /reportes/productos/mas-vendidos
   * Obtiene el reporte de productos más vendidos.
   */
  findReporteMasVendidos(fechaInicio: string, fechaFin: string, idCategoria?: number): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (idCategoria) params = params.append('idCategoria', idCategoria.toString());

    return this.http.get<ApiResponse>(`${this.baseUrl}productos/mas-vendidos`, { params });
  }

  /**
   * GET: /reportes/productos/maestro
   * Obtiene el reporte maestro de productos con filtros opcionales.
   */
  findReporteMaestroProductos(estadoProducto?: number, usuarioRegistro?: string, idCategoria?: number): Observable<ApiResponse> {
    let params = new HttpParams();

    if (estadoProducto !== null && estadoProducto !== undefined) params = params.append('estadoProducto', estadoProducto.toString());
    if (usuarioRegistro) params = params.append('usuarioRegistro', usuarioRegistro);
    if (idCategoria) params = params.append('idCategoria', idCategoria.toString());

    return this.http.get<ApiResponse>(`${this.baseUrl}productos/maestro`, { params });
  }

  /**
   * GET: /reportes/envios
   * Obtiene el reporte de envíos con filtros.
   */
  findReporteEnvios(fechaInicio: string, fechaFin: string, tipoOrigen?: string, estadoEnvio?: string, idMetodoEnvio?: number): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (tipoOrigen) params = params.append('tipoOrigen', tipoOrigen);
    if (estadoEnvio) params = params.append('estadoEnvio', estadoEnvio);
    if (idMetodoEnvio) params = params.append('idMetodoEnvio', idMetodoEnvio.toString());

    return this.http.get<ApiResponse>(`${this.baseUrl}envios`, { params });
  }

  // ====================================================================
  // 
  //     NUEVOS MÉTODOS DE REPORTE DE GANANCIAS
  // 
  // ====================================================================

  /**
   * GET: /api/reportes/ganancias/pedidos
   * Obtiene el reporte detallado de ganancias de pedidos (online).
   */
  getReporteGananciasPedidos(fechaInicio: string, fechaFin: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<ApiResponse>(`${this.gananciasBaseUrl}pedidos`, { params });
  }

  /**
   * GET: /api/reportes/ganancias/ventas
   * Obtiene el reporte detallado de ganancias de ventas (tienda).
   */
  getReporteGananciasVentas(fechaInicio: string, fechaFin: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<ApiResponse>(`${this.gananciasBaseUrl}ventas`, { params });
  }

  /**
   * GET: /api/reportes/ganancias/combinado
   * Obtiene el reporte combinado de ganancias (pedidos + ventas).
   */
  getReporteGananciasCombinado(fechaInicio: string, fechaFin: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<ApiResponse>(`${this.gananciasBaseUrl}combinado`, { params });
  }

  /**
   * GET: /api/reportes/ganancias/resumen
   * Obtiene el resumen ejecutivo de ganancias.
   */
  getResumenGanancias(fechaInicio: string, fechaFin: string): Observable<ApiResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<ApiResponse>(`${this.gananciasBaseUrl}resumen`, { params });
  }

  /**
   * GET: /api/reportes/ganancias/tipos
   * Obtiene la lista de tipos de reportes de ganancias disponibles.
   */
  getTiposReporteGanancias(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.gananciasBaseUrl}tipos`);
  }
}