// src/app/models/api-response.ts

/**
 * Interfaz para la estructura de respuesta estándar de tu backend de Spring Boot.
 *
 * @param isSuccess Indica si la operación fue exitosa (booleano).
 * @param message Mensaje descriptivo del resultado de la operación (string).
 * @param data Contiene los datos reales devueltos por la API (puede ser de cualquier tipo,
 * como un array de objetos, un solo objeto, o null/undefined si no hay datos).
 * @param httpStatus El estado HTTP de la respuesta (ej. "OK", "CREATED", "BAD_REQUEST").
 */
export interface ApiResponse {
  success: boolean;
  message: string;
  data: any; // Usamos 'any' porque 'data' puede contener diferentes tipos (Usuarios[], Usuarios, string, etc.)
  httpStatusCode: string | number; 
}