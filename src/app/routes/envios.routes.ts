// En tu archivo EnviosRouter

import { Routes } from "@angular/router";
import { ListEnviosComponent } from "../interfaces/envios/list-envios/list-envios.component";
import { RegistrarEnvioComponent } from "../interfaces/envios/registrar-envio/registrar-envio.component";
import { ModificarEnvioComponent } from "../interfaces/envios/modificar-envio/modificar-envio.component";

export const EnviosRouter: Routes = [
    {
        path: 'envios/list-envios', 
        component: ListEnviosComponent 
    },
    {
        // CAMBIO AQUÍ: Añadimos /:idVenta
        path: 'envios/registrarEnvio/:idVenta', 
        component: RegistrarEnvioComponent 
    },
    { path: 'modificarEnvio/:idEnvio', component: ModificarEnvioComponent },
];