export interface roles { // Cambiado a PascalCase: Rol (singular)
  idRol?: number;          // Es opcional porque el ID se genera en el backend
  nombreRol: string;       // Coincide con nombre_rol en tu entidad de backend y es NOT NULL
  descripcion?: string;
}