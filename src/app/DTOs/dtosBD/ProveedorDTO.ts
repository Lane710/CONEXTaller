// No necesitas importar 'categorias' en este caso

export interface ProveedorDTO {
  idProveedor: number;
  nombreEmpresa: string;
  nombreContacto?: string;
  emailContacto?: string;
  telefonoContacto?: string;
  ciudad?: string;
  pais?: string;
  estado?: boolean;
  fechaRegistro?: string | Date;
  notas?: string;
  

}