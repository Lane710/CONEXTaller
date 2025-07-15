import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para NgIf, NgFor, etc.
import { StockDTO } from '../../../DTOs/Produc/StockDTO';
import { ActivatedRoute, Router } from '@angular/router';
import { StockService } from '../../../services/stock.service';
import { ProductoPropiedadService } from '../../../services/Secundarios/producto-propiedad.service';

// Interfaz para la estructura de la propiedad
interface ProductProperty {
  idPropiedad: number;
  id_producto: number;
  tipo: 'atributo' | 'caracteristica' | 'especificacion';
  nombre: string;
  valor: string;
}

@Component({
  selector: 'app-detalles',
  standalone: true, // Asumiendo que es un componente standalone
  imports: [CommonModule], // Importa CommonModule aquí
  templateUrl: './detalles.component.html',
  styleUrl: './detalles.component.css'
})
export class DetallesComponent implements OnInit {
  productId: number | null = null;
  productDetails: StockDTO | null = null; // Para almacenar los detalles completos del producto
  isLoading: boolean = true; // Para mostrar un estado de carga
  error: string | null = null; // Para manejar errores
  variablePrueba: string = 'Hola, soy una variable de prueba'; // Variable de prueba para verificar el funcionamiento del componente

  // Nuevas propiedades para almacenar las propiedades filtradas
  especificaciones: ProductProperty[] = [];
  atributos: ProductProperty[] = [];
  caracteristicas: ProductProperty[] = [];

  constructor(
    private route: ActivatedRoute, // Para leer parámetros de la ruta
    private router: Router, // Para navegación (ej. botón de volver)
    private stockService: StockService, // Para obtener los detalles del producto
    private ProductoPropiedadService: ProductoPropiedadService // Servicio para manejar propiedades del producto
  ) {}

    ngOnInit(): void {
    // Suscribirse a los cambios de parámetros de la ruta
    // Esto es útil si el ID del producto pudiera cambiar sin recargar el componente
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.productId = +idParam; // Convierte el string a número
        console.log('ID del producto:', this.productId);
        // Llamar al servicio para obtener los detalles del producto
        this.stockService.findByIdStock(this.productId).subscribe({
          next: (response) => {
            this.productDetails = response.data[0]; // Asigna los detalles del producto
            console.log('Detalles del producto1:', this.productDetails?.producto.nombre);
            this.isLoading = false; // Cambia el estado de carga a falso
            console.log('Detalles del producto:', this.productDetails);

            // Llamada a sus propiedades
            this.detallesProducto();
          },
          error: () => {
            this.error = 'Error al cargar los detalles del producto.';
            this.isLoading = false; // Cambia el estado de carga a falso
            console.error(this.error);
          }
        });
      } else {
        this.error = 'No se encontró el ID del producto en la URL.';
        this.isLoading = false;
        console.error(this.error);
      }
    });
  }

  detallesProducto(): void {
    if (this.productId) {
      this.ProductoPropiedadService.listarAtributoProducto(this.productId).subscribe({
        next: (response) => {
          console.log('Propiedades del producto:', response);
          if (response && response.data) {
            // Reiniciar arrays para evitar duplicados en recargas
            this.especificaciones = [];
            this.atributos = [];
            this.caracteristicas = [];

            // Filtrar las propiedades por tipo
            response.data.forEach((prop: ProductProperty) => {
              if (prop.tipo === 'especificacion') {
                this.especificaciones.push(prop);
              } else if (prop.tipo === 'atributo') {
                this.atributos.push(prop);
              } else if (prop.tipo === 'caracteristica') {
                this.caracteristicas.push(prop);
              }
            });
          }
        },
        error: (err) => {
          console.error('Error al obtener las propiedades del producto:', err);
          // Puedes manejar el error aquí si quieres mostrar un mensaje al usuario
        }
      });
    } else {
      console.error('No se pudo obtener las propiedades del producto: ID no disponible.');
    }
  }

}