// src/app/models/ProductModel/proveedores.ts

export interface proveedores {
  idProveedor?: number;
  
  // En Java es nullable = false, debe ser obligatorio aquí
  nombreEmpresa: string; 
  
  // Agregado para coincidir con el backend
  nit?: string; 
  
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  ciudad?: string;
  
  // El backend lo inicializa como "Bolivia" si viene nulo
  pais?: string; 
  
  // El backend lo inicializa en true (activo)
  estado?: boolean; 
  
  // LocalDateTime -> Recibido como String ISO
  fechaRegistro?: string; 
  
  notas?: string;
}