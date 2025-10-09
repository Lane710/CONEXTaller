export interface forma_pago {
  idFormaPago?: number;       // Long en Java → number en TS
  nombre?: string;             // Obligatorio
  descripcion?: string;       // Opcional si puede ser nulo
  estado?: string;            // Valor por defecto: 'activo'
}
