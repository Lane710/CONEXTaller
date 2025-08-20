import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidosService } from '../../../services/PedidosEnviosDetalles/pedidos.service';
import { EnviosService } from '../../../services/PedidosEnviosDetalles/envios.service';
import { pedidos } from '../../../models/PedidosEnviosDetalles/pedidos';
import { envios } from '../../../models/PedidosEnviosDetalles/envios';
import { detallePedido } from '../../../models/PedidosEnviosDetalles/detallePedido';
import { DetallePedidosService } from '../../../services/PedidosEnviosDetalles/detalle-pedidos.service';

// Para controlar el modal de Bootstrap de forma programática.
// No se necesita importar si ya tienes Bootstrap en tu proyecto
declare var bootstrap: any;

@Component({
  selector: 'app-list-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-pedidos.component.html',
  styleUrls: ['./list-pedidos.component.css'],
})
export class ListPedidosComponent implements OnInit {
  pedidos: pedidos[] = [];
  // Variable para almacenar el envío seleccionado y mostrarlo en el modal
  envioSeleccionado: envios | null = null;
  // Propiedad para almacenar los detalles del pedido seleccionado
  ListaDetallePedidoSelec: detallePedido[] = [];
  // Variable para almacenar el pedido seleccionado y sus detalles
  pedidoSeleccionado: pedidos | null = null;
  // NUEVO: Variable para almacenar el pedido que se va a cancelar
  pedidoParaCancelar: pedidos | null = null;

  constructor(
    private pedidosS: PedidosService,
    private enviosS: EnviosService,
    private detallePedidoS: DetallePedidosService
  ) {}

  ngOnInit(): void {
    this.listadoPedidos();
  }

  listadoPedidos() {
    const usernameFromLocalStorage = localStorage.getItem('current_username');

    if (usernameFromLocalStorage) {
      this.pedidosS
        .getListadoProductosPorPedidoUsuario(usernameFromLocalStorage)
        .subscribe({
          next: (response) => {
            
            console.log('Respuesta de pedidos:', response.data);
            this.pedidos = response.data;
          },
          error: (error) => {
            console.error('Error al obtener pedidos:', error);
          },
        });
    } else {
      console.error(
        'No se encontró el nombre de usuario en el almacenamiento local.'
      );
      this.pedidos = [];
    }
  }

  /**
   * Obtiene los datos de envío para un pedido y los muestra en un modal.
   * @param idPedido El ID del pedido para el cual se busca el envío.
   */
  verEnvio(idPedido: number) {
    this.envioSeleccionado = null;
    this.enviosS.findByPedidoId(idPedido).subscribe({
      next: (response) => {
        if (response.data) {
          this.envioSeleccionado = response.data;
          console.log('Envío encontrado:', this.envioSeleccionado);
        } else {
          console.log(
            'No se encontraron detalles de envío para el pedido:',
            idPedido
          );
          this.envioSeleccionado = null;
        }
      },
      error: (error) => {
        console.error('Error al obtener el envío:', error);
        this.envioSeleccionado = null;
      },
    });
  }

  /**
   * NUEVO: Prepara el pedido para la cancelación, asignándolo a la variable
   * y abre el modal de confirmación.
   * @param pedido El objeto de pedido a cancelar.
   */
  prepararCancelacion(pedido: pedidos) {
    this.pedidoParaCancelar = pedido;
    console.log("AAAAAAAAAAAAAAA", this.pedidoParaCancelar)
  }

  /**
   * NUEVO: Realiza la cancelación del pedido después de la confirmación del modal.
   */
  confirmarCancelacion() {
    
    if (this.pedidoParaCancelar && this.pedidoParaCancelar.idPedido) {
      this.pedidosS.actualizarEstado(this.pedidoParaCancelar.idPedido, 'cancelado').subscribe({
        next: (response) => {
          console.log(`El pedido #${this.pedidoParaCancelar?.idPedido} ha sido cancelado exitosamente.`, response);
          // Opcional: Cerrar el modal de confirmación
          const modalElement = document.getElementById('confirmarCancelacionModal');
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
          // Recargamos la lista de pedidos para reflejar el cambio
          this.listadoPedidos();
        },
        error: (error) => {
          console.error('Error al cancelar el pedido:', error);
        }
      });
    }
  }

  /**
   * Maneja la acción de ver los detalles de un pedido.
   * @param pedido El objeto de pedido para ver detalles.
   */
  verDetalles(pedido: pedidos) {
    console.log(`Mostrando detalles del pedido #${pedido.idPedido}.`);
    this.pedidoSeleccionado = pedido;
    this.ListaDetallePedidoSelec = [];

    if (pedido.idPedido) {
      this.detallePedidoS.getById(pedido.idPedido).subscribe({
        next: (response) => {
          console.log('Detalles del pedido:', response);
          this.ListaDetallePedidoSelec = response.data;
        },
        error: (error) => {
          console.error('Error al obtener detalles del pedido:', error);
        },
      });
    }
  }
}
