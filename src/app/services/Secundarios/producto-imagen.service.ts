// src/app/services/producto-imagen.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoImagen } from '../../models/ProductoImagen';
import { ApiResponse } from '../../models/api-response';


@Injectable({
  providedIn: 'root'
})
export class ProductoImagenService {

  private baseUrl = 'http://localhost:8080/producto-imagenes'; // Ajusta la URL base de tu backend

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las imágenes de producto.
   * GET /producto-imagenes/findAll
   */
  findAll(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/findAll`);
  }

  /**
   * Obtiene una imagen de producto por su ID.
   * GET /producto-imagenes/findById/{id}
   * @param id El ID de la imagen de producto.
   */
  findById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/findById/${id}`);
  }

  /**
   * Guarda una nueva imagen de producto.
   * Este método se usa cuando la URL de la imagen ya está disponible (no se sube un archivo aquí).
   * POST /producto-imagenes/save
   * @param productoImagen El objeto ProductoImagen a guardar.
   */
  save(productoImagen: ProductoImagen): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save`, productoImagen);
  }

  /**
   * Sube uno o varios archivos de imagen a Cloudinary y los guarda como ProductoImagen asociados a un producto.
   * POST /producto-imagenes/upload-and-save/{idProducto}
   * @param idProducto El ID del producto al que se asociarán las imágenes.
   * @param files La lista de archivos (File) a subir.
   */
  uploadAndSaveProductImages(idProducto: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file); // 'files' debe coincidir con @RequestParam("files") en el backend
    });

    // HttpClient automáticamente establece 'Content-Type' a 'multipart/form-data'
    // cuando se envía un FormData.
    return this.http.post<any>(`${this.baseUrl}/upload-and-save/${idProducto}`, formData);
  }

  /**
   * Obtiene todas las imágenes asociadas a un producto por su ID.
   * GET /producto-imagenes/findByProductoId/{idProducto}
   * @param idProducto El ID del producto.
   * @returns Un Observable con la ApiResponse que contiene la lista de ProductoImagen.
   */
  getProductImages(idProducto: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/findByProductoId/${idProducto}`);
  }

  /**
   * Actualiza una imagen de producto existente por su ID.
   * PUT /producto-imagenes/updateById/{id}
   * @param id El ID de la imagen de producto a actualizar.
   * @param productoImagen El objeto ProductoImagen con los datos actualizados.
   */
  update(id: number, productoImagen: ProductoImagen): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/updateById/${id}`, productoImagen);
  }

  /**
   * Elimina una imagen de producto por su ID.
   * DELETE /producto-imagenes/deleteById/{id}
   * @param id El ID de la imagen de producto a eliminar.
   */
  deleteById(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/deleteById/${id}`);
  }
}
