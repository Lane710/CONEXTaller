// src/app/models/ShipmentModel/metodoEnvio.ts

export interface metodoEnvio {
  idMetodoEnvio?: number; 
  
  // En Java es nullable = false y unique = true
  nombre: string; 
  
  descripcion?: string;
  
  // BigDecimal se mapea como number para cálculos en el front
  costo: number; 
  
  diasEstimadosEntregaMin?: number;
  diasEstimadosEntregaMax?: number;
  
  // El backend lo inicializa en true por defecto
  estaActivo?: boolean; 
  
  // OffsetDateTime llega como String ISO 8601
  fechaCreacion?: string;
  fechaActualizacion?: string;
}