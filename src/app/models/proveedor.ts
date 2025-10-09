export interface proveedor {
  idProveedor?: number;             // Long en Java → number en TS
  nombreEmpresa: string;            // Obligatorio
  nombreContacto?: string;          // Opcional
  emailContacto?: string;           // Opcional
  telefonoContacto?: string;        // Opcional
  ciudad?: string;                  // Opcional
  pais?: string;                    // Valor por defecto: "Bolivia"
  estado?: boolean;                 // Valor por defecto: true
  fechaRegistro?: string;           // LocalDateTime → string ISO
  notas?: string;                   // Texto libre
}