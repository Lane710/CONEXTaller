import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UnidadesFisicasService } from '../../../services/ProductosServis/unidades-fisicas.service'; // Ajusta rutas si es necesario
import { AsignacionUnidadesService } from '../../../services/ProductosServis/asignacion-unidades.service';


interface ItemEscaneo {
  idDetalleVenta: number;
  idProducto: number;
  nombreProducto: string;
  cantidadRequerida: number;
  codigosSeleccionados: string[]; 
}

@Component({
  selector: 'app-modal-scan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show" tabindex="-1" style="display: block;">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning text-dark">
            <h5 class="modal-title"><i class="fas fa-barcode me-2"></i>Asignar Números de Serie</h5>
            <button type="button" class="btn-close" [disabled]="guardando" (click)="cancelar()"></button>
          </div>
          
          <div class="modal-body bg-light">
            <div *ngIf="cargando" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3 text-muted">Buscando códigos disponibles...</p>
            </div>

            <div *ngIf="!cargando" class="container-fluid px-0">
              <div *ngFor="let item of itemsParaEscanear; let i = index" class="card mb-3 shadow-sm border-0">
                <div class="card-header bg-white border-bottom-0 pt-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="card-title text-primary fw-bold mb-0">{{ item.nombreProducto }}</h6>
                    <span class="badge bg-secondary">{{ item.cantidadRequerida }} unidades</span>
                  </div>
                </div>
                
                <div class="card-body pt-0">
                  <div class="row g-2">
                    <div class="col-md-6" *ngFor="let code of item.codigosSeleccionados; let j = index; trackBy: trackByIndex">
                      <div class="input-group">
                        <span class="input-group-text bg-white text-muted">#{{ j + 1 }}</span>
                        <input type="text" 
                               class="form-control" 
                               list="datalistOptions" 
                               [(ngModel)]="itemsParaEscanear[i].codigosSeleccionados[j]"
                               placeholder="Escanear serial..."
                               [class.is-valid]="esCodigoValido(itemsParaEscanear[i].codigosSeleccionados[j], item.idProducto)"
                               [class.is-invalid]="!esCodigoValido(itemsParaEscanear[i].codigosSeleccionados[j], item.idProducto) && itemsParaEscanear[i].codigosSeleccionados[j] !== ''">
                        
                        <datalist id="datalistOptions">
                          <option *ngFor="let unit of obtenerDisponiblesParaProducto(item.idProducto)" 
                                  [value]="unit.codigoIdentificador">
                            {{ unit.codigoIdentificador }}
                          </option>
                        </datalist>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-primary btn-lg w-100" 
                    [disabled]="!formularioValido() || guardando" 
                    (click)="confirmarAsignacion()">
              <span *ngIf="guardando" class="spinner-border spinner-border-sm me-2"></span>
              <span *ngIf="!guardando">Confirmar Entrega</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal { animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ModalScanComponent implements OnInit {
  @Input() detallesGuardados: any[] = []; 
  @Output() onConfirm = new EventEmitter<void>(); 

  itemsParaEscanear: ItemEscaneo[] = [];
  todosLosCodigosDisponibles: any[] = [];
  cargando: boolean = true;
  guardando: boolean = false;

  constructor(
    private unidadesService: UnidadesFisicasService,
    private asignacionService: AsignacionUnidadesService
  ) {}

  ngOnInit(): void {
    this.prepararDatos();
  }

  prepararDatos() {
    this.cargando = true;
    
    // Filtrar usando la data fusionada que enviamos desde el padre
    const detallesConSerial = this.detallesGuardados.filter(d => d.producto && d.producto.requiereSerial === true);
    
    console.log('Modal recibió:', this.detallesGuardados);
    console.log('Productos filtrados para escanear:', detallesConSerial);

    if (detallesConSerial.length === 0) {
      console.warn('El modal se abrió pero no encontró seriales (esto no debería pasar con la nueva lógica).');
      this.onConfirm.emit();
      return;
    }

    // ... (El resto de la lógica de mapeo sigue igual) ...
    this.itemsParaEscanear = detallesConSerial.map(detalle => ({
      idDetalleVenta: detalle.idDetalleVenta,
      idProducto: detalle.producto.idProducto,
      nombreProducto: detalle.producto.nombre,
      cantidadRequerida: detalle.cantidad,
      codigosSeleccionados: new Array(detalle.cantidad).fill('') 
    }));

    const idsProductos = detallesConSerial.map(d => d.producto.idProducto);
    
    this.unidadesService.findDisponiblesBatch(idsProductos).subscribe({
      next: (res) => {
        if (res.success) {
          this.todosLosCodigosDisponibles = res.data;
        }
        this.cargando = false;
      },
      error: () => {
        alert('Error cargando códigos disponibles');
        this.cargando = false;
      }
    });
  }

  obtenerDisponiblesParaProducto(idProducto: number) {
    return this.todosLosCodigosDisponibles.filter(u => u.idProducto === idProducto);
  }

  esCodigoValido(codigo: string, idProducto: number): boolean {
    if (!codigo) return false;
    return this.todosLosCodigosDisponibles.some(
      u => u.codigoIdentificador === codigo.trim() && u.idProducto === idProducto
    );
  }

  formularioValido(): boolean {
    return this.itemsParaEscanear.every(item => 
      item.codigosSeleccionados.every(code => code !== '' && this.esCodigoValido(code, item.idProducto))
    );
  }

  confirmarAsignacion() {
    this.guardando = true;
    const peticiones = this.itemsParaEscanear.map(item => 
      this.asignacionService.asignarCodigosVenta(item.idDetalleVenta, item.codigosSeleccionados)
    );

    forkJoin(peticiones).subscribe({
      next: () => {
        this.guardando = false;
        this.onConfirm.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Error: Algunos códigos podrían no estar disponibles.');
        this.guardando = false;
      }
    });
  }

  // ✅ ESTE ERA EL MÉTODO QUE FALTABA
  cancelar() {
    if(confirm('La venta ya se cobró y el stock se descontó. ¿Seguro que quieres salir sin asignar los códigos seriales?')) {
      this.onConfirm.emit(); // Forzamos el cierre y éxito
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}