// src/app/models/ProductModel/unidadesFisicas.ts
import { productos } from './productos';

export interface UnidadesFisicas {
  idUnidad?: number; // Long -> number

  // Relación ManyToOne con el producto
  // Usamos Partial para evitar cargar todo el objeto si solo necesitamos el ID
  producto: Partial<productos>;

  // Corresponde a codigo_identificador_unico (Serial, IMEI, etc.)
  codigoIdentificador: string;

  /**
   * Estado de la unidad individual:
   * 1: Disponible
   * 2: Vendido
   * 3: Dañado
   * 4: Garantía
   */
  estadoUnidad: 1 | 2 | 3 | 4 | number;

  // LocalDateTime -> Recibido como String ISO
  fechaIngreso?: string;
}