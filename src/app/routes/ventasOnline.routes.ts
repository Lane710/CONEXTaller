import { Routes } from '@angular/router';
import { DatosClienteComponent } from '../interfaces/saleOnline/DatosCliente/datos-cliente.component';
import { ListEnviosComponent } from '../interfaces/envios/list-envios/list-envios.component';
import { PagoQRComponent } from '../interfaces/saleOnline/pago-qr/pago-qr.component';
import { ListPedidoComponent } from '../interfaces/saleOnline/list-sale/list-sale.component';


export const ventasOnline: Routes = [
  { path: 'datosCliente', component: DatosClienteComponent},
  //direcciones para modulo envios
  { path: 'envios/listado', component: ListEnviosComponent},
  //redireccion a la pagina de pago QR
  { path: 'pedidoOnline/pagoQR', component: PagoQRComponent},
  //listado de pedidos de la tienda online
  { path: 'pedidoOnline/Listado', component: ListPedidoComponent},
];