import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  FormsModule,
  NgForm,
  Validators,
  ValidationErrors,
  NgModel,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, catchError, concatMap, map } from 'rxjs/operators';

// Importaciones de modelos
import { productos } from '../../../models/ProductoStockModel/productos';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { UsuariosService } from '../../../services/PersonServis/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedor } from '../../../models/proveedor';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { TipoService } from '../../../services/ProductosServis/tipo.service';
import { VariantesService } from '../../../services/ProductosServis/variantes.service';
import { tipo } from '../../../models/ProductoStockModel/tipo';
import { variante } from '../../../models/ProductoStockModel/variante';

// CAMBIO: Eliminar importaciones de tipo y variante si ya no se usan
// import { tipo } from '../../../models/ProductoStockModel/tipo';
// import { variante } from '../../../models/ProductoStockModel/variante';
// import { TipoService } from '../../../services/ProductosServis/tipo.service';
// import { VariantesService } from '../../../services/ProductosServis/variantes.service';

declare var bootstrap: any;

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css'],
})
export class RegistrarComponent implements OnInit, AfterViewInit {
  // ========== VARIABLES DE ESTADO ==========
  isLoading: boolean = false;
  isModalSuccess: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];

  username: string = localStorage.getItem('current_username') || '';

  ProductoRegsitrado: productos | null = null;
  // ========== DATOS DEL FORMULARIO ==========
  producto: productos = {
    idProducto: undefined,
    nombre: '',
    descripcion: '',
    precio: 0,
    marca: '',
    color: '',
    sku: '',
    codigoBarras: '',
    estado: 1,
    disponibleOnline: true,
    // CAMBIO: Tipo y variante ahora son strings
    tipo: '',
    variante: '',
    usuarioRegistro: {
      username: this.username,
      passwordHash: '',
      email: '',
      persona: {
        ci: '',
        nombre: '',
        telefono: '',
        apellidop: '',
        apellidom: '',
      },
      rol: { idRol: -1, nombreRol: '' },
    },
    categoria: {
      idCategoria: -1,
      nombre: '',
      descripcion: '',
      estado: true,
      urlImagen: '',
    },
    subcategoria: {
      idSubcategoria: -1,
      nombre: '',
      descripcion: '',
      estado: true,
      urlImagen: '',
      categoria: { idCategoria: -1, nombre: '' },
    },
    proveedor: {
      idProveedor: -1,
      nombreEmpresa: '',
      emailContacto: '',
      telefonoContacto: '',
      estado: true,
    },
  };

  tiposPropiedad: tipoPropiedad[] = [
    {
      idTipoPropiedad: 1,
      tipo: 'atributo',
      nombre: 'Atributo',
      tipoDato: 'texto',
    },
    {
      idTipoPropiedad: 2,
      tipo: 'caracteristica',
      nombre: 'Característica',
      tipoDato: 'texto',
    },
    {
      idTipoPropiedad: 3,
      tipo: 'especificacion',
      nombre: 'Especificación',
      tipoDato: 'texto',
    },
  ];
  cantidadStock: number = 1;
  imageUrl: string | null = null;
  selectedFile: File | null = null;
  secondaryImageUrls: { url: string; file: File }[] = [];
  secondaryFiles: File[] = [];

  // ========== PROPIEDADES DINÁMICAS ==========
  newProperty: any = {
    tipoPropiedadId: null, // Cambiar a solo el ID
    idProductoValor: null,
    valor: '',
    tipo: '',
    nombre: '',
    tipoDato: '',
  };

  productProperties: ProductoValorPropiedad[] = [];
  tipoProducto: tipoPropiedad[] = [];

  // ========== LISTAS DE DATOS ==========
  categorias: categorias[] = [];
  subcategorias: subcategoria[] = [];
  proveedores: proveedor[] = [];

  // ========== LISTAS FILTRADAS ==========
  subcategoriasFiltradas: subcategoria[] = [];

  // CAMBIO: Eliminar arrays de tipos y variantes
  // tipos: tipo[] = [];
  // variantes: variante[] = [];
  // tiposFiltrados: tipo[] = [];
  // variantesFiltradas: variante[] = [];

  // ========== REFERENCIAS A ELEMENTOS ==========
  @ViewChild('productForm') productForm!: NgForm;
  @ViewChild('responseModal') responseModal!: ElementRef;
  @ViewChild('errorModal') errorModal!: ElementRef;

  // ========== MODALES ==========
  private responseModalInstance: any;
  private errorModalInstance: any;

  constructor(
    private router: Router,
    private stockService: StockService,
    private usuariosService: UsuariosService,
    private productoImagenService: ProductoImagenService,
    private productosService: ProductosService,
    private productoValorPropiedadService: ProductoValorPropiedadService,
    private categoriasService: CategoriasService,
    private subcategoriaService: SubcategoriaService,
    private tipoPropiedadService: TipoPropiedadService,
    private tipoService: TipoService,
    private varianteService: VariantesService
  ) {}

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  ngAfterViewInit(): void {
    if (this.responseModal) {
      this.responseModalInstance = new bootstrap.Modal(
        this.responseModal.nativeElement
      );
    }
    if (this.errorModal) {
      this.errorModalInstance = new bootstrap.Modal(
        this.errorModal.nativeElement
      );
    }
  }

  // ========== CARGA DE DATOS INICIALES ==========
  private cargarDatosIniciales(): void {
    this.isLoading = true;

    forkJoin({
      categorias: this.categoriasService.findAll(),
      subcategorias: this.subcategoriaService.findAll(),
      proveedores: this.productosService.getProveedores(),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (results) => {
          this.categorias = results.categorias.data || [];
          this.subcategorias = results.subcategorias.data || [];
          this.proveedores = results.proveedores.data || [];
        },
        error: (error) => {
          console.error('Error cargando datos iniciales:', error);
          this.mostrarError(
            'Error al cargar los datos iniciales. Por favor, recarga la página.'
          );
        },
      });
  }

  // ========== MANEJO DE CAMBIOS EN JERARQUÍA ==========
 onCategoriaChange(): void {
  // CAMBIO: Resetear subcategoría a null
  this.producto.subcategoria = {
    idSubcategoria: -1,
    nombre: '',
    descripcion: '',
    estado: true,
    urlImagen: '',
    categoria: { idCategoria: -1, nombre: '' },
  };

  if (this.producto.categoria?.idCategoria) {
    this.subcategoriaService
      .ListadoSubCategoriasPorCategoria(this.producto.categoria.idCategoria)
      .subscribe({
        next: (res) => (this.subcategoriasFiltradas = res.data || []),
        error: () => this.mostrarError('Error al cargar subcategorías.'),
      });
  } else {
    this.subcategoriasFiltradas = [];
  }
}

  // CAMBIO: Eliminar métodos de cambio para tipo y variante
  // onSubcategoriaChange(): void { ... }
  // onTipoChange(): void { ... }

  // ========== MANEJO DE ARCHIVOS ==========
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.mostrarError(
          'Tipo de archivo no permitido. Solo se permiten JPG, PNG y GIF.'
        );
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.mostrarError(
          'El archivo es demasiado grande. El tamaño máximo es 2MB.'
        );
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSecondaryFileSelected(event: any): void {
    const files: FileList = event.target.files;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        this.mostrarError(
          `El archivo "${file.name}" no es un tipo de imagen válido.`
        );
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.mostrarError(
          `El archivo "${file.name}" es demasiado grande. Máximo 2MB.`
        );
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.secondaryImageUrls.push({ url: e.target.result, file });
        this.secondaryFiles.push(file);
      };
      reader.readAsDataURL(file);
    }

    event.target.value = '';
  }

  removeSecondaryImage(index: number): void {
    this.secondaryImageUrls.splice(index, 1);
    this.secondaryFiles.splice(index, 1);
  }

  removeProperty(index: number): void {
    this.productProperties.splice(index, 1);
  }

  trackByPropertyId(index: number, prop: ProductoValorPropiedad): number {
    return index;
  }

  // ========== MANEJO DE ESTADOS ==========
  onEstadoChange(event: any): void {
    this.producto.estado = event.target.checked ? 1 : 0;
  }

  onDisponibleOnlineChange(event: any): void {
    this.producto.disponibleOnline = event.target.checked;
  }


private validarFormulario(): boolean {
  const errores: string[] = [];

  if (!this.producto.nombre || this.producto.nombre.length < 3) {
    errores.push(
      'El nombre del producto es obligatorio y debe tener al menos 3 caracteres.'
    );
  }

  if (!this.producto.precio || this.producto.precio <= 0) {
    errores.push('El precio debe ser mayor a 0.');
  }

  if (!this.producto.marca) {
    errores.push('La marca es obligatoria.');
  }

  // CAMBIO: Validar con null en lugar de -1
  if (!this.producto.categoria?.idCategoria) {
    errores.push('Debe seleccionar una categoría.');
  }

  // CAMBIO: Validar con null en lugar de -1
  if (!this.producto.subcategoria.idSubcategoria) {
    errores.push('Debe seleccionar una subcategoría.');
  }

  // CAMBIO: Validar con null en lugar de -1
  if (!this.producto.proveedor.idProveedor) {
    errores.push('Debe seleccionar un proveedor.');
  }

  if (!this.cantidadStock || this.cantidadStock < 1) {
    errores.push('La cantidad en stock debe ser al menos 1.');
  }

  if (errores.length > 0) {
    this.mostrarErroresValidacion(errores);
    return false;
  }

  return true;
}

  // ========== ENVÍO DEL FORMULARIO ==========
  onSubmit(): void {
    // Validaciones
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.controls[key];
      control.markAsTouched();
    });

    // CAMBIO: Simplificar payload - tipo y variante ya son strings
    const productoPayload = {
      ...this.producto,
      // Asegurar que tipo y variante sean null si están vacíos
      tipo: this.producto.tipo?.trim() || null,
      variante: this.producto.variante?.trim() || null,
    };

    if (!this.validarFormulario() || this.productForm.invalid) {
      this.mostrarError(
        'Por favor, complete todos los campos obligatorios correctamente.'
      );
      return;
    }

    // Convertir strings vacíos a null para SKU y código de barras
    if (
      this.producto.sku !== null &&
      this.producto.sku !== undefined &&
      this.producto.sku.trim() === ''
    ) {
      this.producto.sku = null;
    }

    if (
      this.producto.codigoBarras !== null &&
      this.producto.codigoBarras !== undefined &&
      this.producto.codigoBarras.trim() === ''
    ) {
      this.producto.codigoBarras = null;
    }

    this.isLoading = true;

    // Interfaz para tipar el resultado del proceso
    interface ProcesoResult {
      productoResponse: ApiResponse;
      stockResponse: ApiResponse;
      idProducto: number;
    }

    // Proceso completo de guardado
    const procesoGuardado: Observable<any> = of(null).pipe(
      // 1. Guardar producto
      concatMap(() => {
        return this.productosService.save(
          productoPayload,
          this.selectedFile || undefined
        );
      }),
      // 2. Guardar stock
      concatMap((productoResponse: ApiResponse) => {
        if (productoResponse.success && productoResponse.data) {
          const productoGuardado = productoResponse.data;

          // Guardar stock
          const stockData = {
            idStock: 0,
            cantidad: this.cantidadStock,
            producto: productoGuardado,
          };
          return this.stockService.saveStock(stockData).pipe(
            map(
              (stockResponse: ApiResponse): ProcesoResult => ({
                productoResponse,
                stockResponse,
                idProducto: productoGuardado.idProducto,
              })
            )
          );
        }
        throw new Error('Error al guardar el producto');
      }),
      // 3. Guardar propiedades si existen
      concatMap((result: ProcesoResult) => {
        const idProducto = result.idProducto;
        this.GuardarTipo();
        // Guardar propiedades si existen
        if (this.productProperties.length > 0) {
          return this.GuardadoPropiedades(idProducto).pipe(
            map(() => result), // Pasar el resultado completo
            catchError((error) => {
              console.error('Error guardando propiedades:', error);
              // Continuar aunque falle el guardado de propiedades
              return of(result);
            })
          );
        }
        return of(result);
      }),
      finalize(() => (this.isLoading = false))
    );

    // Ejecutar el proceso completo
    procesoGuardado.subscribe({
      next: (result: ProcesoResult) => {
        this.mostrarExito(
          'Producto registrado exitosamente',
          'El producto ha sido registrado correctamente en el sistema.'
        );
        this.limpiarFormulario();
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        if (error instanceof HttpErrorResponse) {
          this.mostrarError(
            'Error al registrar el producto',
            this.obtenerMensajeError(error)
          );
        } else {
          this.mostrarError('Error al registrar el producto', [
            error.message || 'Error desconocido',
          ]);
        }
      },
    });
  }

  private obtenerMensajeError(error: HttpErrorResponse): string[] {
    const detalles: string[] = [];

    if (error.error && error.error.message) {
      detalles.push(error.error.message);
    }

    if (error.status === 0) {
      detalles.push(
        'No se pudo conectar con el servidor. Verifique su conexión.'
      );
    } else if (error.status === 400) {
      detalles.push('Datos inválidos enviados al servidor.');
    } else if (error.status === 500) {
      detalles.push(
        'Error interno del servidor. Por favor, intente más tarde.'
      );
    }

    if (detalles.length === 0) {
      detalles.push('Error desconocido. Por favor, contacte al administrador.');
    }

    return detalles;
  }

  // ========== MODALES Y MENSAJES ==========
  private mostrarExito(
    titulo: string,
    mensaje: string,
    detalles: string[] = []
  ): void {
    this.isModalSuccess = true;
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    this.modalDetails = detalles;
    this.responseModalInstance.show();
  }

  private mostrarError(mensaje: string, detalles: string[] = []): void {
    this.isModalSuccess = false;
    this.modalTitle = 'Error';
    this.modalMessage = mensaje;
    this.modalDetails = detalles;
    this.responseModalInstance.show();
  }

  private mostrarErroresValidacion(errores: string[]): void {
    const errorList = document.getElementById('errorList');
    if (errorList) {
      errorList.innerHTML = '';
      errores.forEach((error) => {
        const li = document.createElement('li');
        li.className = 'list-group-item list-group-item-danger';
        li.textContent = error;
        errorList.appendChild(li);
      });

      if (this.errorModalInstance) {
        this.errorModalInstance.show();
      }
    }
  }

  closeResponseModalAndRedirect(): void {
    this.responseModalInstance.hide();
    if (this.isModalSuccess) {
      setTimeout(() => {
        this.router.navigate(['home/listarProductos']);
      }, 500);
    }
  }

  // ========== UTILIDADES ==========
  private limpiarFormulario(): void {
    // Resetear producto
    this.producto = {
      idProducto: undefined,
      nombre: '',
      descripcion: '',
      precio: 0,
      marca: '',
      color: '',
      sku: '',
      codigoBarras: '',
      estado: 1,
      disponibleOnline: true,
      // CAMBIO: Resetear como strings vacíos
      tipo: '',
      variante: '',
      categoria: {
        idCategoria: -1,
        nombre: '',
        descripcion: '',
        estado: true,
        urlImagen: '',
      },
      subcategoria: {
        idSubcategoria: -1,
        nombre: '',
        descripcion: '',
        estado: true,
        urlImagen: '',
        categoria: {
          idCategoria: -1,
          nombre: '',
        },
      },
      proveedor: {
        idProveedor: -1,
        nombreEmpresa: '',
        emailContacto: '',
        telefonoContacto: '',
        estado: true,
      },
    };

    // Resetear otros campos
    this.cantidadStock = 1;
    this.imageUrl = null;
    this.selectedFile = null;
    this.secondaryImageUrls = [];
    this.secondaryFiles = [];
    this.productProperties = [];
    this.newProperty = {
      tipoPropiedadId: null, // Cambiar a solo el ID
      idProductoValor: null,
      valor: '',
      tipo: '',
      nombre: '',
      tipoDato: '',
    };

    // Resetear listas filtradas
    this.subcategoriasFiltradas = [];

    // Resetear formulario
    if (this.productForm) {
      this.productForm.resetForm();
    }
  }

  onCancel(): void {
    if (
      confirm(
        '¿Está seguro de que desea cancelar? Se perderán todos los datos no guardados.'
      )
    ) {
      this.router.navigate(['/productos']);
    }
  }

  // ========== VALIDACIONES EN TIEMPO REAL ==========
  getFieldClass(field: NgModel): any {
    return {
      'is-invalid': field.invalid && (field.dirty || field.touched),
      'is-valid': field.valid && (field.dirty || field.touched),
    };
  }

  getFieldErrors(field: NgModel): string[] {
    const errors: string[] = [];

    if (field.errors) {
      if (field.errors['required']) {
        errors.push('Este campo es obligatorio.');
      }
      if (field.errors['minlength']) {
        errors.push(
          `Mínimo ${field.errors['minlength'].requiredLength} caracteres.`
        );
      }
      if (field.errors['maxlength']) {
        errors.push(
          `Máximo ${field.errors['maxlength'].requiredLength} caracteres.`
        );
      }
      if (field.errors['min']) {
        errors.push(`El valor mínimo permitido es ${field.errors['min'].min}.`);
      }
    }

    return errors;
  }

  // CAMBIO: Eliminar métodos de obtención de tipos y variantes
  // private obtenerTipos(): Observable<tipo[]> { ... }
  // private obtenerVariantes(): Observable<variante[]> { ... }

  // CAMBIO: Simplificar manejo de inputs para tipo y variante
  onTipoInput(event: any): void {
    this.producto.tipo = (event.target.value || '').trim() || null;
  }

  onVarianteInput(event: any): void {
    this.producto.variante = (event.target.value || '').trim() || null;
  }

  // ========== MANEJO DE PROPIEDADES ==========
  addProperty(): void {
    if (
      this.newProperty.tipoPropiedad &&
      this.newProperty.idProductoValor &&
      this.newProperty.valor
    ) {
      // Crear el objeto tipoPropiedad completo - asegurar que nunca sea undefined
      const tipoPropiedadCompleto: tipoPropiedad = {
        tipo: this.newProperty.tipoPropiedad.tipo || 'atributo',
        nombre: this.newProperty.idProductoValor,
        tipoDato: this.newProperty.tipoPropiedad.tipoDato || 'texto',
      };

      // Si el tipoPropiedad seleccionado ya tiene ID, lo mantenemos
      if (this.newProperty.tipoPropiedad.idTipoPropiedad) {
        tipoPropiedadCompleto.idTipoPropiedad =
          this.newProperty.tipoPropiedad.idTipoPropiedad;
      }

      const nuevaPropiedad: ProductoValorPropiedad = {
        idProductoValor: 0,
        tipoPropiedad: tipoPropiedadCompleto, // Siempre definido
        valor: this.newProperty.valor,
        producto: undefined,
      };

      this.productProperties.push(nuevaPropiedad);

      // Resetear el formulario de nueva propiedad
      this.newProperty = {
        tipoPropiedadId: null,
        idProductoValor: null,
        valor: '',
        tipo: '',
        nombre: '',
        tipoDato: '',
      };
    } else {
      console.warn(
        'No se puede agregar propiedad: Campos incompletos',
        this.newProperty
      );
    }
  }

  private GuardadoPropiedades(idProducto: number): Observable<any> {
    console.log('ID Producto en GuardadoPropiedades:', idProducto);
    console.log('Propiedades a guardar:', this.productProperties);

    // Filtrar propiedades que no tienen tipoPropiedad
    const propiedadesValidas = this.productProperties.filter(
      (prop) => prop.tipoPropiedad && prop.valor
    );

    if (propiedadesValidas.length === 0) {
      console.log('No hay propiedades válidas para guardar');
      return of(null);
    }

    console.log('Propiedades válidas a guardar:', propiedadesValidas);

    const propiedadesObservables = propiedadesValidas.map((propiedad) => {
      // Ahora propiedad.tipoPropiedad nunca es undefined gracias al filter
      return this.guardarTipoPropiedad(propiedad.tipoPropiedad!)
        .pipe
        // ... resto del código igual
        ();
    });

    return forkJoin(propiedadesObservables);
  }

  private guardarTipoPropiedad(
    tipoPropiedad: tipoPropiedad
  ): Observable<tipoPropiedad> {
    // Si ya tiene ID, asumimos que ya existe en la base de datos
    if (tipoPropiedad.idTipoPropiedad && tipoPropiedad.idTipoPropiedad > 0) {
      console.log(
        'TipoPropiedad ya existe con ID:',
        tipoPropiedad.idTipoPropiedad
      );
      return of(tipoPropiedad);
    }

    // Si no tiene ID, lo guardamos como nuevo
    console.log('Guardando nuevo TipoPropiedad:', tipoPropiedad);

    return this.tipoPropiedadService.save(tipoPropiedad).pipe(
      map((response: ApiResponse) => {
        if (response.success && response.data) {
          console.log('TipoPropiedad guardado exitosamente:', response.data);
          return response.data as tipoPropiedad;
        } else {
          throw new Error(
            'Error al guardar TipoPropiedad: ' +
              (response.message || 'Respuesta inválida del servidor')
          );
        }
      }),
      catchError((error) => {
        console.error('Error guardando TipoPropiedad:', error);
        // Si falla, intentamos buscar si ya existe uno con el mismo nombre
        return this.buscarTipoPropiedadExistente(tipoPropiedad.nombre).pipe(
          catchError((buscarError) => {
            console.error(
              'Error buscando TipoPropiedad existente:',
              buscarError
            );
            // Si no existe, lanzamos el error original
            throw new Error(
              `No se pudo guardar ni encontrar el TipoPropiedad: ${error.message}`
            );
          })
        );
      })
    );
  }

  private buscarTipoPropiedadExistente(
    nombre: string
  ): Observable<tipoPropiedad> {
    console.log('Buscando TipoPropiedad existente con nombre:', nombre);

    return this.tipoPropiedadService.findByNombre(nombre).pipe(
      map((response: ApiResponse) => {
        if (response.success && response.data) {
          console.log('TipoPropiedad encontrado existente:', response.data);
          return response.data as tipoPropiedad;
        } else {
          throw new Error('TipoPropiedad no encontrado con nombre: ' + nombre);
        }
      }),
      catchError((error) => {
        console.error('Error en búsqueda de TipoPropiedad:', error);
        throw new Error(
          'Error al buscar TipoPropiedad existente: ' + error.message
        );
      })
    );
  }

 GuardarTipo() {
  let tipo: tipo = {
    nombre: this.producto.tipo || '',
    subcategoria: { 
      idSubcategoria: this.producto.subcategoria.idSubcategoria || -1, 
      nombre: this.producto.subcategoria.nombre || '' 
    },
  };

  let variante: variante = {
    nombre: this.producto.variante || '',
  };

  console.log("Datos del producto:", this.producto);

  // 🔍 Primero verificamos si el tipo ya existe
  this.tipoService.findByNombre(tipo.nombre).subscribe({
    next: (res) => {
      // ✅ Si existe, usamos el tipo existente
      console.log('Tipo existente encontrado:', res.data);
      variante.tipo = { 
        idTipo: res.data.idTipo, 
        nombre: res.data.nombre 
      };

      // Guardamos la variante asociada al tipo existente
      this.varianteService.save(variante).subscribe({
        next: (res) => {
          console.log('Variante guardada (tipo existente):', res);
        },
        error: (err) => {
          console.error('Error guardando variante:', err);
        },
      });
    },
    error: (err) => {
      // ⚠️ Si no existe el tipo, el backend devuelve 404 → lo creamos
      if (err.status === 404) {
        console.log('Tipo no encontrado, se creará uno nuevo.');
        this.tipoService.save(tipo).subscribe({
          next: (res) => {
            console.log('Tipo nuevo guardado:', res);
            variante.tipo = { 
              idTipo: res.data.idTipo, 
              nombre: res.data.nombre 
            };

            // Guardamos la variante con el tipo recién creado
            this.varianteService.save(variante).subscribe({
              next: (res) => {
                console.log('Variante guardada (tipo nuevo):', res);
              },
              error: (err) => {
                console.error('Error guardando variante:', err);
              },
            });
          },
          error: (err) => {
            console.error('Error guardando tipo nuevo:', err);
          },
        });
      } else {
        console.error('Error buscando tipo:', err);
      }
    },
  });
}

}
