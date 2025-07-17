// Si tu ProductoEnCarrito usa Decimal, asegúrate de importarlo aquí también
// import Decimal from 'decimal.js'; // Solo si precioUnitario es de tipo Decimal

export interface AgregarDetalleCarritoRequest {
  producto: {
    idProducto: number;
  };
  cantidad: number;
  precioUnitario: number;

}