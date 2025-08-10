import { Component, OnInit } from '@angular/core';
import { VentasService } from '../../../services/ventasTienda/ventas.service';
import { ventas } from '../../../models/Ventas/ventas';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modificar-venta',
  imports: [],
  templateUrl: './modificar-venta.component.html',
  styleUrl: './modificar-venta.component.css'
})
export class ModificarVentaComponent implements OnInit {
  // Aquí puedes definir las propiedades necesarias para tu componente
    idVenta: number=0;
    venta:ventas | null = null;
  constructor(private ventasS:VentasService, private route: ActivatedRoute) {}

  ngOnInit(): void {
  this.idVenta = +this.route.snapshot.paramMap.get('idVenta')!;
  this.ventasS.findById(this.idVenta).subscribe(response => {
    this.venta = response.data;
    console.log(this.venta);
  });
  }

  // Aquí puedes agregar los métodos necesarios para manejar la lógica de modificación de ventas

}
