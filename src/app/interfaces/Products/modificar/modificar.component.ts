// src/app/components/modificar/modificar.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductosService } from '../../../services/ProductosServis/productos.service';
import { StockService } from '../../../services/ProductosServis/stock.service';
import { productos } from '../../../models/ProductoStockModel/productos';
import { stock } from '../../../models/ProductoStockModel/stock';
import { FormsModule, NgForm, ValidationErrors, NgModel } from '@angular/forms'; // Importa NgForm, ValidationErrors, NgModel
import { CommonModule, TitleCasePipe } from '@angular/common'; // Importa TitleCasePipe
import { proveedor } from '../../../models/proveedor';
import { ApiResponse } from '../../../models/api-response';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http'; // Asegúrate de importar HttpErrorResponse


import { finalize, catchError, concatMap, map } from 'rxjs/operators'; // Importa map

import { ProductoImagenService } from '../../../services/ProductosServis/Secundarios/producto-imagen.service'; // Asegúrate de que esta ruta sea correcta

import { ProductoImagen } from '../../../models/ProductoStockModel/ProductoImagen'; // Asegúrate de que esta ruta sea correcta
import { TipoPropiedadService } from '../../../services/ProductosServis/tipo-propiedad-service.service';
import { categorias } from '../../../models/ProductoStockModel/categorias';
import { tipoPropiedad } from '../../../models/ProductoStockModel/tipoPropiedad';


declare var bootstrap: any;

@Component({
  selector: 'app-modificar',
  standalone: true,
  imports: [FormsModule, CommonModule, TitleCasePipe],
  templateUrl: './modificar.component.html',
  styleUrl: './modificar.component.css'
})
export class ModificarComponent implements OnInit, AfterViewInit {
  productoId: number = 0;
  producto: productos | null = null;
  stock: stock | null = null;
  categorias: categorias[] = [];
  proveedores: proveedor[] = [];

  isLoading: boolean = false;

  // Propiedades para la imagen principal
  imageUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  // Propiedades para imágenes secundarias
  secondaryFiles: File[] = []; // Archivos nuevos para subir
  secondaryImageUrls: { id?: number, url: string, isNew: boolean, file?: File }[] = []; // Incluye archivo para nuevas imágenes
  imageIdsToDelete: number[] = []; // Lista de IDs de imágenes a eliminar

  // Propiedades para propiedades del producto
  newProperty: tipoPropiedad = { tipo: '', nombre: '', tipoDato: '' };
  productProperties: tipoPropiedad[] = [];
  propertyIdsToDelete: number[] = []; // Lista de IDs de propiedades a eliminar

  // Propiedades para el modal
  modalTitle: string = '';
  modalMessage: string = '';
  modalDetails: string[] = [];
  isModalSuccess: boolean = true;
  private _shouldRedirectAfterModalClose: boolean = false;

  @ViewChild('responseModal') responseModalRef!: ElementRef;
  private responseModal: any;

  @ViewChild('productForm') productForm!: NgForm;

  @ViewChild('newPropertyTypeField') newPropertyTypeField!: NgModel;
  @ViewChild('newPropertyNameField') newPropertyNameField!: NgModel;
  @ViewChild('newPropertyValueField') newPropertyValueField!: NgModel;

  constructor(
    private route: ActivatedRoute,
    private productosService: ProductosService,
    private stockService: StockService,
    private productoImagenService: ProductoImagenService,
    private productoPropiedadService: TipoPropiedadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      this.productoId = Number(idParam);

      if (this.productoId) {
        console.log('ID del producto a modificar:', this.productoId);
        //this.loadProductAndStock(this.productoId);
        this.loadCategorias();
        this.loadProveedores();
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
    if (this.responseModalRef) {
      this.responseModal = new bootstrap.Modal(this.responseModalRef.nativeElement);
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
      this.router.navigate(['/home/listarProductos']);
    }
  }

  /*loadProductAndStock(idProducto: number): void {
    this.isLoading = true;
    forkJoin([
      this.productosService.findById(idProducto),
      this.stockService.findAll(),
      this.productoImagenService.getProductImages(idProducto).pipe(
        catchError((err: HttpErrorResponse) => {
          console.warn(`Error al cargar imágenes secundarias para el producto ${idProducto}:`, err);
          return of({ success: true, message: 'No se encontraron imágenes secundarias.', data: [], httpStatusCode: err.status || 200 });
        })
      ),

      this.productoPropiedadService.listarAtributoProducto(idProducto).pipe(
        catchError((err: HttpErrorResponse) => {
          console.warn(`Error al cargar propiedades para el producto ${idProducto}:`, err);
          return of({ success: true, message: 'No se encontraron propiedades para el producto.', data: [], httpStatusCode: err.status || 200 });
        })
      )
    ]).pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe(([productResponse, allStocksResponse, imagesResponse, propertiesResponse]) => {
      if (!productResponse || !productResponse.success || !productResponse.data) {
        console.error('No se encontró el producto:', { productResponse });
        this.producto = null;
        this.showResponseModal(
          'Error de Carga',
          'No se pudo cargar el producto.',
          ['Mensaje: ' + (productResponse ? productResponse.message : 'Desconocido'), 'Será redirigido a la lista de productos.'],
          false,
          true
        );
        return;
      }
      this.producto = productResponse.data as productos;
      console.log('Producto cargado:', this.producto);
      this.imageUrl = this.producto.imagen || null;

      if (allStocksResponse && allStocksResponse.success && allStocksResponse.data) {
        const allStocks: stock[] = allStocksResponse.data;
        this.stock = allStocks.find(st => st.producto?.idProducto === idProducto) || null;
        if (this.stock) {
          console.log('Stock cargado:', this.stock);
        } else {
          console.warn('No se encontró stock. Creando uno temporal con cantidad 0.');
          this.stock = { producto: this.producto, cantidad: 0 };
        }
      } else {
        console.warn('No se pudieron cargar los registros de stock.');
        this.stock = { producto: this.producto, cantidad: 0 };
      }

      if (imagesResponse && imagesResponse.success && imagesResponse.data) {
        this.secondaryImageUrls = (imagesResponse.data as ProductoImagen[]).map(img => ({
          id: img.idImagen,
          url: img.urlImagen,
          isNew: false
        }));
        console.log('Imágenes secundarias cargadas:', this.secondaryImageUrls);
      } else {
        this.secondaryImageUrls = [];
      }

      if (propertiesResponse && propertiesResponse.success && propertiesResponse.data) {
        this.productProperties = (propertiesResponse.data as ProductoPropiedad[]).map(prop => ({
          idPropiedad: prop.idPropiedad,
          tipo: prop.tipo,
          nombre: prop.nombre,
          valor: prop.valor,
          id_producto: prop.idProducto
        }));
        console.log('Propiedades cargadas:', this.productProperties);
      } else {
        this.productProperties = [];
      }

      if (!this.producto) {
        this.router.navigate(['/home/listarProductos']);
      }
    });
  }*/

  loadCategorias(): void {
    this.productosService.getCategorias().subscribe({
      next: (response: ApiResponse) => {
        if (response && response.success && response.data) {
          this.categorias = response.data as categorias[];
        } else {
          this.showResponseModal(
            'Error de Carga',
            'No se pudieron cargar las categorías.',
            ['Inténtalo de nuevo más tarde o contacta al soporte.'],
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        this.showResponseModal(
          'Error de Carga',
          'Error de comunicación al cargar las categorías.',
          [`Detalles: ${err.message || 'Error desconocido'}`],
          false
        );
      }
    });
  }

  loadProveedores(): void {
    this.productosService.getProveedores().subscribe({
      next: (response: ApiResponse) => {
        if (response && response.success && response.data) {
          this.proveedores = response.data as proveedor[];
        } else {
          this.showResponseModal(
            'Error de Carga',
            'No se pudieron cargar los proveedores.',
            ['Inténtalo de nuevo más tarde o contacta al soporte.'],
            false
          );
        }
      },
      error: (err: HttpErrorResponse) => {
        this.showResponseModal(
          'Error de Carga',
          'Error de comunicación al cargar los proveedores.',
          [`Detalles: ${err.message || 'Error desconocido'}`],
          false
        );
      }
    });
  }

  onEstadoChange(event: Event): void {
    if (this.producto) {
      this.producto.estado = (event.target as HTMLInputElement).checked ? 1 : 0;
    }
  }

  onDisponibleOnlineChange(event: Event): void {
    if (this.producto) {
      this.producto.disponibleOnline = (event.target as HTMLInputElement).checked;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file: File = input.files[0];
      const fileTypeErrors = this.fileTypeValidator(file);
      const fileSizeErrors = this.fileSizeValidator(file);

      if (fileTypeErrors || fileSizeErrors) {
        this.selectedFile = null;
        this.imageUrl = this.producto?.imagen || null;
        let errorMsg = '';
        if (fileTypeErrors) errorMsg += 'Tipo de archivo no permitido (solo JPG, PNG, GIF). ';
        if (fileSizeErrors) errorMsg += 'La imagen excede el tamaño máximo (2MB).';
        this.showResponseModal('Error de Imagen', errorMsg, [], false, false);
        return;
      }

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => {
        this.imageUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedFile = null;
      this.imageUrl = this.producto?.imagen || null;
    }
  }

  onSecondaryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const fileTypeErrors = this.fileTypeValidator(file);
        const fileSizeErrors = this.fileSizeValidator(file);

        if (fileTypeErrors || fileSizeErrors) {
          let errorMsg = `Error en el archivo "${file.name}": `;
          if (fileTypeErrors) errorMsg += 'Tipo no permitido (solo JPG, PNG, GIF). ';
          if (fileSizeErrors) errorMsg += 'Excede el tamaño máximo (2MB).';
          this.showResponseModal('Error de Imagen Secundaria', errorMsg, [], false, false);
          continue;
        }

        this.secondaryFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          this.secondaryImageUrls.push({
            url: reader.result as string,
            isNew: true,
            file: file
          });
        };
        reader.readAsDataURL(file);
      }
      input.value = '';
    }
  }

  removeSecondaryImage(index: number): void {
    if (index > -1 && index < this.secondaryImageUrls.length) {
      const removedImage = this.secondaryImageUrls[index];
      if (removedImage.isNew && removedImage.file) {
        // Eliminar archivo nuevo de secondaryFiles
        const fileIndex = this.secondaryFiles.findIndex(f => f === removedImage.file);
        if (fileIndex > -1) {
          this.secondaryFiles.splice(fileIndex, 1);
        }
      } else if (removedImage.id) {
        // Marcar imagen existente para eliminación
        this.imageIdsToDelete.push(removedImage.id);
      }
      this.secondaryImageUrls.splice(index, 1);
    }
  }

  /*addProperty(): void {
    if (this.newProperty.tipo && this.newProperty.nombre && this.newProperty.valor) {
      this.productProperties.push({ ...this.newProperty });
      this.newProperty = { tipo: '', nombre: '', valor: '' };

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
      const removedProperty = this.productProperties[index];
      if (removedProperty.idPropiedad) {
        this.propertyIdsToDelete.push(removedProperty.idPropiedad);
      }
      this.productProperties.splice(index, 1);
    }
  }*/

  trackByPropertyId(index: number, property: tipoPropiedad): any {
    return property.idTipoPropiedad || index;
  }

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

  onUpdateProducto(): void {
    this.isLoading = true;
    this.modalDetails = [];

    this.productForm.form.markAllAsTouched();

    if (this.productForm.invalid) {
      this.isLoading = false;
      console.warn('Formulario inválido.');
      this.showResponseModal(
        'Formulario Inválido',
        'Por favor, complete todos los campos obligatorios y corrija los errores.',
        [],
        false
      );
      return;
    }

    if (!this.producto || !this.producto.idProducto) {
      this.isLoading = false;
      this.showResponseModal(
        'Error de Actualización',
        'No hay producto o ID de producto para actualizar.',
        [],
        false,
        true
      );
      return;
    }

    const productDataToUpdate: productos = { ...this.producto };
    const currentProductId = this.producto.idProducto;

    if (productDataToUpdate.sku && productDataToUpdate.sku.trim() === '') {
      productDataToUpdate.sku = null;
    }
    if (productDataToUpdate.codigoBarras && productDataToUpdate.codigoBarras.trim() === '') {
      productDataToUpdate.codigoBarras = null;
    }
    if (!this.selectedFile && (productDataToUpdate.imagen === '' || productDataToUpdate.imagen === null || productDataToUpdate.imagen === undefined)) {
      productDataToUpdate.imagen = null;
    }

    // Eliminar imágenes secundarias marcadas
    const deleteImagesObservables: Observable<any>[] = this.imageIdsToDelete.map(id =>
      this.productoImagenService.deleteById(id).pipe(
        catchError((err: HttpErrorResponse) => {
          this.modalDetails.push(`Error al eliminar imagen con ID ${id}: ${err.message || 'Desconocido'}`);
          return of({ success: false, message: `Error al eliminar imagen ${id}.`, data: null, httpStatusCode: err.status });
        })
      )
    );

    // Eliminar propiedades marcadas
    const deletePropertiesObservables: Observable<any>[] = this.propertyIdsToDelete.map(id =>
      this.productoPropiedadService.deleteById(id).pipe(
        catchError((err: HttpErrorResponse) => {
          this.modalDetails.push(`Error al eliminar propiedad con ID ${id}: ${err.message || 'Desconocido'}`);
          return of({ success: false, message: `Error al eliminar propiedad ${id}.`, data: null, httpStatusCode: err.status });
        })
      )
    );

    // Actualizar producto
    const productUpdateObservable = this.productosService.update(
      productDataToUpdate,
      currentProductId,
      this.selectedFile || undefined
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        this.modalDetails.push(`Error al actualizar producto: ${err.message || 'Desconocido'}`);
        return of({ success: false, message: err.message || 'Error desconocido al actualizar producto.', data: null, httpStatusCode: err.status });
      })
    );

    // Actualizar o guardar stock
    const stockUpdateObservable: Observable<ApiResponse> = this.stock && this.stock.idStock ?
      this.stockService.updateStock({ ...this.stock }, this.stock.idStock).pipe(
        catchError((err: HttpErrorResponse) => {
          this.modalDetails.push(`Error al actualizar stock: ${err.message || 'Desconocido'}`);
          return of({ success: false, message: err.message || 'Error desconocido al actualizar stock.', data: null, httpStatusCode: err.status });
        })
      ) :
      this.stockService.saveStock({ ...this.stock!, producto: { idProducto: currentProductId } as productos }).pipe(
        catchError((err: HttpErrorResponse) => {
          this.modalDetails.push(`Error al guardar nuevo stock: ${err.message || 'Desconocido'}`);
          return of({ success: false, message: err.message || 'Error desconocido al guardar nuevo stock.', data: null, httpStatusCode: err.status });
        })
      );

    // Subir nuevas imágenes secundarias
    const secondaryImagesSave$: Observable<ApiResponse | any> = this.secondaryFiles.length > 0 ?
      this.productoImagenService.uploadAndSaveProductImages(currentProductId, this.secondaryFiles).pipe(
        catchError((err: HttpErrorResponse) => {
          this.modalDetails.push(`Error al guardar imágenes secundarias: ${err.message || 'Desconocido'}`);
          return of({ success: false, message: 'Error al guardar imágenes secundarias.', data: null, httpStatusCode: err.status });
        })
      ) :
      of({ success: true, message: 'No hay imágenes secundarias nuevas para subir.', data: null, httpStatusCode: 200 });

    // Guardar o actualizar propiedades
    const propertiesSaveObservables: Observable<any>[] = this.productProperties.map(prop => {
      const propToSave = { ...prop, id_producto: currentProductId };
      if (prop.idTipoPropiedad) {
        return this.productoPropiedadService.update(prop.idTipoPropiedad||0, propToSave).pipe(
          catchError((err: HttpErrorResponse) => {
            this.modalDetails.push(`Error al actualizar propiedad "${prop.nombre}": ${err.message || 'Desconocido'}`);
            return of({ success: false, message: `Error al actualizar propiedad ${prop.nombre}.`, data: null, httpStatusCode: err.status });
          })
        );
      } else {
        return this.productoPropiedadService.save(propToSave).pipe(
          catchError((err: HttpErrorResponse) => {
            this.modalDetails.push(`Error al guardar nueva propiedad "${prop.nombre}": ${err.message || 'Desconocido'}`);
            return of({ success: false, message: `Error al guardar nueva propiedad ${prop.nombre}.`, data: null, httpStatusCode: err.status });
          })
        );
      }
    });

    const propertiesSave$: Observable<ApiResponse | any | ApiResponse[]> = propertiesSaveObservables.length > 0 ?
      forkJoin(propertiesSaveObservables) :
      of({ success: true, message: 'No hay propiedades para guardar.', data: null, httpStatusCode: 200 });

    // Ejecutar eliminaciones y actualizaciones en secuencia
    forkJoin([
      // Ejecutar eliminaciones de imágenes y propiedades en paralelo
      deleteImagesObservables.length > 0 ? forkJoin(deleteImagesObservables) : of([]),
      deletePropertiesObservables.length > 0 ? forkJoin(deletePropertiesObservables) : of([]),
      productUpdateObservable,
      stockUpdateObservable,
      secondaryImagesSave$,
      propertiesSave$
    ]).pipe(
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: ([deleteImagesRes, deletePropertiesRes, productRes, stockRes, imagesRes, propsRes]) => {
        let allSuccess = true;

        // Manejo de eliminaciones de imágenes
        if (Array.isArray(deleteImagesRes)) {
          const failedDeletes = deleteImagesRes.filter(r => !r.success);
          if (failedDeletes.length > 0) {
            allSuccess = false;
            this.modalDetails.push(`Error al eliminar ${failedDeletes.length} imágenes secundarias.`);
          } else if (this.imageIdsToDelete.length > 0) {
            this.modalDetails.push(`Eliminadas ${this.imageIdsToDelete.length} imágenes secundarias exitosamente.`);
          }
        }

        // Manejo de eliminaciones de propiedades
        if (Array.isArray(deletePropertiesRes)) {
          const failedPropDeletes = deletePropertiesRes.filter(r => !r.success);
          if (failedPropDeletes.length > 0) {
            allSuccess = false;
            this.modalDetails.push(`Error al eliminar ${failedPropDeletes.length} propiedades.`);
          } else if (this.propertyIdsToDelete.length > 0) {
            this.modalDetails.push(`Eliminadas ${this.propertyIdsToDelete.length} propiedades exitosamente.`);
          }
        }

        // Manejo de producto
        if (productRes.success) {
          this.modalDetails.push(productRes.message || 'Producto actualizado exitosamente.');
          if (productRes.data && productRes.data.imagen) {
            this.imageUrl = productRes.data.imagen;
            this.selectedFile = null;
          } else if (!this.selectedFile && (productRes.data.imagen === null || productRes.data.imagen === undefined)) {
            this.imageUrl = null;
          }
        } else {
          allSuccess = false;
          this.modalDetails.push(productRes.message || 'Error al actualizar el producto.');
        }

        // Manejo de stock
        if (stockRes.success) {
          this.modalDetails.push(stockRes.message || 'Stock actualizado/guardado exitosamente.');
          this.stock = stockRes.data as stock;
        } else {
          allSuccess = false;
          this.modalDetails.push(stockRes.message || 'Error al actualizar/guardar el stock.');
        }

        // Manejo de imágenes secundarias
        if (imagesRes?.success || imagesRes?.message === 'No hay imágenes secundarias nuevas para subir.') {
          this.modalDetails.push(`Imágenes secundarias: ${imagesRes?.message || 'Guardadas exitosamente.'}`);
          // Limpiar secondaryFiles después de guardar
          this.secondaryFiles = [];
          // Actualizar secondaryImageUrls con las nuevas imágenes si el backend las devuelve
          if (imagesRes.data && Array.isArray(imagesRes.data)) {
            this.secondaryImageUrls = [
              ...this.secondaryImageUrls.filter(img => !img.isNew),
              ...imagesRes.data.map((img: ProductoImagen) => ({
                id: img.idImagen,
                url: img.urlImagen,
                isNew: false
              }))
            ];
          }
        } else {
          allSuccess = false;
          this.modalDetails.push(`Error al guardar imágenes secundarias: ${imagesRes?.message || 'Desconocido'}`);
        }

        // Manejo de propiedades
        if (Array.isArray(propsRes)) {
          const failedProps = propsRes.filter(r => !(r as ApiResponse)?.success);
          if (failedProps.length === 0) {
            this.modalDetails.push(`Propiedades: ${this.productProperties.length > 0 ? 'Guardadas exitosamente.' : 'No hay propiedades para guardar.'}`);
          } else {
            allSuccess = false;
            this.modalDetails.push(`Error al guardar ${failedProps.length} propiedades.`);
          }
        } else if ((propsRes as ApiResponse)?.success || (propsRes as any)?.message === 'No hay propiedades para guardar.') {
          this.modalDetails.push(`Propiedades: ${(propsRes as any)?.message || 'Guardadas exitosamente.'}`);
        } else {
          allSuccess = false;
          this.modalDetails.push(`Error al guardar propiedades: ${(propsRes as any)?.message || 'Desconocido'}`);
        }

        // Limpiar listas de eliminación después de procesar
        this.imageIdsToDelete = [];
        this.propertyIdsToDelete = [];

        this.showResponseModal(
          allSuccess ? 'Actualización Exitosa' : 'Error de Actualización',
          allSuccess ? '¡El producto y sus datos asociados han sido actualizados con éxito!' : 'Ocurrieron errores durante la actualización.',
          this.modalDetails,
          allSuccess,
          true
        );
      },
      error: (err: HttpErrorResponse) => {
        this.modalDetails.push(`Error general: ${err.message || 'Desconocido'}`);
        this.showResponseModal(
          'Error General de Actualización',
          'Ocurrió un error inesperado durante el proceso de actualización.',
          this.modalDetails,
          false,
          true
        );
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/home/listarProductos']);
  }
}
