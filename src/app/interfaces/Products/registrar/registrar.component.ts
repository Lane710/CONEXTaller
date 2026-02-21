import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';

// Servicios
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { ProveedoresService } from '../../../services/ProductosServis/proveedores-service.service';
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { TipoService } from '../../../services/ProductosServis/tipo.service';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { StockService } from '../../../services/ProductosServis/stock.service';

// Modelos
import { productos } from '../../../models/ProductoStockModel/productos';
import { tipo } from '../../../models/ProductoStockModel/tipo';
import { stock } from '../../../models/ProductoStockModel/stock';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';

declare var bootstrap: any;

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css'],
})
export class RegistrarComponent implements OnInit {
  @ViewChild('f') formReg!: NgForm;
  @ViewChild('imageInput') imageInputRef!: ElementRef;

  // Variables globales
  Proveedores: any[] = [];
  subcategoriasByCategoria: any[] = [];
  Categorias: any[] = [];

  // Variables de estado
  cantidadStock: number = 1;
  estadoBool: boolean = true;
  cargando: boolean = false;
  idProduct = -1;

  // Imágenes
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  // Limite de imagenes (Logica de negocio)
  maxSecondaryImages: number = 5;
  secondaryImageUrls: {
    url: string;
    file: File;
    isNew: boolean;
    id?: number;
  }[] = [];
  secondaryFiles: File[] = [];
  imageIdsToDelete: number[] = [];

  // Propiedades
  propiedadesProduct: any[] = [];
  nuevaPropiedad = { tipo: '', nombre: '', valor: '' };

  // Tipos
  tiposDeSubcategoria: tipo[] = [];

  // Inicialización del producto
  producto: productos = this.getInitialProductState();

  // Variables Modal
  modalTitle: string = '';
  modalMessage: string = '';
  isError: boolean = false;

  constructor(
    private productoService: ProductosService,
    private categoriasService: CategoriasService,
    private subCategoriasService: SubcategoriaService,
    private provedoresService: ProveedoresService,
    private tipoService: TipoService,
    private productoImagenService: ProductoImagenService,
    private ProductoValorPropiedadService: ProductoValorPropiedadService,
    private tipoPropiedadService: TipoPropiedadService,
    private stockService: StockService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.CategoriasInit();
    this.ProveedoresInit();
  }

  // --- MÉTODOS DE INICIALIZACIÓN ---

  private getInitialProductState(): productos {
    return {
      nombre: '',
      precio: 0,
      precioCompra: undefined,
      marca: '',
      descripcion: '',
      color: '',
      sku: '',
      imagen: '',
      codigoBarras: '',
      estado: 1,
      requiereSerial: false,
      subcategoria: {
        idSubcategoria: -1,
        nombre: '',
        categoria: { idCategoria: -1 },
      },
      proveedor: { idProveedor: -1 },
      tipoAsignado: { idTipo: -1 },
      usuarioRegistro: {
        username: localStorage.getItem('current_username') || '',
      },
    };
  }

  resetFormulario() {
    this.producto = this.getInitialProductState();
    this.cantidadStock = 1;
    this.estadoBool = true;
    this.idProduct = -1;

    this.selectedFile = null;
    this.imageUrl = null;
    this.secondaryFiles = [];
    this.secondaryImageUrls = [];
    this.imageIdsToDelete = [];

    if (this.imageInputRef) {
      this.imageInputRef.nativeElement.value = '';
    }

    this.propiedadesProduct = [];
    this.nuevaPropiedad = { tipo: '', nombre: '', valor: '' };

    if (this.formReg) {
      this.formReg.resetForm();
    }
  }

  // --- CARGA DE DATOS ---

  CategoriasInit() {
    this.categoriasService.findAll().subscribe({
      next: (res) => (this.Categorias = res.data),
      error: (e) => console.error(e),
    });
  }

  ProveedoresInit() {
    this.provedoresService.findAll().subscribe({
      next: (res) => (this.Proveedores = res.data),
      error: (e) => console.error(e),
    });
  }

  subCategorias(event: Event) {
    const target = event.target as HTMLSelectElement;
    const id = Number(target.value);

    this.subCategoriasService.ListadoSubCategoriasPorCategoria(id).subscribe({
      next: (res) => (this.subcategoriasByCategoria = res.data),
      error: (e) => console.error(e),
    });
  }

  tiposDeProductsBySubcategoria(event: any) {
    this.tipoService.findBySubcategoria(event.target.value).subscribe({
      next: (res) => {
        this.tiposDeSubcategoria = res.data === null ? [] : res.data;
      },
      error: (e) => console.error(e),
    });
  }

  // --- INTERACCIÓN UI ---

  onTipoInput(event: any) {
    const valorEscrito = event.target.value;
    const tipoExistente = this.tiposDeSubcategoria.find(
      (t) => t.nombre.toLowerCase() === valorEscrito.toLowerCase(),
    );
    this.producto.tipoAsignado!.idTipo = tipoExistente
      ? tipoExistente.idTipo
      : undefined;
  }

  // LOGICA MEJORADA: AGREGAR PROPIEDAD CON VALIDACIÓN DE DUPLICADOS
  agregarPropiedad() {
    // 1. Validar campos vacíos
    if (
      !this.nuevaPropiedad.tipo ||
      !this.nuevaPropiedad.nombre ||
      !this.nuevaPropiedad.valor
    ) {
      this.showModal(
        'Datos incompletos',
        'Por favor complete todos los campos de la propiedad.',
        true,
      );
      return;
    }

    // 2. Validar Duplicados
    const existe = this.propiedadesProduct.some(
      (p) =>
        p.tipo === this.nuevaPropiedad.tipo &&
        p.nombre.toLowerCase().trim() ===
          this.nuevaPropiedad.nombre.toLowerCase().trim() &&
        p.valor.toLowerCase().trim() ===
          this.nuevaPropiedad.valor.toLowerCase().trim(),
    );

    if (existe) {
      this.showModal(
        'Propiedad Duplicada',
        'Esta propiedad (Tipo, Nombre y Valor) ya existe en la lista.',
        true,
      );
      return;
    }

    // 3. Agregar si pasa validaciones
    this.propiedadesProduct.push({ ...this.nuevaPropiedad });
    this.nuevaPropiedad = { tipo: '', nombre: '', valor: '' };
  }

  eliminarPropiedad(index: number) {
    this.propiedadesProduct.splice(index, 1);
  }

  // --- MANEJO DE IMÁGENES ---

  onSelectFile(event: any) {
    const file: File = event.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      if (file.size > 2 * 1024 * 1024) {
        this.showModal('Error', 'El archivo pesa más de 2MB', true);
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => (this.imageUrl = e.target.result);
      reader.readAsDataURL(file);
    }
  }

  // LOGICA MEJORADA: LIMITE DE 5 IMAGENES SECUNDARIAS
  onSecondaryFileSelected(event: any): void {
    const files: FileList = event.target.files;

    // Validar Cantidad Total
    if (
      this.secondaryImageUrls.length + files.length >
      this.maxSecondaryImages
    ) {
      this.showModal(
        'Límite Excedido',
        `Solo puedes subir un máximo de ${this.maxSecondaryImages} imágenes secundarias.`,
        true,
      );
      event.target.value = ''; // Limpiar selección
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!allowedTypes.includes(file.type) || file.size > 2 * 1024 * 1024)
        continue;

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
    event.target.value = '';
  }

  removeSecondaryImage(index: number): void {
    const removedImage = this.secondaryImageUrls[index];
    if (!removedImage.isNew && removedImage.id) {
      this.imageIdsToDelete.push(removedImage.id);
    } else {
      const fileIndex = this.secondaryFiles.findIndex(
        (f) => f === removedImage.file,
      );
      if (fileIndex > -1) this.secondaryFiles.splice(fileIndex, 1);
    }
    this.secondaryImageUrls.splice(index, 1);
  }

  // --- GUARDADO PRINCIPAL (CONCURRENTE) ---

  datosFormulario() {
    // RESTRICCION: Precio de Compra < Precio Venta
    if (
      this.producto.precioCompra &&
      this.producto.precio &&
      this.producto.precioCompra >= this.producto.precio
    ) {
      this.showModal(
        'Error de Precio',
        'El precio de compra no puede ser mayor o igual al de venta.',
        true,
      );
      return; // Detiene el guardado
    }

    this.cargando = true;

    const tieneNombreTipo = this.producto.tipoAsignado?.nombre && this.producto.tipoAsignado.nombre.trim() !== '';

    const tipoParaEnviar = tieneNombreTipo ? {
        idTipo: (this.producto.tipoAsignado?.idTipo && this.producto.tipoAsignado.idTipo > 0)
            ? this.producto.tipoAsignado.idTipo
            : undefined,
        nombre: this.producto.tipoAsignado?.nombre
    } : undefined; // <--- AQUÍ ESTÁ LA CLAVE: Si no hay nombre, enviamos undefined
    
    // ... Resto del código de preparación del objeto y envío al servicio igual ...
    const productoParaEnviar: productos = {
      ...this.producto,
      estado: this.estadoBool ? 1 : 0,
      subcategoria: this.producto.subcategoria,
      sku: this.producto.sku || null,
      codigoBarras: this.producto.codigoBarras || null,
      requiereSerial: this.producto.requiereSerial,
      proveedor:
        this.producto.proveedor?.idProveedor !== -1
          ? { idProveedor: this.producto.proveedor?.idProveedor }
          : undefined,
      
      // USAMOS LA VARIABLE CORREGIDA AQUÍ
      tipoAsignado: tipoParaEnviar, 

      usuarioRegistro: {
        username: localStorage.getItem('current_username') || '',
      },
    };
    this.productoService
      .save(productoParaEnviar, this.selectedFile || undefined)
      .pipe(
        switchMap((res) => {
             // ... lógica de guardado de stock e imagenes igual ...
             const idProducto = res.data.idProducto;
             this.idProduct = idProducto;
   
             const tareasAdicionales = [];
   
             // Tarea A: Guardar Stock
             const stockPayload: stock = {
               cantidad: this.cantidadStock,
               producto: {
                 idProducto: idProducto,
                 nombre: '',
                 precio: 0,
                 subcategoria: { nombre: '' },
               },
             };
             tareasAdicionales.push(this.stockService.saveStock(stockPayload));
   
             // Tarea B: Guardar Imágenes Secundarias
             if (this.secondaryFiles.length > 0) {
               tareasAdicionales.push(
                 this.productoImagenService.uploadAndSaveProductImages(
                   idProducto,
                   this.secondaryFiles,
                 ),
               );
             }
   
             // Tarea C: Guardar Propiedades
             if (this.propiedadesProduct.length > 0) {
               const propObservables = this.propiedadesProduct.map((p) =>
                 this.procesarPropiedadIndividual(p, idProducto),
               );
               tareasAdicionales.push(...propObservables);
             }
   
             return tareasAdicionales.length > 0
               ? forkJoin(tareasAdicionales)
               : of(true);
        }),
      )
      .subscribe({
        next: () => {
          this.cargando = false;
          this.showModal(
            'Éxito',
            'Producto registrado correctamente con todos sus detalles.',
          );
          this.resetFormulario();
        },
        error: (err) => {
          this.cargando = false;
          console.error(err);
          let msg = 'Error al registrar. ';
          if (err.error?.message?.includes('sku')) msg += 'El SKU ya existe.';

          if (this.idProduct !== -1) {
            msg +=
              ' (El producto base se creó, pero fallaron stock/imágenes. Revise el inventario).';
          }
          this.showModal('Error', msg, true);
        },
      });
  }

  procesarPropiedadIndividual(p: any, idProducto: number) {
    return this.tipoPropiedadService
      .findByTipoAndNombreExacto(p.tipo, p.nombre)
      .pipe(
        switchMap((res) => {
          if (res.data === null) {
            const nuevoTipo: tipoPropiedad = {
              nombre: p.nombre,
              tipo: p.tipo,
              tipoDato: 'String',
            };
            return this.tipoPropiedadService.save(nuevoTipo);
          } else {
            return of(res);
          }
        }),
        switchMap((resTipo) => {
          const dataTipo = resTipo.data || resTipo;
          const valorProp: ProductoValorPropiedad = {
            tipoPropiedad: dataTipo,
            valor: p.valor,
            producto: { idProducto: idProducto },
          };
          return this.ProductoValorPropiedadService.save(valorProp);
        }),
      );
  }

  showModal(title: string, message: string, error: boolean = false) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isError = error;
    const modalElement = document.getElementById('responseModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  cerrarModal() {
    if (!this.isError) {
      this.router.navigate(['home/listarProductos']);
    }
  }

  onCancel(): void {
    this.router.navigate(['home/listarProductos']);
  }
}
