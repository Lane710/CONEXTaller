// reportes-ganancias.model.ts

/**
 * Corresponde a ReporteGananciaPedidosDTO en el backend.
 * Usado para el endpoint: /api/reportes/ganancias/pedidos
 */
export interface ReporteGananciaPedidos {
  fechaPedido: string;               // LocalDate
  fechaHoraCompleta: string;         // LocalDateTime
  idPedido: number;                  // Long
  clienteCompleto: string;
  clienteNombre: string;
  clienteApellidoPaterno: string;
  clienteApellidoMaterno: string;
  clienteEmail: string;
  clienteTelefono: string;
  estadoPedido: string;
  formaPago: string;
  totalPedido: number;               // BigDecimal
  observacionesPedido: string;
  totalVenta: number;                // BigDecimal
  totalCosto: number;                // BigDecimal
  gananciaBruta: number;             // BigDecimal
  gananciaNeta: number;              // BigDecimal
  margenGananciaPercent: number;     // BigDecimal
  cantidadProductosDiferentes: number; // Long
  totalUnidadesVendidas: number;     // Long
  estadoEnvio: string;
  costoEnvio: number;                // BigDecimal
  empresaEnvio: string;
  codigoSeguimiento: string;
}

/**
 * Corresponde a ReporteGananciaVentasDTO en el backend.
 * Usado para el endpoint: /api/reportes/ganancias/ventas
 */
export interface ReporteGananciaVentas {
  fechaVenta: string;                // LocalDate
  horaVenta: string;                 // LocalTime
  idVenta: number;                   // Long
  clienteCompleto: string;
  clienteNombre: string;
  clienteApellidoPaterno: string;
  clienteApellidoMaterno: string;
  clienteEmail: string;
  clienteTelefono: string;
  clienteDireccion: string;
  trabajadorUsername: string;
  trabajadorCompleto: string;
  estadoVenta: string;
  formaPago: string;
  totalVenta: number;                // BigDecimal
  descuentoAplicado: number;         // BigDecimal
  observacionesVenta: string;
  totalVentaSinDescuento: number;    // BigDecimal
  totalCosto: number;                // BigDecimal
  gananciaBruta: number;             // BigDecimal
  gananciaNeta: number;              // BigDecimal
  margenGananciaPercent: number;     // BigDecimal
  cantidadProductosDiferentes: number; // Long
  totalUnidadesVendidas: number;     // Long
  estadoEnvio: string;
  costoEnvio: number;                // BigDecimal
  empresaEnvio: string;
  codigoSeguimiento: string;
}

/**
 * Corresponde a ReporteGananciaCombinadaDTO en el backend.
 * Usado para el endpoint: /api/reportes/ganancias/combinado
 */
export interface ReporteGananciaCombinada {
  tipoVenta: string;
  idTransaccion: number;             // Long
  fecha: string;                     // LocalDate
  fechaHoraCompleta: string;         // LocalDateTime
  clienteCompleto: string;
  clienteNombre: string;
  clienteApellidoPaterno: string;
  clienteApellidoMaterno: string;
  clienteEmail: string;
  clienteTelefono: string;
  trabajadorUsername: string;
  trabajadorCompleto: string;
  estado: string;
  formaPago: string;
  totalTransaccion: number;          // BigDecimal
  descuentoAplicado: number;         // BigDecimal
  observaciones: string;
  totalVenta: number;                // BigDecimal
  totalCosto: number;                // BigDecimal
  gananciaBruta: number;             // BigDecimal
  gananciaNeta: number;              // BigDecimal
  margenGananciaPercent: number;     // BigDecimal
  cantidadProductosDiferentes: number; // Long
  totalUnidadesVendidas: number;     // Long
  estadoEnvio: string;
  costoEnvio: number;                // BigDecimal
  empresaEnvio: string;
  codigoSeguimiento: string;
  categoria: string;
}

/**
 * Corresponde a ResumenGananciasDTO en el backend.
 * Usado para el endpoint: /api/reportes/ganancias/resumen
 */
export interface ResumenGanancias {
  fecha: string;                     // LocalDate
  tipoVenta: string;
  totalTransacciones: number;        // Long
  ingresosTotales: number;           // BigDecimal
  costosTotales: number;             // BigDecimal
  gananciaNetaTotal: number;         // BigDecimal
  margenPromedio: number;            // BigDecimal
  totalUnidadesVendidas: number;     // Long
  totalProductosDiferentes: number;  // Long
  gananciaPromedioPorTransaccion: number; // BigDecimal
  ticketPromedio: number;            // BigDecimal
}