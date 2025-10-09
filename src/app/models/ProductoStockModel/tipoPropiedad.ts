export interface tipoPropiedad {
  idTipoPropiedad?: number;   // Long en Java → number en TS
  tipo: string;               // Ej: "atributo", "caracteristica", etc.
  nombre: string;             // Nombre de la propiedad
  tipoDato: string;           // Ej: "texto", "número", "booleano", etc.
}