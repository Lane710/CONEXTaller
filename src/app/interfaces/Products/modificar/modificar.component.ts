import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NgForm,
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
import { proveedores } from '../../../models/ProductoStockModel/proveedores';
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
    nombrePropiedad: '',
    valorPropiedad: '',
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
  @ViewChild('imageInput') imageInput!: ElementRef;

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
        this.mostrarErrorModal(
          'Error de Carga',
          'No se encontró el ID del producto para modificar.',
          ['Será redirigido a la lista de productos.'],
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
      propiedades: this.productoValorPropiedadService.findByProductoId(this.productoId).pipe(
        catchError(() => of({ success: true, data: [] }))
      )
    })
    .pipe(finalize(() => (this.isLoading = false)))
    .subscribe({
      next: (results) => {
        console.log('Resultados de la carga inicial:', results);

        // Cargar producto
        if (results.producto.success && results.producto.data) {
          this.producto = results.producto.data as productos;
          this.imageUrl = this.producto.imagen || null;
          console.log('Producto cargado:', this.producto);
        } else {
          throw new Error('No se pudo cargar el producto');
        }

        // Cargar stock
        if (results.stock.success && results.stock.data) {
          this.stock = results.stock.data as stock;
          this.cantidadStock = this.stock.cantidad;
          console.log('Stock cargado:', this.stock);
        }

        // Cargar listas
        this.categorias = results.categorias.data || [];
        this.subcategorias = results.subcategorias.data || [];
        this.proveedores = results.proveedores.data || [];

        // Filtrar subcategorías según la categoría del producto
        

        // Cargar imágenes secundarias
        if (results.imagenes.success && results.imagenes.data) {
          this.secondaryImageUrls = results.imagenes.data.map((img: any) => ({
            id: img.idImagen,
            url: img.urlImagen,
            file: null as any,
            isNew: false
          }));
          console.log('Imágenes secundarias cargadas:', this.secondaryImageUrls);
        }

        // Cargar propiedades
        if (results.propiedades.success && results.propiedades.data) {
          this.productProperties = this.mapearPropiedadesDesdeBackend(results.propiedades.data);
          console.log('Propiedades cargadas y mapeadas:', this.productProperties);
        } else {
          console.log('No se encontraron propiedades para este producto');
        }
      },
      error: (error) => {
        console.error('Error cargando datos iniciales:', error);
        this.mostrarErrorModal(
          'Error de Carga',
          'Error al cargar los datos del producto.',
          ['Por favor, intente nuevamente.'],
          true
        );
      }
    });
  }

  // ========== MAPEO DE PROPIEDADES ==========
  private mapearPropiedadesDesdeBackend(propiedadesBackend: any[]): ProductoValorPropiedad[] {
    console.log('Mapeando propiedades desde backend:', propiedadesBackend);
    
    return propiedadesBackend.map((prop: any) => {
      console.log('Procesando propiedad:', prop);
      
      // Buscar el tipoPropiedad en los tipos predefinidos
      const tipoPropiedadCompleto = this.tiposPropiedad.find(
        tp => tp.idTipoPropiedad === prop.idTipoPropiedad
      );

      console.log('TipoPropiedad encontrado:', tipoPropiedadCompleto);

      // Si no se encuentra, crear un objeto con la información disponible
      const tipoPropiedad: tipoPropiedad = tipoPropiedadCompleto || {
        idTipoPropiedad: prop.idTipoPropiedad,
        tipo: this.obtenerTipoPorId(prop.idTipoPropiedad) || 'atributo',
        nombre: prop.nombreTipoPropiedad || 'Propiedad',
        tipoDato: 'texto'
      };

      const propiedadMapeada: ProductoValorPropiedad = {
        idProductoValor: prop.idProductoValor,
        tipoPropiedad: tipoPropiedad,
        valor: prop.valor,
        producto: { idProducto: prop.idProducto } as any
      };

      console.log('Propiedad mapeada:', propiedadMapeada);
      return propiedadMapeada;
    });
  }

  private obtenerTipoPorId(idTipoPropiedad: number): string {
    const mapeoTipos: { [key: number]: string } = {
      1: 'atributo',
      2: 'caracteristica', 
      3: 'especificacion',
      4: 'atributo',
      5: 'caracteristica',
      17: 'caracteristica',
      18: 'atributo',
      19: 'especificacion',
      20: 'caracteristica',
      21: 'atributo',
      22: 'especificacion'
    };
    
    return mapeoTipos[idTipoPropiedad] || 'atributo';
  }

  // ========== MANEJO DE CAMBIOS EN JERARQUÍA ==========
  onCategoriaChange(): void {
    // if (this.producto?.categoria?.idCategoria) {
    //   this.subcategoriaService
    //     .ListadoSubCategoriasPorCategoria(this.producto.categoria.idCategoria)
    //     .subscribe({
    //       next: (res) => {
    //         this.subcategoriasFiltradas = res.data || [];
    //         console.log('Subcategorías filtradas:', this.subcategoriasFiltradas);
    //       },
    //       error: (error) => {
    //         console.error('Error al cargar subcategorías:', error);
    //         this.mostrarError('Error al cargar subcategorías.');
    //       }
    //     });
    // } else {
    //   this.subcategoriasFiltradas = [];
    //   if (this.producto) {
    //     this.producto.subcategoria = {
    //       idSubcategoria: -1,
    //       nombre: '',
    //       descripcion: '',
    //       estado: true,
    //       urlImagen: '',
    //       categoria: { idCategoria: -1, nombre: '' },
    //     };
    //   }
    // }
  }

  // ========== MANEJO DE ARCHIVOS ==========
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.mostrarError('Tipo de archivo no permitido. Solo se permiten JPG, PNG y GIF.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.mostrarError('El archivo es demasiado grande. El tamaño máximo es 2MB.');
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
        this.mostrarError(`El archivo "${file.name}" no es un tipo de imagen válido.`);
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.mostrarError(`El archivo "${file.name}" es demasiado grande. Máximo 2MB.`);
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
    if (this.newProperty.tipoPropiedad && 
        this.newProperty.nombrePropiedad && 
        this.newProperty.valorPropiedad) {
      
      const nuevoTipo = this.newProperty.tipoPropiedad.tipo;
      const nuevoNombre = this.newProperty.nombrePropiedad.toLowerCase().trim();
      const nuevoValor = this.newProperty.valorPropiedad.toLowerCase().trim();

      console.log('Intentando agregar propiedad:', { nuevoTipo, nuevoNombre, nuevoValor });
      console.log('Propiedades existentes:', this.productProperties);

      // Verificar si ya existe una propiedad con:
      // 1. Mismo tipo, nombre Y valor (completamente idéntica)
      // 2. Mismo nombre y valor pero diferente tipo
      const propiedadExistente = this.productProperties.find(
        prop => {
          const propNombre = prop.tipoPropiedad.nombre.toLowerCase().trim();
          const propValor = prop.valor.toLowerCase().trim();
          const propTipo = prop.tipoPropiedad.tipo;
          
          // Caso 1: Completamente idéntica (mismo tipo, nombre y valor)
          const completamenteIdentica = 
            propTipo === nuevoTipo && 
            propNombre === nuevoNombre && 
            propValor === nuevoValor;
          
          // Caso 2: Mismo nombre y valor pero diferente tipo
          const mismoNombreValorDiferenteTipo = 
            propNombre === nuevoNombre && 
            propValor === nuevoValor && 
            propTipo !== nuevoTipo;
          
          return completamenteIdentica || mismoNombreValorDiferenteTipo;
        }
      );

      if (propiedadExistente) {
        console.log('Propiedad duplicada encontrada:', propiedadExistente);
        
        if (propiedadExistente.tipoPropiedad.tipo === nuevoTipo) {
          this.mostrarError('Ya existe una propiedad idéntica (mismo tipo, nombre y valor).');
        } else {
          this.mostrarError('Ya existe una propiedad con el mismo nombre y valor pero diferente tipo.');
        }
        return;
      }

      // Crear NUEVO tipoPropiedad (sin ID para forzar creación nueva)
      const tipoPropiedadCompleto: tipoPropiedad = {
        idTipoPropiedad: 0, // 0 para forzar creación nueva
        tipo: this.newProperty.tipoPropiedad.tipo,
        nombre: this.newProperty.nombrePropiedad.trim(),
        tipoDato: 'texto'
      };

      const nuevaPropiedad: ProductoValorPropiedad = {
        idProductoValor: 0,
        tipoPropiedad: tipoPropiedadCompleto,
        valor: this.newProperty.valorPropiedad.trim(),
        producto: { idProducto: this.productoId } as any,
      };

      this.productProperties.push(nuevaPropiedad);

      // Resetear el formulario de nueva propiedad
      this.newProperty = {
        tipoPropiedad: null,
        nombrePropiedad: '',
        valorPropiedad: '',
      };

      console.log('✅ Propiedad añadida exitosamente:', nuevaPropiedad);
      console.log('Lista actual de propiedades:', this.productProperties);
    } else {
      console.warn('No se puede agregar propiedad: Campos incompletos', this.newProperty);
      this.mostrarError('Por favor, complete todos los campos de la propiedad.');
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
      console.log('esto sacar capas')
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
      errores.push('El precio de venta debe ser mayor a 0.');
    }

    if (this.producto?.precioCompra !== undefined && this.producto.precioCompra !== null) {
      if (this.producto.precioCompra < 0) {
        errores.push('El precio de compra no puede ser negativo.');
      }
      
      if (this.producto.precio && this.producto.precioCompra > this.producto.precio) {
        errores.push('El precio de compra no puede ser mayor que el precio de venta.');
      }
    }

    if (!this.producto?.marca) {
      errores.push('La marca es obligatoria.');
    }

    

    if (!this.producto?.subcategoria?.idSubcategoria || this.producto.subcategoria.idSubcategoria === -1) {
      errores.push('Debe seleccionar una subcategoría.');
    }

    if (!this.producto?.proveedor?.idProveedor || this.producto.proveedor.idProveedor === -1) {
      errores.push('Debe seleccionar un proveedor.');
    }

    if (!this.cantidadStock || this.cantidadStock < 0) {
      errores.push('La cantidad en stock no puede ser menor a 0.');
    }

    // Nueva validación: Imagen principal obligatoria
    if (!this.imageUrl) {
      errores.push('La imagen principal del producto es obligatoria.');
    }

    if (errores.length > 0) {
      this.mostrarErrorModal(
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
  onSubmit(): void {
    // Validaciones
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.controls[key];
      control.markAsTouched();
    });

    if (!this.validarFormulario() || this.productForm.invalid || !this.producto) {
      this.mostrarError(
        'Por favor, complete todos los campos obligatorios correctamente.'
      );
      return;
    }

    // Preparar datos del producto
    const productoPayload = {
      ...this.producto,
      //tipo: this.producto.tipo?.trim() || null,
      //variante: this.producto.variante?.trim() || null,
    };

    // Convertir strings vacíos a null
    if (this.producto.sku?.trim() === '') {
      productoPayload.sku = undefined;
    }
    if (this.producto.codigoBarras?.trim() === '') {
      productoPayload.codigoBarras = undefined;
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
        this.mostrarExitoModal(
          'Actualización Exitosa',
          'El producto ha sido actualizado correctamente.',
          [],
          true
        );
      },
      error: (error: any) => {
        console.error('Error en la actualización:', error);
        this.mostrarErrorModal(
          'Error en la Actualización',
          'Ocurrió un error al actualizar el producto.',
          [this.obtenerMensajeError(error)],
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

    return forkJoin(deleteObservables).pipe(
      map(results => {
        console.log('Imágenes eliminadas:', results);
        return results;
      })
    );
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

    return forkJoin(deleteObservables).pipe(
      map(results => {
        console.log('Propiedades eliminadas:', results);
        return results;
      })
    );
  }

  private actualizarProducto(productoPayload: any): Observable<ApiResponse> {
    return this.productosService.update(
      productoPayload,
      this.productoId,
      this.selectedFile || undefined
    ).pipe(
      map(response => {
        console.log('Producto actualizado:', response);
        return response;
      }),
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
      return this.stockService.updateStock(stockData, this.stock.idStock).pipe(
        map(response => {
          console.log('Stock actualizado:', response);
          return response;
        })
      );
    } else {
      return this.stockService.saveStock(stockData).pipe(
        map(response => {
          console.log('Stock creado:', response);
          return response;
        })
      );
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
      map(response => {
        console.log('Imágenes secundarias guardadas:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error guardando imágenes secundarias:', error);
        return of(null);
      })
    );
  }

  // ========== GUARDADO DE PROPIEDADES (ACTUALIZADO) ==========
  private guardarPropiedades(): Observable<any> {
    if (this.productProperties.length === 0) {
      return of(null);
    }

    const propiedadesValidas = this.productProperties.filter(
      (prop) => prop.tipoPropiedad && prop.tipoPropiedad.nombre && prop.valor
    );

    if (propiedadesValidas.length === 0) {
      console.log('No hay propiedades válidas para guardar');
      return of(null);
    }

    console.log('Propiedades válidas a guardar:', propiedadesValidas);

    const operaciones: Observable<any>[] = [];

    propiedadesValidas.forEach((propiedad) => {
      const operacion = this.buscarTipoPropiedadExacto(
        propiedad.tipoPropiedad.tipo, 
        propiedad.tipoPropiedad.nombre
      ).pipe(
        // CASO 1: TipoPropiedad EXISTENTE encontrado
        concatMap((tipoPropiedadExistente: tipoPropiedad) => {
          console.log('✅ TipoPropiedad existente encontrado:', tipoPropiedadExistente);
          
          // Crear ProductoValorPropiedad con el tipoPropiedad existente
          const propiedadCompleta: ProductoValorPropiedad = {
            idProductoValor: propiedad.idProductoValor || 0,
            tipoPropiedad: tipoPropiedadExistente,
            valor: propiedad.valor,
            producto: { 
              idProducto: this.productoId 
            } as any
          };

          console.log('Guardando ProductoValorPropiedad con tipo existente:', propiedadCompleta);
          
          // Si es una propiedad existente, actualizar; si es nueva, crear
          if (propiedad.idProductoValor && propiedad.idProductoValor > 0) {
            return this.productoValorPropiedadService.update(
              propiedad.idProductoValor,
              propiedadCompleta
            ).pipe(
              map((response: any) => {
                console.log('✅ ProductoValorPropiedad actualizado con tipo existente:', response);
                return response;
              }),
              catchError((error) => {
                console.error('❌ Error actualizando ProductoValorPropiedad con tipo existente:', error);
                return of(null);
              })
            );
          } else {
            return this.productoValorPropiedadService.save(propiedadCompleta).pipe(
              map((response: any) => {
                console.log('✅ ProductoValorPropiedad guardado con tipo existente:', response);
                return response;
              }),
              catchError((error) => {
                console.error('❌ Error guardando ProductoValorPropiedad con tipo existente:', error);
                return of(null);
              })
            );
          }
        }),
        // CASO 2: TipoPropiedad NO existe - CREAR NUEVO
        catchError((buscarError) => {
          console.log('🆕 TipoPropiedad no encontrado, creando nuevo:', {
            tipo: propiedad.tipoPropiedad.tipo,
            nombre: propiedad.tipoPropiedad.nombre
          });
          
          // Crear NUEVO tipoPropiedad
          const nuevoTipoPropiedad: tipoPropiedad = {
            idTipoPropiedad: 0, // 0 para indicar que es nuevo
            tipo: propiedad.tipoPropiedad.tipo,
            nombre: propiedad.tipoPropiedad.nombre,
            tipoDato: propiedad.tipoPropiedad.tipoDato || 'texto'
          };

          return this.tipoPropiedadService.save(nuevoTipoPropiedad).pipe(
            concatMap((response: ApiResponse) => {
              if (response.success && response.data) {
                const nuevoTipoPropiedadGuardado = response.data as tipoPropiedad;
                console.log('✅ Nuevo TipoPropiedad guardado:', nuevoTipoPropiedadGuardado);
                
                // Crear ProductoValorPropiedad con el NUEVO tipoPropiedad
                const propiedadCompleta: ProductoValorPropiedad = {
                  idProductoValor: propiedad.idProductoValor || 0,
                  tipoPropiedad: nuevoTipoPropiedadGuardado,
                  valor: propiedad.valor,
                  producto: { 
                    idProducto: this.productoId 
                  } as any
                };

                console.log('Guardando ProductoValorPropiedad con NUEVO tipo:', propiedadCompleta);
                
                // Si es una propiedad existente, actualizar; si es nueva, crear
                if (propiedad.idProductoValor && propiedad.idProductoValor > 0) {
                  return this.productoValorPropiedadService.update(
                    propiedad.idProductoValor,
                    propiedadCompleta
                  ).pipe(
                    map((saveResponse: any) => {
                      console.log('✅ ProductoValorPropiedad actualizado con nuevo tipo:', saveResponse);
                      return saveResponse;
                    }),
                    catchError((saveError) => {
                      console.error('❌ Error actualizando ProductoValorPropiedad con nuevo tipo:', saveError);
                      return of(null);
                    })
                  );
                } else {
                  return this.productoValorPropiedadService.save(propiedadCompleta).pipe(
                    map((saveResponse: any) => {
                      console.log('✅ ProductoValorPropiedad guardado con nuevo tipo:', saveResponse);
                      return saveResponse;
                    }),
                    catchError((saveError) => {
                      console.error('❌ Error guardando ProductoValorPropiedad con nuevo tipo:', saveError);
                      return of(null);
                    })
                  );
                }
              } else {
                console.error('❌ Error creando nuevo TipoPropiedad:', response.message);
                return of(null);
              }
            }),
            catchError((saveTipoError) => {
              console.error('❌ Error en el proceso de guardar TipoPropiedad:', saveTipoError);
              return of(null);
            })
          );
        })
      );

      operaciones.push(operacion);
    });

    return forkJoin(operaciones).pipe(
      map((results) => {
        console.log('📊 Resultados del guardado de propiedades:', results);
        const exitosas = results.filter(r => r !== null && r.success);
        const fallidas = results.filter(r => r === null || !r.success);
        
        if (fallidas.length > 0) {
          console.warn(`⚠️ ${fallidas.length} propiedades no se pudieron guardar`);
        }
        
        console.log(`✅ Propiedades guardadas exitosamente: ${exitosas.length} de ${propiedadesValidas.length}`);
        return results;
      }),
      catchError((error) => {
        console.error('❌ Error general en guardado de propiedades:', error);
        return of(null);
      })
    );
  }

  // Método para buscar EXACTAMENTE por tipo Y nombre (combinación exacta)
  private buscarTipoPropiedadExacto(tipo: string, nombre: string): Observable<tipoPropiedad> {
    console.log('Buscando TipoPropiedad EXACTO por tipo y nombre:', { tipo, nombre });

    return this.tipoPropiedadService.findByTipoAndNombreExacto(tipo, nombre).pipe(
      map((response: ApiResponse) => {
        if (response.success && response.data) {
          const tipoPropiedadEncontrado = response.data as tipoPropiedad;
          console.log('✅ TipoPropiedad encontrado (combinación EXACTA):', tipoPropiedadEncontrado);
          return tipoPropiedadEncontrado;
        } else {
          throw new Error('TipoPropiedad no encontrado con combinación exacta tipo y nombre');
        }
      }),
      catchError((error) => {
        if (error.status === 404) {
          console.log('❌ TipoPropiedad no encontrado (404):', { tipo, nombre });
          throw new Error('TipoPropiedad no encontrado');
        }
        console.error('Error en búsqueda de TipoPropiedad exacto:', error);
        throw new Error('Error al buscar TipoPropiedad exacto: ' + error.message);
      })
    );
  }

  private actualizarTipoYVariante(): Observable<any> {
    
    return of(null);
  }

  // ========== UTILIDADES ==========
  private obtenerMensajeError(error: any): string {
    if (error instanceof HttpErrorResponse) {
      if (error.error && error.error.message) {
        return error.error.message;
      }
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verifique su conexión.';
      } else if (error.status === 400) {
        return 'Datos inválidos enviados al servidor.';
      } else if (error.status === 500) {
        return 'Error interno del servidor. Por favor, intente más tarde.';
      }
    }
    return error.message || 'Error desconocido. Por favor, contacte al administrador.';
  }

  private mostrarExitoModal(titulo: string, mensaje: string, detalles: string[] = [], shouldRedirect: boolean = false): void {
    this.isModalSuccess = true;
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    this.modalDetails = detalles;
    this._shouldRedirectAfterModalClose = shouldRedirect;
    this.responseModalInstance?.show();
  }

  private mostrarErrorModal(titulo: string, mensaje: string, detalles: string[] = [], shouldRedirect: boolean = false): void {
    this.isModalSuccess = false;
    this.modalTitle = titulo;
    this.modalMessage = mensaje;
    this.modalDetails = detalles;
    this._shouldRedirectAfterModalClose = shouldRedirect;
    this.responseModalInstance?.show();
  }

  private mostrarError(mensaje: string): void {
    this.mostrarErrorModal('Error', mensaje, [], false);
  }

  closeResponseModalAndRedirect(): void {
    this.responseModalInstance?.hide();
    if (this._shouldRedirectAfterModalClose) {
      this.router.navigate(['home/listarProductos']);
    }
  }

  // ========== NAVEGACIÓN ==========
  onCancel(): void {    
      this.router.navigate(['home/listarProductos']);
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
        errors.push(`Mínimo ${field.errors['minlength'].requiredLength} caracteres.`);
      }
      if (field.errors['maxlength']) {
        errors.push(`Máximo ${field.errors['maxlength'].requiredLength} caracteres.`);
      }
      if (field.errors['min']) {
        errors.push(`El valor mínimo permitido es ${field.errors['min'].min}.`);
      }
    }

    return errors;
  }

  formularioCompleto(): boolean {
    if (!this.producto) return false;

    // Campos obligatorios con verificación de undefined/null
    const nombreValido = !!this.producto.nombre && this.producto.nombre.trim().length >= 3;
    const precioValido = !!this.producto.precio && this.producto.precio > 0;
    const marcaValida = !!this.producto.marca && this.producto.marca.trim().length > 0;
    const subcategoriaValida = !!this.producto.subcategoria?.idSubcategoria && this.producto.subcategoria.idSubcategoria !== -1;
    const proveedorValido = !!this.producto.proveedor?.idProveedor && this.producto.proveedor.idProveedor !== -1;
    const stockValido = this.cantidadStock !== null && this.cantidadStock !== undefined && this.cantidadStock >= 0;
    const imagenValida = !!this.imageUrl; // Imagen principal es obligatoria

    // Precio de compra no es obligatorio, pero si se ingresa debe ser válido
    const precioCompraValido = this.producto.precioCompra === null || 
                              this.producto.precioCompra === undefined || 
                              (!!this.producto.precioCompra && 
                               this.producto.precioCompra >= 0 && 
                               (!this.producto.precio || this.producto.precioCompra <= this.producto.precio));

    return nombreValido && 
           precioValido && 
           marcaValida && 
           subcategoriaValida && 
           proveedorValido && 
           stockValido && 
           imagenValida && 
           precioCompraValido;
  }
}