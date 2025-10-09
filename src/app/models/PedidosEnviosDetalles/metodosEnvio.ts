export interface metodoEnvio {
  idMetodoEnvio?: number;               // Long en Java → number en TS
  nombre?: string;                       // Obligatorio
  descripcion?: string;                 // Opcional
  costo?: number;                        // BigDecimal → number
  diasEstimadosEntregaMin?: number;    // Opcional
  diasEstimadosEntregaMax?: number;    // Opcional
  estaActivo?: boolean;                // Opcional, valor por defecto: true
  fechaCreacion?: string;              // OffsetDateTime → string ISO
  fechaActualizacion?: string;         // OffsetDateTime → string ISO
}