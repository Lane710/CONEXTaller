// src/app/components/registrar/registrar.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common'; // Importar TitleCasePipe
import {
  FormsModule,
  NgForm,
  Validators,
  ValidationErrors,
  NgModel,
} from '@angular/forms'; // Importar NgModel
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs'; // Importar forkJoin, Observable, of
import { finalize, catchError, concatMap, map } from 'rxjs/operators'; // Importar finalize, catchError, concatMap, map

// Importaciones de modelos
import { productos } from '../../../models/productos';
import { StockService } from '../../../services/stock.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { ApiResponse } from '../../../models/api-response';
import { proveedor } from '../../../models/proveedor';
import { HttpErrorResponse } from '@angular/common/http';
import { stock } from '../../../models/stock';
import { categoria } from '../../../models/categorias';
import { ProductoPropiedad } from '../../../models/ProductoPropiedad';
import { ProductoImagenService } from '../../../services/Secundarios/producto-imagen.service';
import { ProductoPropiedadService } from '../../../services/Secundarios/producto-propiedad.service';
import { ProductoImagen } from '../../../models/ProductoImagen';
import { ProductosService } from '../../../services/productos.service'; // Asegúrate de que ProductosService esté importado

// Importar la librería de Bootstrap para poder usar el modal programáticamente
declare var bootstrap: any;

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe], // Añadir TitleCasePipe a imports
  templateUrl: './registrar.component.html',
  styleUrls: ['./registrar.component.css'],
})
export class RegistrarComponent implements OnInit, AfterViewInit {
  isLoading: boolean = false;

  producto: productos = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: { idCategoria: -1, nombre: '' }, // CAMBIO CLAVE: Inicializado a -1
    idProveedor: null,
    estado: 1,
    imagen: undefined, // Imagen principal
    sku: null,
    codigoBarras: null,
    marca: '',
    color: '',
    disponibleOnline: true,
  };

  cantidadStock: number = 0;

  // Estado para imágenes secundarias
  secondaryFiles: File[] = []; // Archivos reales seleccionados
  secondaryImageUrls: { file: File; url: string }[] = []; // Para previsualización y eliminación temporal

  // Estado para propiedades del producto
  newProperty: ProductoPropiedad = { tipo: '', nombre: '', valor: '' }; // Para el formulario de añadir propiedad
  productProperties: ProductoPropiedad[] = []; // Lista de propiedades añadidas temporalmente

  private initialProductoState: productos = {
    nombre: '',
    descripcion: '',
    precio: 0,
    categoria: { idCategoria: -1, nombre: '' }, // CAMBIO CLAVE: Inicializado a -1
    idProveedor: null,
    estado: 1,
    imagen: undefined,
    sku: null,
    codigoBarras: null,
    marca: '',
    color: '',
    disponibleOnline: true,
  };
  private initialCantidadStockState: number = 0;

  categorias: categoria[] = [];
  proveedores: proveedor[] = [];

  idUsuarioRegistro: string | null = null;

  imageUrl: string | ArrayBuffer | null = null; // Para la imagen principal
  selectedFile: File | null = null; // Para la imagen principal

  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isModalSuccess: boolean = true;
  private _shouldRedirectAfterModalClose: boolean = false;

  @ViewChild('responseModal') responseModalRef!: ElementRef;
  private responseModal: any;

  @ViewChild('productForm') productForm!: NgForm;

  // Referencias a los NgModel de los campos de nueva propiedad
  @ViewChild('newPropertyTypeField') newPropertyTypeField!: NgModel;
  @ViewChild('newPropertyNameField') newPropertyNameField!: NgModel;
  @ViewChild('newPropertyValueField') newPropertyValueField!: NgModel;

  constructor(
    private productosService: ProductosService,
    private stockService: StockService,
    private usuariosService: UsuariosService,
    private productoImagenService: ProductoImagenService, // Inyectar ProductoImagenService
    private productoPropiedadService: ProductoPropiedadService, // Inyectar ProductoPropiedadService
    private router: Router
  ) {
    console.log('RegistrarComponent constructor called'); // Log para depuración
  }

  ngOnInit(): void {
    console.log('RegistrarComponent ngOnInit called'); // Log para depuración
    this.loadCurrentUser();
    this.loadCategorias();
    this.loadProveedores();
  }

  ngAfterViewInit(): void {
    if (this.responseModalRef) {
      this.responseModal = new bootstrap.Modal(
        this.responseModalRef.nativeElement
      );
    }
  }

  showResponseModal(
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
    this.responseModal?.show();
  }

  closeResponseModalAndRedirect(): void {
    this.responseModal?.hide();
    if (this._shouldRedirectAfterModalClose) {
      this.resetFormAndState(); // Usar el nuevo método de reseteo
      this.router.navigate(['/home/listarProductos']);
    }
  }

  resetFormAndState(): void {
    this.productForm.resetForm(this.initialProductoState);
    this.cantidadStock = this.initialCantidadStockState;
    this.selectedFile = null;
    this.imageUrl = null;
    this.secondaryFiles = [];
    this.secondaryImageUrls = [];
    this.productProperties = [];
    this.newProperty = { tipo: '', nombre: '', valor: '' }; // Resetear el formulario de propiedades
    // Asegurarse de resetear los controles de NgModel para las propiedades
    if (this.newPropertyTypeField && this.newPropertyTypeField.control) {
      this.newPropertyTypeField.control.markAsUntouched();
      this.newPropertyTypeField.control.markAsPristine();
      this.newPropertyTypeField.control.updateValueAndValidity();
    }
    if (this.newPropertyNameField && this.newPropertyNameField.control) {
      this.newPropertyNameField.control.markAsUntouched();
      this.newPropertyNameField.control.markAsPristine();
      this.newPropertyNameField.control.updateValueAndValidity();
    }
    if (this.newPropertyValueField && this.newPropertyValueField.control) {
      this.newPropertyValueField.control.markAsUntouched();
      this.newPropertyValueField.control.markAsPristine();
      this.newPropertyValueField.control.updateValueAndValidity();
    }
  }

  loadCurrentUser(): void {
    const storedUsername = localStorage.getItem('current_username');
    if (storedUsername) {
      this.usuariosService.findById(storedUsername).subscribe({
        next: (response: ApiResponse) => {
          if (response && response.data) {
            this.idUsuarioRegistro = response.data.username;
            console.log(
              'ID de usuario de registro cargado (username):',
              this.idUsuarioRegistro
            );
          } else {
            console.warn(
              'No se pudo obtener el username del usuario de registro desde la respuesta del servicio.'
            );
            this.showResponseModal(
              'Error de Carga',
              'No se pudo obtener el ID del usuario de registro.',
              [
                'Asegúrate de que el usuario esté logueado y vuelve a intentarlo.',
              ],
              false,
              false
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al cargar el ID de usuario:', error);
          this.showResponseModal(
            'Error de Carga',
            'Error al cargar el ID de usuario.',
            [
              'La operación de registro podría fallar. Detalles: ' +
                (error.message || 'Error desconocido.'),
            ],
            false,
            false
          );
        },
      });
    } else {
      console.warn(
        'No se encontró el ID de usuario en localStorage. Asegúrate de que el usuario esté logueado.'
      );
      this.showResponseModal(
        'Error de Autenticación',
        'No se encontró el ID de usuario.',
        ['Por favor, inicia sesión para realizar esta operación.'],
        false,
        false
      );
    }
  }

  loadCategorias(): void {
    this.productosService.getCategorias().subscribe({
      next: (response: ApiResponse) => {
        if (response && response.success && response.data) {
          const uniqueCategories = new Map<number, categoria>();
          (response.data as categoria[]).forEach((cat) => {
            if (cat.idCategoria !== undefined) {
              uniqueCategories.set(cat.idCategoria, cat);
            }
          });
          this.categorias = Array.from(uniqueCategories.values());
          console.log('Categorías cargadas:', this.categorias);
          // No se añade lógica para seleccionar por defecto, ya que el HTML maneja el placeholder con [ngValue]="-1"
        } else {
          console.error(
            'No se encontraron categorías o la respuesta no tiene datos válidos.'
          );
          this.showResponseModal(
            'Error de Carga',
            'No se pudieron cargar las categorías.',
            ['Inténtalo de nuevo más tarde o contacta al soporte.'],
            false,
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar las categorías:', err);
        this.showResponseModal(
          'Error de Carga',
          'Error al cargar las categorías.',
          ['Detalles: ' + (err.message || 'Error desconocido.')],
          false,
          false
        );
      },
    });
  }

  loadProveedores(): void {
    this.productosService.getProveedores().subscribe({
      next: (response: ApiResponse) => {
        if (response && response.success && response.data) {
          this.proveedores = response.data as proveedor[];
          console.log('Proveedores cargados:', this.proveedores);
          // CAMBIO CLAVE: Eliminar la lógica de selección por defecto para proveedores también
          // if (this.proveedores.length > 0 && this.producto.idProveedor === null) {
          //   this.producto.idProveedor = this.proveedores[0].idProveedor;
          // }
        } else {
          console.error(
            'No se encontraron proveedores o la respuesta no tiene datos válidos.'
          );
          this.showResponseModal(
            'Error de Carga',
            'No se pudieron cargar los proveedores.',
            ['Inténtalo de nuevo más tarde o contacta al soporte.'],
            false,
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar los proveedores:', err);
        this.showResponseModal(
          'Error de Carga',
          'Error al cargar los proveedores.',
          ['Detalles: ' + (err.message || 'Error desconocido.')],
          false,
          false
        );
      },
    });
  }

  onEstadoChange(event: Event): void {
    this.producto.estado = (event.target as HTMLInputElement).checked ? 1 : 0;
  }

  onDisponibleOnlineChange(event: Event): void {
    this.producto.disponibleOnline = (event.target as HTMLInputElement).checked;
  }

  // Lógica para la imagen principal
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file: File = input.files[0];

      const fileTypeErrors = this.fileTypeValidator(file);
      const fileSizeErrors = this.fileSizeValidator(file);

      if (fileTypeErrors || fileSizeErrors) {
        this.selectedFile = null;
        this.imageUrl = null;
        let errorMsg = '';
        if (fileTypeErrors)
          errorMsg += 'Tipo de archivo no permitido (solo JPG, PNG, GIF). ';
        if (fileSizeErrors)
          errorMsg += 'La imagen excede el tamaño máximo (2MB).';
        this.showResponseModal('Error de Imagen', errorMsg, [], false, false);
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imageUrl = null;
    }
  }

  // Lógica para imágenes secundarias
  onSecondaryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        const fileTypeErrors = this.fileTypeValidator(file);
        const fileSizeErrors = this.fileSizeValidator(file);

        if (fileTypeErrors || fileSizeErrors) {
          let errorMsg = `Error en el archivo "${file.name}": `;
          if (fileTypeErrors)
            errorMsg += 'Tipo no permitido (solo JPG, PNG, GIF). ';
          if (fileSizeErrors) errorMsg += 'Excede el tamaño máximo (2MB).';
          this.showResponseModal(
            'Error de Imagen Secundaria',
            errorMsg,
            [],
            false,
            false
          );
          continue; // Continuar con el siguiente archivo
        }

        this.secondaryFiles.push(file); // Guardar el archivo real

        const reader = new FileReader();
        reader.onload = (e) => {
          this.secondaryImageUrls.push({
            file: file,
            url: reader.result as string,
          }); // Guardar URL para previsualización
        };
        reader.readAsDataURL(file);
      }
      // Limpiar el input de archivo para poder seleccionar los mismos archivos de nuevo si se desea
      input.value = '';
    }
  }

  removeSecondaryImage(index: number): void {
    if (index > -1 && index < this.secondaryImageUrls.length) {
      // Eliminar de ambas listas para mantener la sincronización
      this.secondaryFiles.splice(index, 1);
      this.secondaryImageUrls.splice(index, 1);
    }
  }

  addProperty(): void {
    console.log('addProperty method called'); // Log para depuración
    // Verificar que los campos de la nueva propiedad no estén vacíos
    if (
      this.newProperty.tipo &&
      this.newProperty.nombre &&
      this.newProperty.valor
    ) {
      // Crear una copia para evitar problemas de referencia si se edita newProperty después
      this.productProperties.push({ ...this.newProperty });
      // Resetear el objeto newProperty
      this.newProperty = { tipo: '', nombre: '', valor: '' };

      // Resetear el estado de validación de los campos individuales
      // Esto es CRUCIAL para que los inputs no se queden marcados como inválidos
      if (this.newPropertyTypeField && this.newPropertyTypeField.control) {
        this.newPropertyTypeField.control.markAsUntouched();
        this.newPropertyTypeField.control.markAsPristine();
        this.newPropertyTypeField.control.updateValueAndValidity();
      }
      if (this.newPropertyNameField && this.newPropertyNameField.control) {
        this.newPropertyNameField.control.markAsUntouched();
        this.newPropertyNameField.control.markAsPristine();
        this.newPropertyNameField.control.updateValueAndValidity();
      }
      if (this.newPropertyValueField && this.newPropertyValueField.control) {
        this.newPropertyValueField.control.markAsUntouched();
        this.newPropertyValueField.control.markAsPristine();
        this.newPropertyValueField.control.updateValueAndValidity();
      }

      // Forzar una actualización de la validez del formulario principal
      this.productForm.form.updateValueAndValidity();
    } else {
      this.showResponseModal(
        'Datos Incompletos',
        'Por favor, complete todos los campos de la propiedad (Tipo, Nombre, Valor).',
        [],
        false,
        false
      );
    }
  }

  removeProperty(index: number): void {
    if (index > -1 && index < this.productProperties.length) {
      this.productProperties.splice(index, 1);
    }
  }

  // Función trackBy para propiedades, para optimizar el rendimiento de la lista
  trackByPropertyId(index: number, property: ProductoPropiedad): any {
    // Para elementos temporales sin ID de backend, el índice es suficiente para la unicidad
    // Si tu ProductoPropiedad tuviera un ID antes de guardarse, lo usarías aquí: property.idPropiedad || index;
    return index;
  }

  // Validadores de archivo (existentes)
  fileTypeValidator(file: File): ValidationErrors | null {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { fileType: true };
      }
    }
    return null;
  }

  fileSizeValidator(file: File): ValidationErrors | null {
    if (file) {
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return { fileSize: true };
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.idUsuarioRegistro === null) {
      this.showResponseModal(
        'Error de Registro',
        'No se pudo obtener el ID del usuario de registro.',
        [
          'La operación no se puede completar sin un usuario de registro válido. Por favor, recargue la página o inicie sesión.',
        ],
        false,
        false
      );
      return;
    }

    this.productForm.form.markAllAsTouched();

    if (this.productForm.invalid) {
      console.warn(
        'Formulario inválido. Por favor, revise los campos marcados.'
      );
      this.showResponseModal(
        'Formulario Inválido',
        'Por favor, corrija los errores en el formulario antes de enviar.',
        [],
        false,
        false
      );
      return;
    }

    this.isLoading = true; // Iniciar carga
    this.modalDetails = []; // Limpiar detalles de modales anteriores

    const productToSend: productos = { ...this.producto };
    productToSend.idUsuarioRegistro = this.idUsuarioRegistro;

    if (productToSend.sku && productToSend.sku.trim() === '') {
      productToSend.sku = null;
    }
    if (
      productToSend.codigoBarras &&
      productToSend.codigoBarras.trim() === ''
    ) {
      productToSend.codigoBarras = null;
    }
    if (productToSend.idProveedor === 0) {
      productToSend.idProveedor = null;
    }

    this.productosService
      .checkProductExistence(productToSend)
      .pipe(
        finalize(() => (this.isLoading = false)) // Asegurar que isLoading se desactive
      )
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.data == null) {
            // Producto no existe, proceder a guardar
            this.productosService
              .save(productToSend, this.selectedFile || undefined)
              .pipe(
                concatMap((productResponse: ApiResponse) => {
                  if (
                    productResponse?.success &&
                    productResponse.data?.idProducto
                  ) {
                    const newProduct: productos =
                      productResponse.data as productos;
                    const productId: number = newProduct.idProducto!;

                    this.modalDetails.push(
                      'Producto principal guardado exitosamente.'
                    );

                    // Actualizar imagen principal si se subió
                    if (newProduct.imagen) {
                      this.imageUrl = newProduct.imagen;
                      this.selectedFile = null;
                    }

                    // Guardar Stock
                    const stockSave$: Observable<ApiResponse> =
                      this.stockService
                        .saveStock({
                          cantidad: this.cantidadStock,
                          producto: { idProducto: productId } as productos,
                        })
                        .pipe(
                          catchError((stockError: HttpErrorResponse) => {
                            this.modalDetails.push(
                              'Ocurrió un error inesperado al guardar stock.'
                            );
                            this.modalDetails.push(
                              `Detalles: ${
                                stockError.message || 'Error desconocido.'
                              }`
                            );
                            return of({
                              success: false,
                              message: 'Error al guardar stock.',
                              data: null,
                              httpStatusCode: stockError.status,
                            });
                          })
                        );

                    // Guardar Imágenes Secundarias
                    const secondaryImagesSave$: Observable<ApiResponse | any> =
                      this.secondaryFiles.length > 0
                        ? this.productoImagenService
                            .uploadAndSaveProductImages(
                              productId,
                              this.secondaryFiles
                            )
                            .pipe(
                              catchError((imagesError: HttpErrorResponse) => {
                                this.modalDetails.push(
                                  'Ocurrió un error inesperado al guardar imágenes secundarias.'
                                );
                                this.modalDetails.push(
                                  `Detalles: ${
                                    imagesError.message || 'Error desconocido.'
                                  }`
                                );
                                return of({
                                  success: false,
                                  message:
                                    'Error al guardar imágenes secundarias.',
                                  data: null,
                                  httpStatusCode: imagesError.status,
                                });
                              })
                            )
                        : of({
                            success: true,
                            message: 'No hay imágenes secundarias para subir.',
                            data: null,
                            httpStatusCode: 200,
                          });

                    // Guardar Propiedades
                    const propertiesSaveObservables: Observable<any>[] =
                      this.productProperties.map((prop) => {
                        const propToSave = { ...prop, id_producto: productId };
                        return this.productoPropiedadService
                          .save(propToSave)
                          .pipe(
                            catchError((propError: HttpErrorResponse) => {
                              this.modalDetails.push(
                                `Error al guardar propiedad "${prop.nombre}": ${
                                  propError.message || 'Desconocido'
                                }`
                              );
                              return of({
                                success: false,
                                message: `Error al guardar propiedad ${prop.nombre}.`,
                                data: null,
                                httpStatusCode: propError.status,
                              });
                            })
                          );
                      });
                    const propertiesSave$: Observable<
                      ApiResponse | any | ApiResponse[]
                    > =
                      propertiesSaveObservables.length > 0
                        ? forkJoin(propertiesSaveObservables)
                        : of({
                            success: true,
                            message: 'No hay propiedades para guardar.',
                            data: null,
                            httpStatusCode: 200,
                          });

                    // Ejecutar operaciones en paralelo
                    return forkJoin([
                      stockSave$,
                      secondaryImagesSave$,
                      propertiesSave$,
                    ]).pipe(
                      map(
                        ([stockRes, imagesRes, propsRes]: [
                          ApiResponse,
                          ApiResponse | any,
                          ApiResponse | any | ApiResponse[]
                        ]) => {
                          let isOverallSuccess = true;

                          if (stockRes?.success) {
                            this.modalDetails.push(
                              'Stock registrado exitosamente.'
                            );
                          } else {
                            this.modalDetails.push(
                              `Error al registrar stock: ${
                                stockRes?.message || 'Desconocido.'
                              }`
                            );
                            isOverallSuccess = false;
                          }

                          if (
                            imagesRes?.success ||
                            imagesRes?.message ===
                              'No hay imágenes secundarias para subir.'
                          ) {
                            this.modalDetails.push(
                              `Imágenes secundarias: ${
                                imagesRes?.message || 'Guardadas exitosamente.'
                              }`
                            );
                          } else {
                            this.modalDetails.push(
                              `Error al guardar imágenes secundarias: ${
                                imagesRes?.message || 'Desconocido'
                              }`
                            );
                            isOverallSuccess = false;
                          }

                          if (Array.isArray(propsRes)) {
                            const failedProps = propsRes.filter(
                              (r) => !(r as ApiResponse)?.success
                            );
                            if (failedProps.length === 0) {
                              this.modalDetails.push(
                                `Propiedades: ${
                                  this.productProperties.length > 0
                                    ? 'Guardadas exitosamente.'
                                    : 'No hay propiedades para guardar.'
                                }`
                              );
                            } else {
                              this.modalDetails.push(
                                `Error al guardar ${failedProps.length} propiedades.`
                              );
                              isOverallSuccess = false;
                            }
                          } else if (
                            (propsRes as ApiResponse)?.success ||
                            (propsRes as any)?.message ===
                              'No hay propiedades para guardar.'
                          ) {
                            this.modalDetails.push(
                              `Propiedades: ${
                                (propsRes as any)?.message ||
                                'Guardadas exitosamente.'
                              }`
                            );
                          } else {
                            this.modalDetails.push(
                              `Error al guardar propiedades: ${
                                (propsRes as any)?.message || 'Desconocido'
                              }`
                            );
                            isOverallSuccess = false;
                          }

                          return { isOverallSuccess, isUpdate: false };
                        }
                      )
                    );
                  } else {
                    return this.handleErrorAndReturnObservable(
                      'Error de Registro',
                      'No se pudo registrar el producto principal.',
                      [productResponse?.message || 'Error desconocido.'],
                      false
                    );
                  }
                }),
                catchError((err) => {
                  console.error('Error en la cadena de operaciones:', err);
                  return this.handleErrorAndReturnObservable(
                    'Error General',
                    'Ocurrió un error inesperado durante el proceso.',
                    [`Detalles: ${err.message || 'Error desconocido.'}`],
                    false
                  );
                })
              )
              .subscribe({
                next: (finalResult) => {
                  if (finalResult) {
                    const overallSuccess = finalResult.isOverallSuccess;
                    this.showResponseModal(
                      overallSuccess
                        ? 'Registro Exitoso'
                        : 'Registro con Errores',
                      overallSuccess
                        ? '¡Producto, stock, imágenes y propiedades registrados con éxito!'
                        : 'Ocurrió un error durante el registro.',
                      this.modalDetails,
                      overallSuccess,
                      overallSuccess // Redirige solo si todo fue exitoso
                    );
                  }
                },
                error: (err) => {
                  console.error('Error en el flujo de guardado:', err);
                  this.showResponseModal(
                    'Error General',
                    'Ocurrió un error inesperado durante el proceso.',
                    [`Detalles: ${err.message || 'Error desconocido.'}`],
                    false,
                    false
                  );
                },
              });
          } else {
            // Producto ya existe, actualizar stock
            const idProducto = response.data.idProducto;
            this.stockService
              .StockDelProducto(idProducto)
              .pipe(
                concatMap((stockResponse: ApiResponse) => {
                  if (stockResponse.data) {
                    return this.stockService
                      .addStockProductos(stockResponse.data, this.cantidadStock)
                      .pipe(
                        map((addStockResponse: ApiResponse) => {
                          this.modalDetails.push(
                            'Stock actualizado exitosamente.'
                          );
                          return {
                            success: true,
                            message: 'Stock actualizado exitosamente.',
                          };
                        }),
                        catchError((addStockError: HttpErrorResponse) => {
                          this.modalDetails.push('Error al actualizar stock.');
                          this.modalDetails.push(
                            `Detalles: ${
                              addStockError.message || 'Error desconocido.'
                            }`
                          );
                          return of({
                            success: false,
                            message: 'Error al actualizar stock.',
                          });
                        })
                      );
                  } else {
                    // No hay stock existente, crear nuevo stock
                    return this.stockService
                      .saveStock({
                        cantidad: this.cantidadStock,
                        producto: { idProducto: idProducto } as productos,
                      })
                      .pipe(
                        map((saveStockResponse: ApiResponse) => {
                          this.modalDetails.push('Stock creado exitosamente.');
                          return {
                            success: true,
                            message: 'Stock creado exitosamente.',
                          };
                        }),
                        catchError((saveStockError: HttpErrorResponse) => {
                          this.modalDetails.push('Error al crear stock.');
                          this.modalDetails.push(
                            `Detalles: ${
                              saveStockError.message || 'Error desconocido.'
                            }`
                          );
                          return of({
                            success: false,
                            message: 'Error al crear stock.',
                          });
                        })
                      );
                  }
                }),
                finalize(() => (this.isLoading = false)) // Asegurar que isLoading se desactive
              )
              .subscribe({
                next: (result) => {
                  this.showResponseModal(
                    result.success
                      ? 'Stock Actualizado'
                      : 'Error al Actualizar Stock',
                    result.success
                      ? `El producto con ID ${idProducto} ya existe. Stock actualizado exitosamente.`
                      : `El producto con ID ${idProducto} ya existe, pero ocurrió un error al actualizar el stock.`,
                    this.modalDetails,
                    result.success,
                    result.success // Redirige solo si fue exitoso
                  );
                },
                error: (err) => {
                  console.error(
                    'Error en el flujo de actualización de stock:',
                    err
                  );
                  this.showResponseModal(
                    'Error General',
                    `El producto con ID ${idProducto} ya existe, pero ocurrió un error inesperado.`,
                    [`Detalles: ${err.message || 'Error desconocido.'}`],
                    false,
                    false
                  );
                },
              });
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al verificar existencia del producto:', err);
          this.isLoading = false; // Desactivar isLoading
          this.showResponseModal(
            'Error de Verificación',
            'Error al verificar la existencia del producto.',
            [`Detalles: ${err.message || 'Error desconocido.'}`],
            false,
            false
          );
        },
      });
  }

  // Helper para manejar errores y devolver un observable para la cadena concatMap
  private handleErrorAndReturnObservable(
    title: string,
    message: string,
    details: string[],
    isSuccess: boolean
  ): Observable<any> {
    this.isLoading = false;
    this.showResponseModal(title, message, details, isSuccess, false);
    return new Observable((observer) => observer.error(new Error(message))); // Propagar el error para detener la cadena
  }

  onCancel(): void {
    this.router.navigate(['/home/listarProductos']);
  }
}
