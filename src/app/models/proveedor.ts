export interface proveedor { // Cambiado a PascalCase: Proveedor (singular)
  idProveedor?: number;       // Es opcional porque el ID se genera en el backend
  nombreEmpresa: string;      // Coincide con tu entidad de backend
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  ciudad?: string;
  pais?: string;
  estado?: boolean;           // Añadido según tu entidad de backend (Boolean en Java -> boolean en TS)
  fechaRegistro?: string;     // Añadido según tu entidad de backend (LocalDateTime -> string)
  notas?: string;             // Añadido según tu entidad de backend
}