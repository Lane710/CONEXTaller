import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UnidadesFisicasService } from '../../../services/ProductosServis/unidades-fisicas.service';
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
          <div
            class="modal-header text-white"
            [ngClass]="esConsulta ? 'bg-info' : 'bg-warning text-dark'"
          >
            <h5 class="modal-title">
              <i class="fas fa-barcode me-2"></i>
              {{
                esConsulta
                  ? 'Detalle de Números de Serie'
                  : 'Asignar Números de Serie'
              }}
            </h5>
            <button
              type="button"
              class="btn-close"
              [ngClass]="{ 'btn-close-white': esConsulta }"
              [disabled]="guardando"
              (click)="intentarCancelar()"
            ></button>
          </div>

          <div class="modal-body bg-light">
            <div *ngIf="cargando" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3 text-muted">Buscando códigos disponibles...</p>
            </div>

            <div *ngIf="!cargando" class="container-fluid px-0">
              <div *ngIf="esConsulta" class="alert alert-info py-2 mb-3">
                <i class="bi bi-info-circle-fill me-2"></i>
                Esta asignación ya tiene todos sus códigos de serie completados.
              </div>

              <div
                *ngFor="let item of itemsParaEscanear; let i = index"
                class="card mb-3 shadow-sm border-0"
              >
                <div class="card-header bg-white border-bottom-0 pt-3">
                  <div
                    class="d-flex justify-content-between align-items-center"
                  >
                    <h6 class="card-title text-primary fw-bold mb-0">
                      {{ item.nombreProducto }}
                    </h6>
                    <span class="badge bg-secondary"
                      >{{ item.cantidadRequerida }} unidades</span
                    >
                  </div>
                </div>

                <div class="card-body pt-0">
                  <div class="row g-2">
                    <div
                      class="col-md-6"
                      *ngFor="
                        let code of item.codigosSeleccionados;
                        let j = index;
                        trackBy: trackByIndex
                      "
                    >
                      <div class="input-group">
                        <span class="input-group-text bg-white text-muted">
                          <i
                            [ngClass]="
                              item.codigosSeleccionados[j]
                                ? 'bi bi-check-circle-fill text-success'
                                : 'bi bi-upc-scan'
                            "
                          ></i>
                          <span class="ms-1">#{{ j + 1 }}</span>
                        </span>
                        <input
                          type="text"
                          class="form-control"
                          [attr.list]="
                            esConsulta ? null : 'list-' + item.idProducto
                          "
                          [(ngModel)]="item.codigosSeleccionados[j]"
                          [placeholder]="
                            esConsulta ? 'Sin código' : 'Escanear serial o seleccionar...'
                          "
                          [disabled]="esConsulta"
                          [class.is-valid]="
                            !esConsulta &&
                            esCodigoValido(
                              item.codigosSeleccionados[j],
                              item.idProducto
                            )
                          "
                          [class.is-invalid]="
                            !esConsulta &&
                            esCodigoInvalido(
                              item.codigosSeleccionados[j],
                              item.idProducto
                            )
                          "
                        />
                        <datalist
                          *ngIf="!esConsulta"
                          [id]="'list-' + item.idProducto"
                        >
                          <option
                            *ngFor="
                              let unit of obtenerDisponiblesParaProducto(
                                item.idProducto
                              )
                            "
                            [value]="unit.codigoIdentificador"
                          >
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
            <button
              type="button"
              class="btn btn-lg w-100"
              [ngClass]="esConsulta ? 'btn-secondary' : 'btn-primary'"
              [disabled]="guardando || (!esConsulta && !formularioValido())"
              (click)="esConsulta ? confirmarSalida() : confirmarAsignacion()"
            >
              <span
                *ngIf="guardando"
                class="spinner-border spinner-border-sm me-2"
              ></span>
              <span>{{
                esConsulta ? 'Cerrar Vista' : 'Confirmar Entrega'
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      *ngIf="mostrarConfirmacionSalida"
      class="modal-backdrop fade show"
      style="z-index: 1060; backdrop-filter: blur(2px);"
    ></div>
    <div
      *ngIf="mostrarConfirmacionSalida"
      class="modal fade show"
      tabindex="-1"
      style="display: block; z-index: 1065;"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4">
          <div class="modal-body text-center p-5">
            <h4 class="fw-bold mb-3">¿Salir sin guardar?</h4>

            <p class="text-secondary mb-4" style="font-size: 1.1rem;">
              <ng-container *ngIf="tipoEntidad === 'venta'">
                La venta ya se cobró y el stock fue descontado.<br />
              </ng-container>
              <ng-container *ngIf="tipoEntidad === 'pedido'">
                Este pedido ya se encuentra registrado en el sistema.<br />
              </ng-container>
              Si sales ahora, la asignación de códigos
              <strong>quedará incompleta</strong>.
            </p>

            <div class="d-flex justify-content-center gap-3 mt-2">
              <button
                type="button"
                class="btn btn-light border px-4 py-2 fw-semibold rounded-pill w-50"
                (click)="cancelarSalida()"
              >
                Volver
              </button>
              <button
                type="button"
                class="btn btn-danger px-4 py-2 fw-semibold rounded-pill shadow-sm w-50"
                (click)="confirmarSalida()"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal {
        animation: fadeIn 0.3s;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      input:disabled {
        background-color: #f8f9fa !important;
        cursor: not-allowed;
        font-weight: 500;
        color: #495057 !important;
      }
    `,
  ],
})
export class ModalScanComponent implements OnInit {
  @Input() detallesGuardados: any[] = [];
  @Input() esConsulta: boolean = false;
  @Input() tipoEntidad: 'venta' | 'pedido' = 'venta';
  @Output() onConfirm = new EventEmitter<void>();

  itemsParaEscanear: ItemEscaneo[] = [];
  todosLosCodigosDisponibles: any[] = [];
  cargando: boolean = true;
  guardando: boolean = false;
  mostrarConfirmacionSalida: boolean = false;

  constructor(
    private unidadesService: UnidadesFisicasService,
    private asignacionService: AsignacionUnidadesService,
  ) {}

  ngOnInit(): void {
    this.prepararDatos();
  }

  prepararDatos() {
    this.cargando = true;

    // 🔥 CORRECCIÓN CLAVE AQUÍ 🔥: Hacemos que sea flexible a diferentes estructuras
    this.itemsParaEscanear = this.detallesGuardados.map((detalle) => {
      
      const cantidad = detalle.cantidad || detalle.cantidadRequerida || 1;
      const listaCodigos = new Array(cantidad).fill('');

      if (detalle.codigosExistentes && detalle.codigosExistentes.length > 0) {
        detalle.codigosExistentes.forEach((codigo: string, index: number) => {
          if (index < listaCodigos.length) {
            listaCodigos[index] = codigo;
          }
        });
      }

      return {
        idDetalleVenta: detalle.idDetalleVenta || detalle.idDetalle, 
        idProducto: detalle.idProducto || (detalle.producto ? detalle.producto.idProducto : 0),
        nombreProducto: detalle.nombre || detalle.nombreProducto || (detalle.producto ? detalle.producto.nombre : 'Desconocido'),
        cantidadRequerida: cantidad,
        codigosSeleccionados: listaCodigos,
      };
    });

    if (this.esConsulta) {
      this.cargando = false;
      return;
    }

    const idsProductos = this.itemsParaEscanear.map((item) => item.idProducto).filter(id => id > 0);

    if (idsProductos.length === 0) {
      this.cargando = false;
      return;
    }

    this.unidadesService.findDisponiblesBatch(idsProductos).subscribe({
      next: (res) => {
        if (res.success) {
          this.todosLosCodigosDisponibles = res.data;

          this.itemsParaEscanear.forEach((item) => {
            item.codigosSeleccionados.forEach((c) => {
              if (c && c.trim() !== '') {
                const yaEstaEnLista = this.todosLosCodigosDisponibles.some(
                  (u) =>
                    u.codigoIdentificador === c &&
                    u.idProducto === item.idProducto,
                );
                if (!yaEstaEnLista) {
                  this.todosLosCodigosDisponibles.push({
                    codigoIdentificador: c,
                    idProducto: item.idProducto,
                  });
                }
              }
            });
          });
        }
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        console.error('Error al cargar unidades disponibles');
      },
    });
  }

  obtenerDisponiblesParaProducto(idProducto: number) {
    return this.todosLosCodigosDisponibles.filter(
      (u) => u.idProducto === idProducto,
    );
  }

  esCodigoValido(codigo: string, idProducto: number): boolean {
    if (this.esConsulta) return true;
    if (!codigo) return false;

    const trimCode = codigo.trim();
    const existeEnBase = this.todosLosCodigosDisponibles.some(
      (u) => u.codigoIdentificador === trimCode && u.idProducto === idProducto,
    );
    const repetidoEnForm = this.esCodigoDuplicado(trimCode);

    return existeEnBase && !repetidoEnForm;
  }

  esCodigoDuplicado(codigo: string): boolean {
    if (!codigo) return false;
    let contador = 0;
    const trimCode = codigo.trim();

    this.itemsParaEscanear.forEach((item) => {
      item.codigosSeleccionados.forEach((c) => {
        if (c.trim() === trimCode) contador++;
      });
    });
    return contador > 1;
  }

  esCodigoInvalido(codigo: string, idProducto: number): boolean {
    if (this.esConsulta) return false;
    if (!codigo) return false;
    return !this.esCodigoValido(codigo, idProducto);
  }

  formularioValido(): boolean {
    if (this.esConsulta) return true;
    return this.itemsParaEscanear.every((item) =>
      item.codigosSeleccionados.every((code) =>
        this.esCodigoValido(code, item.idProducto),
      ),
    );
  }

  confirmarAsignacion() {
    if (this.esConsulta) {
      this.confirmarSalida();
      return;
    }

    if (!this.formularioValido()) {
      alert('Hay códigos duplicados o inválidos. Por favor revise.');
      return;
    }

    this.guardando = true;

    const peticiones = this.itemsParaEscanear.map((item) => {
      if (this.tipoEntidad === 'venta') {
        return this.asignacionService.asignarCodigosVenta(
          item.idDetalleVenta,
          item.codigosSeleccionados,
        );
      } else {
        return this.asignacionService.asignarCodigosPedido(
          item.idDetalleVenta,
          item.codigosSeleccionados,
        );
      }
    });

    forkJoin(peticiones).subscribe({
      next: () => {
        this.guardando = false;
        this.onConfirm.emit();
      },
      error: (err) => {
        console.error(err);
        alert('Error: Algunos códigos podrían no estar disponibles.');
        this.guardando = false;
      },
    });
  }

  intentarCancelar() {
    if (this.esConsulta) {
      this.confirmarSalida();
    } else {
      this.mostrarConfirmacionSalida = true;
    }
  }

  cancelarSalida() {
    this.mostrarConfirmacionSalida = false;
  }

  confirmarSalida() {
    this.mostrarConfirmacionSalida = false;
    this.onConfirm.emit();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}