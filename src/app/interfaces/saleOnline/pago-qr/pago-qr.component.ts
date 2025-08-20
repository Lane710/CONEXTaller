import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'; // Importa Router
import { ApiResponse } from '../../../models/api-response'; // Asegúrate de importar tus modelos
import { DetalleCarritoProducto } from '../../../DTOs/Cart/DetalleCarritoProducto';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-pago-qr',
  standalone: true,
  imports: [NgIf],
  templateUrl: './pago-qr.component.html',
  styleUrl: './pago-qr.component.css'
})
export class PagoQRComponent implements OnInit {
  datosPedido: any; // O un tipo más específico si lo defines
  pedido: pedidos | undefined;
  detallesCarrito: DetalleCarritoProducto[] | undefined;

  constructor(private router: Router) {
    // Captura los datos del estado del router en el constructor
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.datosPedido = navigation.extras.state['datosDelPedido'];
      // Puedes asignar los datos a las propiedades del componente
      this.pedido = this.datosPedido.pedido;
      this.detallesCarrito = this.datosPedido.detallesCarrito;
      console.log('Datos del pedido recibidos en PagoQRComponent:', this.datosPedido);
    } else {
      console.log('No se recibieron datos del pedido.');
      // Opcional: redirigir a una página de error o a home si no hay datos
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    // Si necesitas usar los datos para alguna inicialización, puedes hacerlo aquí
  }
}