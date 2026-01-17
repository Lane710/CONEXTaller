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
import { proveedores } from '../../../models/ProductoStockModel/proveedores';

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
    precioCompra: undefined,
    marca: '',
    color: '',
    sku: '',
    codigoBarras: '',
    estado: 1,
    disponibleOnline: true,
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
    tipoPropiedad: null,
    nombrePropiedad: '',
    valorPropiedad: '',
  };

  productProperties: ProductoValorPropiedad[] = [];
  tipoProducto: tipoPropiedad[] = [];

  // ========== LISTAS DE DATOS ==========
  categorias: categorias[] = [];
  subcategorias: subcategoria[] = [];
  proveedores: proveedores[] = [];

  // ========== LISTAS FILTRADAS ==========
  subcategoriasFiltradas: subcategoria[] = [];

  // ========== REFERENCIAS A ELEMENTOS ==========
  @ViewChild('productForm') productForm!: NgForm;
  @ViewChild('responseModal') responseModal!: ElementRef;
  @ViewChild('errorModal') errorModal!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef;

  // ========== MODALES ==========
  private responseModalInstance: any;
  private errorModalInstance: any;

  constructor(
    private router: Router,
    private stockService: StockService,
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
    this.producto.subcategoria = {
      idSubcategoria: -1,
      nombre: '',
      descripcion: '',
      estado: true,
      urlImagen: '',
      categoria: { idCategoria: -1, nombre: '' },
    };

    /*if (this.producto) {
      this.subcategoriaService
        .ListadoSubCategoriasPorCategoria(this.producto)
        .subscribe({
          next: (res) => (this.subcategoriasFiltradas = res.data || []),
          error: () => this.mostrarError('Error al cargar subcategorías.'),
        });
    } else {
      this.subcategoriasFiltradas = [];
    }*/
  }

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

  // ========== VALIDACIÓN DEL FORMULARIO ==========
  private validarFormulario(): boolean {
    const errores: string[] = [];

    if (!this.producto.nombre || this.producto.nombre.length < 3) {
      errores.push(
        'El nombre del producto es obligatorio y debe tener al menos 3 caracteres.'
      );
    }

    if (!this.producto.precio || this.producto.precio <= 0) {
      errores.push('El precio de venta debe ser mayor a 0.');
    }

    if (this.producto.precioCompra !== undefined && this.producto.precioCompra !== null) {
      if (this.producto.precioCompra < 0) {
        errores.push('El precio de compra no puede ser negativo.');
      }
      
      if (this.producto.precio && this.producto.precioCompra > this.producto.precio) {
        errores.push('El precio de compra no puede ser mayor que el precio de venta.');
      }
    }

    if (!this.producto.marca) {
      errores.push('La marca es obligatoria.');
    }

    

    if (!this.producto.subcategoria.idSubcategoria || this.producto.subcategoria.idSubcategoria === -1) {
      errores.push('Debe seleccionar una subcategoría.');
    }

    if (!this.producto.proveedor?.idProveedor || this.producto.proveedor.idProveedor === -1) {
      errores.push('Debe seleccionar un proveedor.');
    }

    if (!this.cantidadStock || this.cantidadStock < 1) {
      errores.push('La cantidad en stock debe ser al menos 1.');
    }

    // Nueva validación: Imagen principal obligatoria
    if (!this.imageUrl) {
      errores.push('La imagen principal del producto es obligatoria.');
    }

    if (errores.length > 0) {
      this.mostrarErroresValidacion(errores);
      return false;
    }

    return true;
  }

  // ========== VALIDACIÓN DE FORMULARIO COMPLETO ==========
  formularioCompleto(): boolean {
    // Campos obligatorios con verificación de undefined/null
    const nombreValido = !!this.producto.nombre && this.producto.nombre.trim().length >= 3;
    const precioValido = !!this.producto.precio && this.producto.precio > 0;
    const marcaValida = !!this.producto.marca && this.producto.marca.trim().length > 0;
    const subcategoriaValida = !!this.producto.subcategoria?.idSubcategoria && this.producto.subcategoria.idSubcategoria !== -1;
    const proveedorValido = !!this.producto.proveedor?.idProveedor && this.producto.proveedor.idProveedor !== -1;
    const stockValido = this.cantidadStock !== null && this.cantidadStock !== undefined && this.cantidadStock >= 1;
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

  // ========== ENVÍO DEL FORMULARIO ==========
  onSubmit(): void {
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.controls[key];
      control.markAsTouched();
    });

    const productoPayload = {
      ...this.producto,
      //tipo: this.producto.tipo?.trim() || null,
      //variante: this.producto.variante?.trim() || null,
    };

    if (!this.validarFormulario() || this.productForm.invalid) {
      this.mostrarError(
        'Por favor, complete todos los campos obligatorios correctamente.'
      );
      return;
    }

    if (this.producto.sku !== null && this.producto.sku !== undefined && this.producto.sku.trim() === '') {
      this.producto.sku = undefined;
    }

    if (this.producto.codigoBarras !== null && this.producto.codigoBarras !== undefined && this.producto.codigoBarras.trim() === '') {
      this.producto.codigoBarras = undefined;
    }

    this.isLoading = true;

    interface ProcesoResult {
      productoResponse: ApiResponse;
      stockResponse: ApiResponse;
      idProducto: number;
    }

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
          const idProducto = productoGuardado.idProducto;

          const stockData = {
            idStock: 0,
            cantidad: this.cantidadStock,
            producto: productoGuardado,
          };

          return this.stockService.saveStock(stockData).pipe(
            map((stockResponse: ApiResponse): ProcesoResult => ({
              productoResponse,
              stockResponse,
              idProducto,
            }))
          );
        }
        throw new Error('Error al guardar el producto');
      }),
      // 3. Guardar imágenes secundarias
      concatMap((result: ProcesoResult) => {
        const idProducto = result.idProducto;
        
        if (this.secondaryFiles.length > 0) {
          return this.productoImagenService.uploadAndSaveProductImages(idProducto, this.secondaryFiles).pipe(
            map(() => result),
            catchError((error) => {
              console.error('Error guardando imágenes secundarias:', error);
              return of(result);
            })
          );
        }
        return of(result);
      }),
      // 4. Guardar propiedades
      concatMap((result: ProcesoResult) => {
        const idProducto = result.idProducto;
        
        if (this.productProperties.length > 0) {
          return this.GuardadoPropiedades(idProducto).pipe(
            map(() => result),
            catchError((error) => {
              console.error('Error guardando propiedades:', error);
              return of(result);
            })
          );
        }
        return of(result);
      }),
      // 5. Guardar tipo y variante
      concatMap((result: ProcesoResult) => {
        this.GuardarTipo();
        return of(result);
      }),
      finalize(() => (this.isLoading = false))
    );

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

  // ========== GUARDADO DE PROPIEDADES ==========
  private GuardadoPropiedades(idProducto: number): Observable<any> {
  console.log('ID Producto en GuardadoPropiedades:', idProducto);
  console.log('Propiedades a guardar:', this.productProperties);

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
          idProductoValor: 0,
          tipoPropiedad: tipoPropiedadExistente,
          valor: propiedad.valor,
          producto: { 
            idProducto: idProducto 
          } as any
        };

        console.log('Guardando ProductoValorPropiedad con tipo existente:', propiedadCompleta);
        
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
                idProductoValor: 0,
                tipoPropiedad: nuevoTipoPropiedadGuardado,
                valor: propiedad.valor,
                producto: { 
                  idProducto: idProducto 
                } as any
              };

              console.log('Guardando ProductoValorPropiedad con NUEVO tipo:', propiedadCompleta);
              
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


  // ========== GUARDADO DE TIPO Y VARIANTE ==========
  GuardarTipo() {
    if (!this.producto && !this.producto) {
      return;
    }

    let tipoObj: tipo = {
      nombre: '',
      subcategoria: { 
        idSubcategoria: this.producto.subcategoria.idSubcategoria || -1, 
        nombre: this.producto.subcategoria.nombre || '' 
      },
    };

    let varianteObj: variante = {
      nombre: this.producto.variante || '',
    };

    console.log("Datos del producto:", this.producto);

    // Si hay tipo, lo guardamos
    // if (this.producto.tipo) {
    //   this.tipoService.findByNombre(tipoObj.nombre).subscribe({
    //     next: (res) => {
    //       console.log('Tipo existente encontrado:', res.data);
    //       // Si hay variante, la guardamos con el tipo existente
    //       if (this.producto.variante) {
    //         varianteObj.tipo = { 
    //           idTipo: res.data.idTipo, 
    //           nombre: res.data.nombre 
    //         };
    //         this.guardarVariante(varianteObj);
    //       }
    //     },
    //     error: (err) => {
    //       if (err.status === 404) {
    //         console.log('Tipo no encontrado, se creará uno nuevo.');
    //         this.tipoService.save(tipoObj).subscribe({
    //           next: (res) => {
    //             console.log('Tipo nuevo guardado:', res);
    //             // Si hay variante, la guardamos con el tipo nuevo
    //             if (this.producto.variante) {
    //               varianteObj.tipo = { 
    //                 idTipo: res.data.idTipo, 
    //                 nombre: res.data.nombre 
    //               };
    //               this.guardarVariante(varianteObj);
    //             }
    //           },
    //           error: (err) => {
    //             console.error('Error guardando tipo nuevo:', err);
    //           },
    //         });
    //       } else {
    //         console.error('Error buscando tipo:', err);
    //       }
    //     },
    //   });
    // } else if (this.producto.variante) {
    //   // Si solo hay variante sin tipo
    //   this.guardarVariante(varianteObj);
    // }
  }

  private guardarVariante(varianteObj: variante) {
    this.varianteService.save(varianteObj).subscribe({
      next: (res) => {
        console.log('Variante guardada:', res);
      },
      error: (err) => {
        console.error('Error guardando variante:', err);
      },
    });
  }

  // ========== MANEJO DE PROPIEDADES ==========
 // ========== MANEJO DE PROPIEDADES ==========
addProperty(): void {
  if (this.newProperty.tipoPropiedad && 
      this.newProperty.nombrePropiedad && 
      this.newProperty.valorPropiedad) {
    
    // Crear NUEVO tipoPropiedad (sin ID para forzar creación)
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
      producto: undefined,
    };

    this.productProperties.push(nuevaPropiedad);

    // Resetear el formulario
    this.newProperty = {
      tipoPropiedad: null,
      nombrePropiedad: '',
      valorPropiedad: '',
    };

    console.log('✅ Propiedad añadida exitosamente:', nuevaPropiedad);
  } else {
    this.mostrarError('Por favor, complete todos los campos de la propiedad.');
  }
}

  // ========== UTILIDADES ==========
  private obtenerMensajeError(error: HttpErrorResponse): string[] {
    const detalles: string[] = [];

    if (error.error && error.error.message) {
      detalles.push(error.error.message);
    }

    if (error.status === 0) {
      detalles.push('No se pudo conectar con el servidor. Verifique su conexión.');
    } else if (error.status === 400) {
      detalles.push('Datos inválidos enviados al servidor.');
    } else if (error.status === 500) {
      detalles.push('Error interno del servidor. Por favor, intente más tarde.');
    }

    if (detalles.length === 0) {
      detalles.push('Error desconocido. Por favor, contacte al administrador.');
    }

    return detalles;
  }

  private mostrarExito(titulo: string, mensaje: string, detalles: string[] = []): void {
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

  private limpiarFormulario(): void {
    this.producto = {
      idProducto: undefined,
      nombre: '',
      descripcion: '',
      precio: 0,
      precioCompra: undefined,
      marca: '',
      color: '',
      sku: '',
      codigoBarras: '',
      estado: 1,
      disponibleOnline: true,
 //     tipo: '',
      variante: '',
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

    this.cantidadStock = 1;
    this.imageUrl = null;
    this.selectedFile = null;
    this.secondaryImageUrls = [];
    this.secondaryFiles = [];
    this.productProperties = [];

    this.newProperty = {
      tipoPropiedad: null,
      nombrePropiedad: '',
      valorPropiedad: '',
    };

    this.subcategoriasFiltradas = [];

    if (this.productForm) {
      this.productForm.resetForm();
    }
  }

  onCancel(): void {
    this.router.navigate(['/home/listarProductos']);
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

  onTipoInput(event: any): void {
    //this.producto = (event.target.value || '').trim() || null;
  }

  onVarianteInput(event: any): void {
    this.producto.variante = (event.target.value || '').trim() || null;
  }

  
}