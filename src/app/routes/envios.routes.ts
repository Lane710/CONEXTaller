// En tu archivo EnviosRouter
import { Routes } from "@angular/router";
import { ListEnviosComponent } from "../interfaces/envios/list-envios/list-envios.component";
import { RegistrarEnvioComponent } from "../interfaces/envios/registrar-envio/registrar-envio.component";
import { ModificarEnvioComponent } from "../interfaces/envios/modificar-envio/modificar-envio.component";

export const EnviosRouter: Routes = [
    {
        // RUTA EXISTENTE: Para ver la lista Y abrir el modal de PEDIDO
        path: 'envios/list-envios/:idPedido', 
        component: ListEnviosComponent 
    },
    {
        // RUTA NUEVA: Para ver la lista Y abrir el modal de VENTA
        path: 'envios/list-envios-venta/:idVenta', 
        component: ListEnviosComponent 
    },
    {
        path: 'envios/list-envios', 
        component: ListEnviosComponent 
    },
    {
        path: 'envios/registrarEnvio/:idVenta', 
        component: RegistrarEnvioComponent 
    },
    { 
        path: 'modificarEnvio/:idEnvio', 
        component: ModificarEnvioComponent 
    },
];