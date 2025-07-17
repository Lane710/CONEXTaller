// src/app/models/usuario.ts (o la ruta que uses para tus interfaces)

import { personas } from './personas';
import { roles } from './roles';

export interface usuarios {
  username: string; // @Id, no @GeneratedValue, así que es requerido al crear
  passwordHash: string; // Requerido para seguridad
  email: string;
  fechaCreacion?: string; // LocalDateTime en Java -> string (ISO 8601) en TS. Opcional porque el backend lo genera.
  estado?: number; // Integer en Java -> number en TS. Opcional si el backend tiene un valor por defecto.

  // IDs para las relaciones, ya que el backend espera solo los IDs en el JSON de entrada
  rol: roles; // Coincide con el campo id_rol en la tabla 'usuarios' para la FK al rol
  persona: personas; // Coincide con el campo id_persona en la tabla 'usuarios' para la FK a la persona (CI)
}
