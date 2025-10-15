// src/app/components/modificar/modificar.component.ts
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
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, catchError, concatMap, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// Importaciones de modelos
import { productos } from '../../../models/ProductoStockModel/productos';
import { stock } from '../../../models/ProductoStockModel/stock';

import { categorias } from '../../../models/ProductoStockModel/categorias';
import { subcategoria } from '../../../models/ProductoStockModel/subcategorias';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';
import { ProductoValorPropiedad } from '../../../models/ProductoStockModel/ProductoValorPropiedad';
import { tipo } from '../../../models/ProductoStockModel/tipo';
import { variante } from '../../../models/ProductoStockModel/variante';
import { ApiResponse } from '../../../models/api-response';

// Importaciones de servicios
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service';
import { ProductoValorPropiedadService } from '../../../services/ProductosServis/Secundarios/producto-propiedad.service';
import { CategoriasService } from '../../../services/ProductosServis/categorias.service';
import { SubcategoriaService } from '../../../services/ProductosServis/subcategoria-service.service';
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { TipoService } from '../../../services/ProductosServis/tipo.service';
import { VariantesService } from '../../../services/ProductosServis/variantes.service';
import { proveedores } from '../../../models/ProductoStockModel/proveedores';

declare var bootstrap: any;

@Component({
  selector: 'app-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modificar.component.html',
  styleUrls: ['./modificar.component.css']
})
export class ModificarComponent implements OnInit, AfterViewInit {
  // ========== VARIABLES DE ESTADO ==========
  isLoading: boolean = false;
  isModalSuccess: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];

  productoId: number = 0;
  producto: productos | null = null;
  stock: stock | null = null;

  username: string = localStorage.getItem('current_username') || '';

  // ========== DATOS DEL FORMULARIO ==========
  cantidadStock: number = 1;
  imageUrl: string | null = null;
  selectedFile: File | null = null;
  secondaryImageUrls: { url: string; file: File; isNew: boolean; id?: number }[] = [];
  secondaryFiles: File[] = [];
  imageIdsToDelete: number[] = [];

  // ========== PROPIEDADES DINÁMICAS ==========
  newProperty: any = {
    tipoPropiedad: null,
    idProductoValor: '',
    valor: '',
  };

  productProperties: ProductoValorPropiedad[] = [];
  propertyIdsToDelete: number[] = [];

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

  // ========== LISTAS DE DATOS ==========
  categorias: categorias[] = [];
  subcategorias: subcategoria[] = [];
  proveedores: proveedores[] = [];

  // ========== LISTAS FILTRADAS ==========
  subcategoriasFiltradas: subcategoria[] = [];

  // ========== REFERENCIAS A ELEMENTOS ==========
  @ViewChild('productForm') productForm!: NgForm;
  @ViewChild('responseModal') responseModal!: ElementRef;

  // ========== MODALES ==========
  private responseModalInstance: any;
  private _shouldRedirectAfterModalClose: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private productosService: ProductosService,
    private productoImagenService: ProductoImagenService,
    private productoValorPropiedadService: ProductoValorPropiedadService,
    private categoriasService: CategoriasService,
    private subcategoriaService: SubcategoriaService,
    private tipoPropiedadService: TipoPropiedadService,
    private tipoService: TipoService,
    private varianteService: VariantesService
  ) {}

  // ========== LIFECYCLE HOOKS ==========
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      this.productoId = Number(idParam);

      if (this.productoId) {
        console.log('ID del producto a modificar:', this.productoId);
        this.cargarDatosIniciales();
      } else {
        console.error('No se proporcionó un ID de producto para modificar.');
        this.showResponseModal(
          'Error de Carga',
          'No se encontró el ID del producto para modificar.',
          ['Será redirigido a la lista de productos.'],
          false,
          true
        );
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.responseModal) {
      this.responseModalInstance = new bootstrap.Modal(
        this.responseModal.nativeElement
      );
    }
  }

  // ========== CARGA DE DATOS INICIALES ==========
  private cargarDatosIniciales(): void {
    this.isLoading = true;

    forkJoin({
      producto: this.productosService.findById(this.productoId),
      categorias: this.categoriasService.findAll(),
      subcategorias: this.subcategoriaService.findAll(),
      proveedores: this.productosService.getProveedores(),
      stock: this.stockService.StockDelProducto(this.productoId),
      imagenes: this.productoImagenService.getProductImages(this.productoId).pipe(
        catchError(() => of({ success: true, data: [] }))
      ),
      propiedades: this.productoValorPropiedadService.findById(1).pipe(
        //this.productoId
        catchError(() => of({ success: true, data: [] }))
      )
    })
    .pipe(finalize(() => (this.isLoading = false)))
    .subscribe({
      next: (results) => {
        // Cargar producto
        if (results.producto.success && results.producto.data) {
          this.producto = results.producto.data as productos;
          this.imageUrl = this.producto.imagen || null;
        } else {
          throw new Error('No se pudo cargar el producto');
        }

        // Cargar stock
        if (results.stock.success && results.stock.data) {
          this.stock = results.stock.data as stock;
          this.cantidadStock = this.stock.cantidad;
        }

        // Cargar listas
        this.categorias = results.categorias.data || [];
        this.subcategorias = results.subcategorias.data || [];
        this.proveedores = results.proveedores.data || [];

        // Filtrar subcategorías según la categoría del producto
        if (this.producto.categoria?.idCategoria) {
          this.onCategoriaChange();
        }

        // Cargar imágenes secundarias
        if (results.imagenes.success && results.imagenes.data) {
          this.secondaryImageUrls = results.imagenes.data.map((img: any) => ({
            id: img.idImagen,
            url: img.urlImagen,
            isNew: false
          }));
        }

        // Cargar propiedades
        if (results.propiedades.success && results.propiedades.data) {
          this.productProperties = results.propiedades.data.map((prop: any) => ({
            idProductoValor: prop.idProductoValor,
            tipoPropiedad: prop.tipoPropiedad,
            valor: prop.valor,
            producto: prop.producto
          }));
        }
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        this.showResponseModal(
          'Error de Carga',
          'Error al cargar los datos del producto.',
          ['Por favor, intente nuevamente.'],
          false,
          true
        );
      }
    });
  }

  // ========== MANEJO DE CAMBIOS EN JERARQUÍA ==========
  onCategoriaChange(): void {
    if (this.producto?.categoria?.idCategoria) {
      this.subcategoriaService
        .ListadoSubCategoriasPorCategoria(this.producto.categoria.idCategoria)
        .subscribe({
          next: (res) => (this.subcategoriasFiltradas = res.data || []),
          error: () => console.error('Error al cargar subcategorías.')
        });
    } else {
      this.subcategoriasFiltradas = [];
      if (this.producto) {
        this.producto.subcategoria = {
          idSubcategoria: -1,
          nombre: '',
          descripcion: '',
          estado: true,
          urlImagen: '',
          categoria: { idCategoria: -1, nombre: '' },
        };
      }
    }
  }

  // ========== MANEJO DE ARCHIVOS ==========
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.showResponseModal(
          'Error de Imagen',
          'Tipo de archivo no permitido. Solo se permiten JPG, PNG y GIF.',
          [],
          false
        );
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.showResponseModal(
          'Error de Imagen',
          'El archivo es demasiado grande. El tamaño máximo es 2MB.',
          [],
          false
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
        this.showResponseModal(
          'Error de Imagen',
          `El archivo "${file.name}" no es un tipo de imagen válido.`,
          [],
          false
        );
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.showResponseModal(
          'Error de Imagen',
          `El archivo "${file.name}" es demasiado grande. Máximo 2MB.`,
          [],
          false
        );
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.secondaryImageUrls.push({ 
          url: e.target.result, 
          file,
          isNew: true 
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
      // Remover de secondaryFiles si es nueva
      const fileIndex = this.secondaryFiles.findIndex(f => f === removedImage.file);
      if (fileIndex > -1) {
        this.secondaryFiles.splice(fileIndex, 1);
      }
    }
    this.secondaryImageUrls.splice(index, 1);
  }

  // ========== MANEJO DE PROPIEDADES ==========
  addProperty(): void {
    if (
      this.newProperty.tipoPropiedad &&
      this.newProperty.idProductoValor &&
      this.newProperty.valor
    ) {
      const tipoPropiedadCompleto: tipoPropiedad = {
        tipo: this.newProperty.tipoPropiedad.tipo || 'atributo',
        nombre: this.newProperty.idProductoValor,
        tipoDato: this.newProperty.tipoPropiedad.tipoDato || 'texto',
      };

      if (this.newProperty.tipoPropiedad.idTipoPropiedad) {
        tipoPropiedadCompleto.idTipoPropiedad = this.newProperty.tipoPropiedad.idTipoPropiedad;
      }

      const nuevaPropiedad: ProductoValorPropiedad = {
        idProductoValor: 0,
        tipoPropiedad: tipoPropiedadCompleto,
        valor: this.newProperty.valor,
        producto: undefined,
      };

      this.productProperties.push(nuevaPropiedad);

      // Resetear el formulario de nueva propiedad
      this.newProperty = {
        tipoPropiedad: null,
        idProductoValor: '',
        valor: '',
      };
    }
  }

  removeProperty(index: number): void {
    const removedProperty = this.productProperties[index];
    if (removedProperty.idProductoValor && removedProperty.idProductoValor > 0) {
      this.propertyIdsToDelete.push(removedProperty.idProductoValor);
    }
    this.productProperties.splice(index, 1);
  }

  trackByPropertyId(index: number, prop: ProductoValorPropiedad): number {
    return prop.idProductoValor || index;
  }

  // ========== MANEJO DE ESTADOS ==========
  onEstadoChange(event: any): void {
    if (this.producto) {
      this.producto.estado = event.target.checked ? 1 : 0;
    }
  }

  onDisponibleOnlineChange(event: any): void {
    if (this.producto) {
      this.producto.disponibleOnline = event.target.checked;
    }
  }

  // ========== MANEJO DE INPUTS ==========
  onTipoInput(event: any): void {
    if (this.producto) {
      this.producto.tipo = (event.target.value || '').trim() || null;
    }
  }

  onVarianteInput(event: any): void {
    if (this.producto) {
      this.producto.variante = (event.target.value || '').trim() || null;
    }
  }

  // ========== VALIDACIONES ==========
  private validarFormulario(): boolean {
    const errores: string[] = [];

    if (!this.producto?.nombre || this.producto.nombre.length < 3) {
      errores.push(
        'El nombre del producto es obligatorio y debe tener al menos 3 caracteres.'
      );
    }

    if (!this.producto?.precio || this.producto.precio <= 0) {
      errores.push('El precio debe ser mayor a 0.');
    }

    if (!this.producto?.marca) {
      errores.push('La marca es obligatoria.');
    }

    if (this.producto?.categoria?.idCategoria === -1) {
      errores.push('Debe seleccionar una categoría.');
    }

    if (this.producto?.subcategoria?.idSubcategoria === -1) {
      errores.push('Debe seleccionar una subcategoría.');
    }

    if (!this.cantidadStock || this.cantidadStock < 0) {
      errores.push('La cantidad en stock no puede ser menor a 0.');
    }

    if (errores.length > 0) {
      this.showResponseModal(
        'Error de Validación',
        'Por favor, corrija los siguientes errores:',
        errores,
        false
      );
      return false;
    }

    return true;
  }

  

  // ========== ACTUALIZACIÓN DEL PRODUCTO ==========
  onUpdateProducto(): void {
    // Validaciones
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.controls[key];
      control.markAsTouched();
    });

    if (!this.validarFormulario() || this.productForm.invalid || !this.producto) {
      this.showResponseModal(
        'Error de Validación',
        'Por favor, complete todos los campos obligatorios correctamente.',
        [],
        false
      );
      return;
    }

    // Preparar datos del producto
    const productoPayload = {
      ...this.producto,
      tipo: this.producto.tipo?.trim() || null,
      variante: this.producto.variante?.trim() || null,
    };

    // Convertir strings vacíos a null
    if (this.producto.sku?.trim() === '') {
      productoPayload.sku = null;
    }
    if (this.producto.codigoBarras?.trim() === '') {
      productoPayload.codigoBarras = null;
    }

    this.isLoading = true;

    // Proceso completo de actualización
    const procesoActualizacion: Observable<any> = of(null).pipe(
      // 1. Eliminar imágenes marcadas
      concatMap(() => this.eliminarImagenesMarcadas()),
      // 2. Eliminar propiedades marcadas
      concatMap(() => this.eliminarPropiedadesMarcadas()),
      // 3. Actualizar producto
      concatMap(() => this.actualizarProducto(productoPayload)),
      // 4. Actualizar stock
      concatMap((productoResponse) => this.actualizarStock(productoResponse)),
      // 5. Guardar nuevas imágenes secundarias
      concatMap(() => this.guardarImagenesSecundarias()),
      // 6. Guardar propiedades
      concatMap(() => this.guardarPropiedades()),
      // 7. Actualizar tipo y variante
      concatMap(() => this.actualizarTipoYVariante()),
      finalize(() => (this.isLoading = false))
    );

    procesoActualizacion.subscribe({
      next: () => {
        this.showResponseModal(
          'Actualización Exitosa',
          'El producto ha sido actualizado correctamente.',
          [],
          true,
          true
        );
      },
      error: (error: any) => {
        console.error('Error en la actualización:', error);
        this.showResponseModal(
          'Error en la Actualización',
          'Ocurrió un error al actualizar el producto.',
          [error.message || 'Error desconocido'],
          false
        );
      }
    });
  }

  private eliminarImagenesMarcadas(): Observable<any> {
    if (this.imageIdsToDelete.length === 0) {
      return of(null);
    }

    const deleteObservables = this.imageIdsToDelete.map(id =>
      this.productoImagenService.deleteById(id).pipe(
        catchError(error => {
          console.error(`Error eliminando imagen ${id}:`, error);
          return of(null);
        })
      )
    );

    return forkJoin(deleteObservables);
  }

  private eliminarPropiedadesMarcadas(): Observable<any> {
    if (this.propertyIdsToDelete.length === 0) {
      return of(null);
    }

    const deleteObservables = this.propertyIdsToDelete.map(id =>
      this.productoValorPropiedadService.deleteById(id).pipe(
        catchError(error => {
          console.error(`Error eliminando propiedad ${id}:`, error);
          return of(null);
        })
      )
    );

    return forkJoin(deleteObservables);
  }

  private actualizarProducto(productoPayload: any): Observable<ApiResponse> {
    return this.productosService.update(
      productoPayload,
      this.productoId,
      this.selectedFile || undefined
    ).pipe(
      catchError(error => {
        throw new Error(`Error actualizando producto: ${error.message}`);
      })
    );
  }

  private actualizarStock(productoResponse: ApiResponse): Observable<ApiResponse> {
    const stockData = {
      idStock: this.stock?.idStock || 0,
      cantidad: this.cantidadStock,
      producto: productoResponse.data
    };

    if (this.stock?.idStock) {
      return this.stockService.updateStock(stockData, this.stock.idStock);
    } else {
      return this.stockService.saveStock(stockData);
    }
  }

  private guardarImagenesSecundarias(): Observable<any> {
    if (this.secondaryFiles.length === 0) {
      return of(null);
    }

    return this.productoImagenService.uploadAndSaveProductImages(
      this.productoId,
      this.secondaryFiles
    ).pipe(
      catchError(error => {
        console.error('Error guardando imágenes secundarias:', error);
        return of(null);
      })
    );
  }

  private guardarPropiedades(): Observable<any> {
    if (this.productProperties.length === 0) {
      return of(null);
    }

    const propiedadesObservables = this.productProperties.map(propiedad => {
      // Si es una propiedad existente, actualizar; si es nueva, crear
      if (propiedad.idProductoValor && propiedad.idProductoValor > 0) {
        return this.productoValorPropiedadService.update(
          propiedad.idProductoValor,
          propiedad
        );
      } else {
        // Primero guardar el tipoPropiedad si es necesario
        return this.guardarTipoPropiedad(propiedad.tipoPropiedad).pipe(
          concatMap(tipoPropiedadGuardado => {
            propiedad.tipoPropiedad = tipoPropiedadGuardado;
            propiedad.producto = { idProducto: this.productoId } as any;
            return this.productoValorPropiedadService.save(propiedad);
          })
        );
      }
    });

    return forkJoin(propiedadesObservables).pipe(
      catchError(error => {
        console.error('Error guardando propiedades:', error);
        return of(null);
      })
    );
  }

  private guardarTipoPropiedad(tipoPropiedad: tipoPropiedad): Observable<tipoPropiedad> {
    if (tipoPropiedad.idTipoPropiedad && tipoPropiedad.idTipoPropiedad > 0) {
      return of(tipoPropiedad);
    }

    return this.tipoPropiedadService.save(tipoPropiedad).pipe(
      map((response: ApiResponse) => {
        if (response.success && response.data) {
          return response.data as tipoPropiedad;
        } else {
          throw new Error('Error al guardar TipoPropiedad');
        }
      }),
      catchError(error => {
        console.error('Error guardando TipoPropiedad:', error);
        // Buscar si ya existe
        return this.tipoPropiedadService.findByNombre(tipoPropiedad.nombre).pipe(
          map((response: ApiResponse) => {
            if (response.success && response.data) {
              return response.data as tipoPropiedad;
            }
            throw error;
          }),
          catchError(() => {
            throw error;
          })
        );
      })
    );
  }

  private actualizarTipoYVariante(): Observable<any> {
    if (!this.producto?.tipo && !this.producto?.variante) {
      return of(null);
    }

    // Lógica similar a GuardarTipo() del registrar pero para actualización
    const tipoData: tipo = {
      nombre: this.producto.tipo || '',
      subcategoria: {
        idSubcategoria: this.producto.subcategoria.idSubcategoria || -1,
        nombre: this.producto.subcategoria.nombre || ''
      },
    };

    const varianteData: variante = {
      nombre: this.producto.variante || '',
    };

    // Buscar tipo existente
    return this.tipoService.findByNombre(tipoData.nombre).pipe(
      concatMap((tipoResponse: ApiResponse) => {
        if (tipoResponse.success && tipoResponse.data) {
          // Tipo existe, actualizar variante
          varianteData.tipo = tipoResponse.data;
          return this.varianteService.save(varianteData);
        } else {
          // Crear nuevo tipo
          return this.tipoService.save(tipoData).pipe(
            concatMap((nuevoTipoResponse: ApiResponse) => {
              if (nuevoTipoResponse.success && nuevoTipoResponse.data) {
                varianteData.tipo = nuevoTipoResponse.data;
                return this.varianteService.save(varianteData);
              }
              throw new Error('Error creando nuevo tipo');
            })
          );
        }
      }),
      catchError(error => {
        console.error('Error actualizando tipo y variante:', error);
        return of(null);
      })
    );
  }

  // ========== MODALES Y MENSAJES ==========
  private showResponseModal(
    title: string,
    message: string,
    details: string[] = [],
    isSuccess: boolean = true,
    shouldRedirect: boolean = false
  ): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalDetails = details;
    this.isModalSuccess = isSuccess;
    this._shouldRedirectAfterModalClose = shouldRedirect;
    this.responseModalInstance?.show();
  }

  closeResponseModalAndRedirect(): void {
    this.responseModalInstance?.hide();
    if (this._shouldRedirectAfterModalClose) {
      this.router.navigate(['home/listarProductos']);
    }
  }

  // ========== UTILIDADES ==========
  onCancel(): void {
    if (
      confirm(
        '¿Está seguro de que desea cancelar? Se perderán todos los cambios no guardados.'
      )
    ) {
      this.router.navigate(['/productos']);
    }
  }

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
}