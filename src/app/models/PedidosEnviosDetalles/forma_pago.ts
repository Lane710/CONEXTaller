// src/app/models/PaymentModel/forma_pago.ts

export interface forma_pago {
  idFormaPago?: number; 
  
  // Es mejor dejarlo obligatorio para que el formulario valide su presencia
  nombre: string; 
  
  descripcion?: string;
  
  // Puedes usar un union type si solo permites ciertos estados
  estado?: 'activo' | 'inactivo' | string; 
}