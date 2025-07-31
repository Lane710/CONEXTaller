import { Component, OnInit } from '@angular/core';
import { ApiResponse } from '../../../models/api-response';
import { RawDetalleCarritoProducto } from '../../../DTOs/Cart/ProductoEnCarrito';
import Decimal from 'decimal.js';
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { CarritoService } from '../../../services/CartServis/carrito.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-datos-cliente',
  imports: [NgFor, NgIf],
  templateUrl: './datos-cliente.component.html',
  styleUrl: './datos-cliente.component.css'
})
export class DatosClienteComponent implements OnInit {
  username: string = localStorage.getItem('current_username') || '';
 detallesCarrito: DetalleCarritoProducto[] = []; 
 subtotalCarrito: string = '0.00'; // Inicializa como string
  totalCarrito: string = '0.00'; // Inicializa como string


  //cONSTRUCTOR
  constructor(private carritoService: CarritoService) {}

  ngOnInit(): void {
    this.cargarProductoCarrito();
  }

  // Aquí puedes agregar métodos para manejar los datos del cliente, como guardar cambios, etc.


  cargarProductoCarrito(): void {
    console.log(`Cargando datos del cliente para el usuario: ${this.username}`);
    this.carritoService.listarProductosDeUsuario(this.username).subscribe({
          next: (response: ApiResponse) => {
            if (response.success) {
    
              const rawDetalles: RawDetalleCarritoProducto[] =
                response.data as RawDetalleCarritoProducto[];
    
              // Mapea y transforma los datos, asegurando que los campos monetarios sean 'string'
              this.detallesCarrito = rawDetalles.map(
                (item: RawDetalleCarritoProducto) => {
                  return {
                    ...item,
                    // Convertimos a Decimal para asegurar la precisión y luego de vuelta a string
                    precioUnitario: new Decimal(item.precioUnitario).toString(),
                    subtotal: new Decimal(item.subtotal).toString(),
                    producto: {
                      ...item.producto,
                      precio: new Decimal(item.producto.precio).toString(),
                    },
                  };
                }
              );
    
              console.log(
                'Productos del carrito (transformados a string para visualización):',
                this.detallesCarrito
              );
              this.calcularTotales(); // Calcula los totales después de cargar y transformar los datos
            } else {
              console.error(
                'Error al listar productos del carrito:',
                response.message
              );
              this.detallesCarrito = []; // Vacía el carrito en caso de error
              this.calcularTotales(); // Reinicia los totales
            }
          },
          error: (error) => {
            console.error('Error en la solicitud HTTP al listar productos:', error);
            this.detallesCarrito = []; // Vacía el carrito en caso de error de red
            this.calcularTotales(); // Reinicia los totales
          },
        });
  }
  calcularTotales(): void {
      let subtotalCalculado = new Decimal(0);
  
      this.detallesCarrito.forEach((item) => {
        // Suma los subtotales. item.subtotal es un string, lo convertimos a Decimal para la suma.
        subtotalCalculado = subtotalCalculado.plus(new Decimal(item.subtotal));
      });
  
      this.subtotalCarrito = subtotalCalculado.toString(); // Almacena el resultado como string
      this.totalCarrito = subtotalCalculado.toString(); // Asumiendo envío gratis por ahora, también como string
    }
}
