// src/app/models/ProductModel/tipoPropiedad.ts

export interface tipoPropiedad {
  // PK: Long -> number
  idTipoPropiedad?: number; 

  // Clasificación (ej: "Física", "Técnica")
  tipo: string; 

  // Nombre de la propiedad (ej: "Memoria RAM")
  nombre: string; 

  // Tipo de dato (ej: "number", "string", "boolean")
  // Útil para saber qué tipo de input mostrar en el formulario
  tipoDato: string; 
}