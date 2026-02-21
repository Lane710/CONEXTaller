import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  forkJoin,
  of,
  switchMap,
  catchError,
  finalize,
  Observable,
} from 'rxjs';

// Tus imports...
import { productos } from '../../../models/ProductoStockModel/productos';
import { stock } from '../../../models/ProductoStockModel/stock';
import { tipo } from '../../../models/ProductoStockModel/tipo';

import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { TipoService } from '../../../services/ProductosServis/tipo.service';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';

declare var bootstrap: any;

@Component({
  selector: 'app-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modificar.component.html',
  styleUrls: ['./modificar.component.css'],
})
export class ModificarComponent implements OnInit, AfterViewInit {
  @ViewChild('f') formModificar!: NgForm;

  cargando: boolean = false;
  productoId!: number;
  estadoBool: boolean = true;
  cantidadStock: number = 0;
  idStockActual: number | null = null;

  Categorias: any[] = [];
  subcategoriasByCategoria: any[] = [];
  Proveedores: any[] = [];
  tiposDeSubcategoria: tipo[] = [];

  // Estado inicial
  producto: productos = {
    nombre: '',
    precio: 0,
    marca: '',
    descripcion: '',
    color: '',
    sku: '',
    imagen: '',
    codigoBarras: '',
    estado: 1,
    requiereSerial: false, // Inicializamos en false
    subcategoria: {
      idSubcategoria: -1,
      nombre: '',
      categoria: { idCategoria: -1 },
    },
    proveedor: { idProveedor: -1 },
    tipoAsignado: { idTipo: -1, nombre: '' },
    usuarioRegistro: {
      username: localStorage.getItem('current_username') || '',
    },
  };

  imageUrl: string | null = null;
  selectedFile: File | null = null;

  secondaryImageUrls: {
    url: string;
    file?: File;
    isNew: boolean;
    id?: number;
  }[] = [];
  secondaryFiles: File[] = [];
  imageIdsToDelete: number[] = [];

  propiedadesProduct: any[] = [];
  nuevaPropiedad = { tipo: '', nombre: '', valor: '' };
  propiedadesIdsBorrar: number[] = [];

  modalTitle: string = '';
  modalMessage: string = '';
  isError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductosService,
    private categoriasService: CategoriasService,
    private subCategoriasService: SubcategoriaService,
    private proveedoresService: ProveedoresService,
    private tipoService: TipoService,
    private productoImagenService: ProductoImagenService,
    private productoValorPropiedadService: ProductoValorPropiedadService,
    private tipoPropiedadService: TipoPropiedadService,
    private stockService: StockService,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.productoId = Number(idParam);
      this.cargarDatosIniciales();
    }
  }

  ngAfterViewInit(): void {}

  private cargarDatosIniciales() {
    this.cargando = true;
    forkJoin({
      categorias: this.categoriasService.findAll(),
      proveedores: this.proveedoresService.findAll(),
    })
      .pipe(
        switchMap((resBase) => {
          this.Categorias = resBase.categorias.data;
          this.Proveedores = resBase.proveedores.data;
          return this.productoService.findById(this.productoId);
        }),
        switchMap((resProd) => {
          this.producto = resProd.data;

          // --- VALIDACIONES DE DATOS ---
          if (!this.producto.tipoAsignado)
            this.producto.tipoAsignado = { idTipo: -1, nombre: '' };

          if (!this.producto.subcategoria)
            this.producto.subcategoria = {
              idSubcategoria: -1,
              nombre: '',
              categoria: { idCategoria: -1 },
            };

          // Asegurar que requiereSerial no sea null/undefined
          this.producto.requiereSerial = this.producto.requiereSerial || false;

          this.estadoBool = this.producto.estado === 1;
          this.imageUrl = this.producto.imagen || null;

          const idCat = this.producto.subcategoria.categoria?.idCategoria || 0;
          const idSub = this.producto.subcategoria.idSubcategoria || 0;

          return forkJoin({
            subCats:
              this.subCategoriasService.ListadoSubCategoriasPorCategoria(idCat),
            tipos: this.tipoService.findBySubcategoria(idSub),
            stock: this.stockService.StockDelProducto(this.productoId),
            imagenes: this.productoImagenService
              .getProductImages(this.productoId)
              .pipe(catchError(() => of({ data: [] }))),
            propiedades: this.productoValorPropiedadService
              .findByProductoId(this.productoId)
              .pipe(catchError(() => of({ data: [] }))),
          });
        }),
        finalize(() => (this.cargando = false)),
      )
      .subscribe({
        next: (res) => {
          this.subcategoriasByCategoria = res.subCats.data || [];
          this.tiposDeSubcategoria = res.tipos.data || [];

          if (res.stock.data) {
            this.cantidadStock = res.stock.data.cantidad;
            this.idStockActual = res.stock.data.idStock;
          }

          this.secondaryImageUrls = (res.imagenes.data || []).map(
            (img: any) => ({
              url: img.urlImagen,
              id: img.idImagen,
              isNew: false,
            }),
          );

          const propsData = res.propiedades.data || [];
          this.propiedadesProduct = propsData.map((p: any) => ({
            idProductoValor: p.idProductoValor,
            tipo: p.tipoPropiedad?.tipo || 'N/A',
            nombre: p.tipoPropiedad?.nombre || 'N/A',
            valor: p.valor,
            isNew: false,
          }));
        },
        error: (err) => {
          console.error(err);
          this.showModal(
            'Error',
            'No se pudo recuperar la información completa',
            true,
          );
        },
      });
  }

  // ... (Tus métodos de subCategorias, tipos, etc. se mantienen igual) ...
  subCategorias(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    this.producto.subcategoria.idSubcategoria = -1;
    this.producto.tipoAsignado = { idTipo: -1, nombre: '' };
    this.tiposDeSubcategoria = [];
    this.cargarSubcategorias(id);
  }

  cargarSubcategorias(idCat: number) {
    this.subCategoriasService
      .ListadoSubCategoriasPorCategoria(idCat)
      .subscribe((res) => {
        this.subcategoriasByCategoria = res.data;
      });
  }

  tiposDeProductsBySubcategoria(event: any) {
    const idSub = Number(event.target.value);
    this.producto.tipoAsignado = { idTipo: -1, nombre: '' };
    this.cargarTipos(idSub);
  }

  cargarTipos(idSub: number) {
    this.tipoService.findBySubcategoria(idSub).subscribe((res) => {
      this.tiposDeSubcategoria = res.data || [];
    });
  }

  onTipoInput(event: any) {
    const valor = event.target.value;
    if (!this.producto.tipoAsignado) {
      this.producto.tipoAsignado = { idTipo: -1, nombre: '' };
    }
    this.producto.tipoAsignado.nombre = valor;
    if (!valor) {
      this.producto.tipoAsignado.idTipo = -1;
      return;
    }
  }

  // ... (Métodos de Propiedades e Imágenes se mantienen igual) ...
  agregarPropiedad() {
    if (
      !this.nuevaPropiedad.tipo ||
      !this.nuevaPropiedad.nombre ||
      !this.nuevaPropiedad.valor
    )
      return;
    this.propiedadesProduct.push({ ...this.nuevaPropiedad, isNew: true });
    this.nuevaPropiedad = { tipo: '', nombre: '', valor: '' };
  }

  eliminarPropiedad(index: number) {
    const prop = this.propiedadesProduct[index];
    if (!prop.isNew && prop.idProductoValor) {
      this.propiedadesIdsBorrar.push(prop.idProductoValor);
    }
    this.propiedadesProduct.splice(index, 1);
  }

  onSelectFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.imageUrl = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  onSecondaryFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (this.secondaryImageUrls.length + files.length > 5) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.secondaryImageUrls.push({
          url: e.target.result,
          file,
          isNew: true,
        });
        this.secondaryFiles.push(file);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSecondaryImage(index: number) {
    const img = this.secondaryImageUrls[index];
    if (!img.isNew && img.id) {
      this.imageIdsToDelete.push(img.id);
    } else if (img.file) {
      const fIndex = this.secondaryFiles.indexOf(img.file);
      if (fIndex > -1) this.secondaryFiles.splice(fIndex, 1);
    }
    this.secondaryImageUrls.splice(index, 1);
  }

  // ========== GUARDADO PRINCIPAL ==========
  datosFormulario() {
    if (
      this.producto.precioCompra !== undefined &&
      this.producto.precio !== undefined &&
      this.producto.precioCompra >= this.producto.precio
    ) {
      this.showModal(
        'Error de Precio',
        'El precio de compra no puede ser mayor o igual al de venta.',
        true,
      );
      return;
    }

    this.cargando = true;

    this.procesarTipoAntesDeGuardar()
      .pipe(
        switchMap((tipoResuelto) => {
          // Lógica de tipo opcional
          const tieneNombreTipo =
            tipoResuelto?.nombre && tipoResuelto.nombre.trim() !== '';
          const tipoParaEnviar = tieneNombreTipo
            ? {
                idTipo:
                  tipoResuelto.idTipo && tipoResuelto.idTipo > 0
                    ? tipoResuelto.idTipo
                    : undefined,
                nombre: tipoResuelto.nombre,
              }
            : undefined;

          // Asignamos el tipo procesado
          this.producto.tipoAsignado = tipoParaEnviar;

          const prodPayload: productos = {
            ...this.producto,
            estado: this.estadoBool ? 1 : 0,
            // requiereSerial ya viene dentro de this.producto
          };

          return this.productoService.update(
            prodPayload,
            this.productoId,
            this.selectedFile || undefined,
          );
        }),
        switchMap((resProd) => {
          const tareas = [];

          // Actualizar Stock
          const stockPayload: stock = {
            idStock: this.idStockActual || undefined,
            cantidad: this.cantidadStock,
            producto: { idProducto: this.productoId } as any,
          };

          tareas.push(
            this.stockService.updateStock(
              stockPayload,
              this.idStockActual || 0,
            ),
          );

          // Imágenes
          this.imageIdsToDelete.forEach((id) =>
            tareas.push(this.productoImagenService.deleteById(id)),
          );
          if (this.secondaryFiles.length > 0) {
            tareas.push(
              this.productoImagenService.uploadAndSaveProductImages(
                this.productoId,
                this.secondaryFiles,
              ),
            );
          }

          // Propiedades
          this.propiedadesIdsBorrar.forEach((id) =>
            tareas.push(this.productoValorPropiedadService.deleteById(id)),
          );
          const nuevasProps = this.propiedadesProduct.filter((p) => p.isNew);
          nuevasProps.forEach((p) =>
            tareas.push(this.procesarPropiedadIndividual(p, this.productoId)),
          );

          return tareas.length > 0 ? forkJoin(tareas) : of(true);
        }),
      )
      .subscribe({
        next: () => {
          this.cargando = false;
          this.showModal('Éxito', 'Producto actualizado correctamente');
          this.propiedadesIdsBorrar = [];
          this.imageIdsToDelete = [];
          this.cargarDatosIniciales();
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
          this.showModal('Error', 'Error al procesar la actualización', true);
        },
      });
  }

  // ... (Resto de métodos procesarPropiedadIndividual, procesarTipoAntesDeGuardar, modales) ...
  procesarPropiedadIndividual(p: any, idProducto: number) {
    return this.tipoPropiedadService
      .findByTipoAndNombreExacto(p.tipo, p.nombre)
      .pipe(
        switchMap((res) => {
          if (!res.data) {
            return this.tipoPropiedadService.save({
              nombre: p.nombre,
              tipo: p.tipo,
              tipoDato: 'String',
            });
          }
          return of(res);
        }),
        switchMap((resTipo) => {
          const dataTipo = resTipo.data || resTipo;
          return this.productoValorPropiedadService.save({
            tipoPropiedad: dataTipo,
            valor: p.valor,
            producto: { idProducto: idProducto },
          });
        }),
      );
  }

  procesarTipoAntesDeGuardar(): Observable<any> {
    const nombreInput = this.producto.tipoAsignado?.nombre?.trim();
    const idSub = this.producto.subcategoria?.idSubcategoria;

    if (!nombreInput || !idSub || idSub === -1) {
      return of(this.producto.tipoAsignado);
    }

    const tipoExistenteLocal = this.tiposDeSubcategoria.find(
      (t) => t.nombre.toLowerCase() === nombreInput.toLowerCase(),
    );

    if (tipoExistenteLocal) return of(tipoExistenteLocal);

    return this.tipoService.findBySubcategoria(idSub).pipe(
      switchMap((res) => {
        const tiposBD = res.data || [];
        const coincidencia = tiposBD.find(
          (t: any) => t.nombre.toLowerCase() === nombreInput.toLowerCase(),
        );
        if (coincidencia) return of(coincidencia);

        const nuevoTipo = {
          nombre: nombreInput,
          subcategoria: { idSubcategoria: idSub },
        };
        return this.tipoService
          .save(nuevoTipo as any)
          .pipe(switchMap((resSave) => of(resSave.data)));
      }),
    );
  }

  showModal(title: string, message: string, error: boolean = false) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isError = error;
    const modalEl = document.getElementById('responseModal');
    if (modalEl) new bootstrap.Modal(modalEl).show();
  }

  cerrarModal() {
    if (!this.isError) this.router.navigate(['home/listarProductos']);
  }

  onCancel() {
    this.router.navigate(['home/listarProductos']);
  }
}
