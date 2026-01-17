// src/app/models/AuditModel/auditoria.ts

import { usuarios } from "../PersonModel/usuarios";


export interface Auditoria {
  idAuditoria?: number;
  tablaAfectada: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  
  usuario?: Partial<usuarios>;
  
  // OffsetDateTime -> String ISO
  fecha?: string;
  
  descripcionCambio?: string;

  /**
   * Como en el backend es JSONB, Jackson lo enviará como un objeto.
   * Usamos 'any' para poder acceder a las propiedades dinámicas
   * de lo que se guardó antes y después.
   */
  registroAntes?: any;
  registroDespues?: any;
}