// src/app/models/subcategorias.ts

export interface subcategoria {
    idSubcategoria?: number;
    nombre: string;
    descripcion?: string;
    estado?: boolean; // El backend tiene un valor por defecto, así que es opcional
    fechaCreacion?: string;
    categoria?: number; // El backend tiene una FK 'id_categoria' como Long
}
