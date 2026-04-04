import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() { }

  /**
   * Genera un PDF profesional para el módulo de Ganancias
   */
  exportarReporteGanancias(
    datosTabla: any[], 
    estadisticas: any, 
    filtros: any, 
    nombreReporteTexto: string
  ) {
    // 1. Crear documento en formato Horizontal, tamaño A4
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    
    // 2. ENCABEZADO (Fondo púrpura como tu diseño)
    doc.setFillColor(103, 58, 183); 
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Reporte de Ganancias', 14, 20);

    // 3. FILTROS Y FECHAS
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaImpresion = new Date().toLocaleDateString('es-ES');
    
    doc.text(`Tipo: ${nombreReporteTexto}`, 14, 40);
    doc.text(`Período: ${filtros.fechaInicio} al ${filtros.fechaFin}`, 14, 46);
    doc.text(`Impreso el: ${fechaImpresion}`, pageWidth - 14, 40, { align: 'right' });

    // 4. ESTADÍSTICAS (Resumen estilo "Cards")
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 52, pageWidth - 28, 20, 'F'); 
    
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    doc.text(`Ganancia Total:`, 20, 60);
    doc.text(`Transacciones:`, 85, 60);
    doc.text(`Ticket Promedio:`, 150, 60);
    doc.text(`Margen Promedio:`, 220, 60);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(25, 135, 84); // Verde para ganancias
    doc.text(`Bs. ${estadisticas.totalGanancia.toFixed(2)}`, 20, 67);
    
    doc.setTextColor(40, 40, 40);
    doc.text(`${estadisticas.totalTransacciones}`, 85, 67);
    doc.text(`Bs. ${estadisticas.ticketPromedio.toFixed(2)}`, 150, 67);
    doc.text(`${estadisticas.margenPromedio.toFixed(2)}%`, 220, 67);

    // 5. CONFIGURACIÓN DE TABLA DINÁMICA
    let columnas: string[] = [];
    let filas: any[][] = [];
    let indiceColumnaGanancia = -1;

    // Detectar qué reporte estamos viendo
    if (filtros.tipoReporte === 'combinado') {
      columnas = ['Tipo', 'Fecha', 'Transacción', 'Cliente', 'Estado', 'Total', 'Ganancia', 'Margen'];
      indiceColumnaGanancia = 6; 
      filas = datosTabla.map(item => [
        item.tipoVenta, item.fecha, `#${item.idTransaccion}`, item.clienteCompleto, 
        item.estado, `Bs. ${item.totalTransaccion.toFixed(2)}`, 
        `Bs. ${item.gananciaNeta.toFixed(2)}`, `${item.margenGananciaPercent}%`
      ]);
    } else if (filtros.tipoReporte === 'pedidos') {
      columnas = ['Fecha', 'Pedido', 'Cliente', 'Estado', 'Total', 'Costo', 'Ganancia', 'Margen'];
      indiceColumnaGanancia = 6;
      filas = datosTabla.map(item => [
        item.fechaPedido, `#${item.idPedido}`, item.clienteCompleto, item.estadoPedido,
        `Bs. ${item.totalPedido.toFixed(2)}`, `Bs. ${item.totalCosto.toFixed(2)}`, 
        `Bs. ${item.gananciaNeta.toFixed(2)}`, `${item.margenGananciaPercent}%`
      ]);
    } else if (filtros.tipoReporte === 'ventas') {
      columnas = ['Fecha', 'Venta', 'Cliente', 'Vendedor', 'Total', 'Ganancia', 'Margen'];
      indiceColumnaGanancia = 5;
      filas = datosTabla.map(item => [
        item.fechaVenta, `#${item.idVenta}`, item.clienteCompleto, item.trabajadorCompleto,
        `Bs. ${item.totalVenta.toFixed(2)}`, `Bs. ${item.gananciaNeta.toFixed(2)}`, `${item.margenGananciaPercent}%`
      ]);
    } else if (filtros.tipoReporte === 'resumen') {
      columnas = ['Fecha', 'Tipo', 'Transacciones', 'Ingresos', 'Costos', 'Ganancia Neta', 'Margen', 'Ticket Prom.'];
      indiceColumnaGanancia = 5;
      filas = datosTabla.map(item => [
        item.fecha, item.tipoVenta, item.totalTransacciones, 
        `Bs. ${item.ingresosTotales.toFixed(2)}`, `Bs. ${item.costosTotales.toFixed(2)}`, 
        `Bs. ${item.gananciaNetaTotal.toFixed(2)}`, `${item.margenPromedio}%`, `Bs. ${item.ticketPromedio.toFixed(2)}`
      ]);
    }

    // 6. DIBUJAR LA TABLA
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 80,
      theme: 'striped',
      headStyles: { fillColor: [33, 37, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      didParseCell: function (data) {
        // Pintar la columna de ganancia de color verde
        if (data.section === 'body' && data.column.index === indiceColumnaGanancia) {
          data.cell.styles.textColor = [25, 135, 84]; 
          data.cell.styles.fontStyle = 'bold';
        }
      },
     // 7. PIE DE PÁGINA
      didDrawPage: function (data) {
        // En lugar de usar doc.internal..., usamos la propiedad pageNumber que nos da autoTable en la variable 'data'
        const str = `Página ${data.pageNumber}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setTextColor(150);
        // Escribimos el texto centrado en la parte inferior
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // 8. DESCARGAR
    doc.save(`Reporte_${filtros.tipoReporte}_${filtros.fechaInicio}.pdf`);
  }













/**
   * Genera un PDF profesional con diseño anidado y tarjetas de colores para Ventas
   */
  exportarReporteVentas(
    ventasAgrupadas: any[], 
    totales: { ingresos: number, completadas: number, productos: number }, 
    filtros: any
  ) {
    const doc = new jsPDF('p', 'mm', 'a4'); 
    const pageWidth = doc.internal.pageSize.width;
    
    // ==========================================
    // 1. ENCABEZADO PRINCIPAL
    // ==========================================
    doc.setFillColor(102, 126, 234); // Azul índigo elegante
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Reporte Analítico de Ventas', 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaImpresion = new Date().toLocaleDateString('es-ES');
    doc.text(`Período: ${filtros.fechaInicio} al ${filtros.fechaFin}   |   Estado: ${filtros.estado || 'Todos'}`, 14, 29);
    doc.text(`Impreso: ${fechaImpresion}`, pageWidth - 14, 29, { align: 'right' });

    // ==========================================
    // 2. TARJETAS DE ESTADÍSTICAS (Estilo UI)
    // ==========================================
    const cardY = 45;
    const cardHeight = 22;
    const cardWidth = (pageWidth - 28 - 15) / 4; // 4 tarjetas con 5mm de espacio entre ellas

    // Tarjeta 1: Total Ventas (Azul)
    doc.setFillColor(102, 126, 234); doc.rect(14, cardY, cardWidth, cardHeight, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${ventasAgrupadas.length}`, 14 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('TICKETS EMITIDOS', 14 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 2: Ingresos Totales (Verde)
    doc.setFillColor(78, 205, 196); doc.rect(14 + cardWidth + 5, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`Bs. ${totales.ingresos.toFixed(2)}`, 14 + cardWidth + 5 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('INGRESOS TOTALES', 14 + cardWidth + 5 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 3: Completadas (Celeste)
    doc.setFillColor(0, 180, 219); doc.rect(14 + (cardWidth*2) + 10, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${totales.completadas}`, 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('COMPLETADAS', 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 4: Artículos (Naranja)
    doc.setFillColor(244, 107, 69); doc.rect(14 + (cardWidth*3) + 15, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${totales.productos}`, 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('ARTÍCULOS VENDIDOS', 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 17, { align: 'center' });

    // ==========================================
    // 3. CONFIGURACIÓN DE TABLA ANIDADA (BLOQUES)
    // ==========================================
    const columnas = ['Descripción del Producto', 'Cant.', 'P. Unitario', 'Subtotal'];
    let filas: any[][] = [];

    ventasAgrupadas.forEach(venta => {
      // 3.1 CABECERA DE LA VENTA (Fondo gris azulado)
      filas.push([
        { 
          content: `TICKET #${venta.idVenta}   |   Fecha: ${venta.fechaVenta} ${venta.horaVenta.substring(0,5)}\nCliente: ${venta.cliente}   |   Vendedor: ${venta.empleado}   |   Estado: ${venta.estado}`, 
          colSpan: 4, 
          styles: { fillColor: [237, 242, 247], textColor: [45, 55, 72], fontStyle: 'bold', cellPadding: 4 } 
        }
      ]);

      // 3.2 DETALLES DE PRODUCTOS (Fondo blanco)
      venta.detalles.forEach((detalle: any) => {
        filas.push([
          { content: `   • ${detalle.producto}`, styles: { textColor: [80, 80, 80] } }, // Viñeta
          { content: detalle.cantidad.toString(), styles: { halign: 'center', textColor: [80, 80, 80] } },
          { content: `Bs. ${detalle.precioUnitario.toFixed(2)}`, styles: { halign: 'right', textColor: [80, 80, 80] } },
          { content: `Bs. ${detalle.subtotal.toFixed(2)}`, styles: { halign: 'right', textColor: [80, 80, 80] } }
        ]);
      });

      // 3.3 FILA DE TOTALES (Fondo verde tenue para destacar)
      let textoDescuento = venta.descuento > 0 ? `Descuento aplicado: -Bs. ${venta.descuento.toFixed(2)}` : '';
      let textoTotal = `TOTAL VENTA: Bs. ${venta.totalNeto.toFixed(2)}`;

      filas.push([
        { content: textoDescuento, colSpan: 2, styles: { halign: 'right', textColor: [220, 53, 69], fontStyle: 'italic' } },
        { content: textoTotal, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [25, 135, 84] } }
      ]);

      // 3.4 FILA ESPACIADORA (Para separar visualmente las ventas)
      filas.push([
        { content: '', colSpan: 4, styles: { fillColor: [255, 255, 255], minCellHeight: 6, cellPadding: 0, lineWidth: 0 } }
      ]);
    });

    // ==========================================
    // 4. DIBUJAR LA TABLA
    // ==========================================
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 75, 
      theme: 'plain', 
      
      // 👇 ESTA ES LA LÍNEA MÁGICA QUE ARREGLA EL PROBLEMA 👇
      showHead: 'firstPage', 
      
      headStyles: { 
        fillColor: [33, 37, 41], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 4
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        lineColor: [230, 230, 230], 
        lineWidth: 0.1 
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' }, 
        2: { cellWidth: 35, halign: 'right' },  
        3: { cellWidth: 35, halign: 'right' }
      },
      // PIE DE PÁGINA
      didDrawPage: function (data) {
        const str = `Página ${data.pageNumber}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // ==========================================
    // 5. DESCARGAR
    // ==========================================
    doc.save(`Reporte_Ventas_Detallado_${filtros.fechaInicio}.pdf`);
  }






  /**
   * Genera un PDF profesional con diseño anidado y tarjetas de colores para Pedidos Online
   */
  exportarReportePedidos(
    pedidosAgrupados: any[], 
    totales: { ingresos: number, completados: number, promedio: number }, 
    filtros: any
  ) {
    const doc = new jsPDF('p', 'mm', 'a4'); // 'p' para Portrait (Vertical)
    const pageWidth = doc.internal.pageSize.width;
    
    // ==========================================
    // 1. ENCABEZADO PRINCIPAL
    // ==========================================
    doc.setFillColor(102, 126, 234); // Azul índigo elegante
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Reporte Analítico de Pedidos', 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaImpresion = new Date().toLocaleDateString('es-ES');
    doc.text(`Período: ${filtros.fechaInicio} al ${filtros.fechaFin}   |   Estado: ${filtros.estado || 'Todos'}`, 14, 29);
    doc.text(`Impreso: ${fechaImpresion}`, pageWidth - 14, 29, { align: 'right' });

    // ==========================================
    // 2. TARJETAS DE ESTADÍSTICAS (Estilo UI)
    // ==========================================
    const cardY = 45;
    const cardHeight = 22;
    const cardWidth = (pageWidth - 28 - 15) / 4; // 4 tarjetas con 5mm de espacio entre ellas

    // Tarjeta 1: Total Pedidos (Azul)
    doc.setFillColor(102, 126, 234); doc.rect(14, cardY, cardWidth, cardHeight, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${pedidosAgrupados.length}`, 14 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('TOTAL PEDIDOS', 14 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 2: Valor Total (Verde)
    doc.setFillColor(78, 205, 196); doc.rect(14 + cardWidth + 5, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`Bs. ${totales.ingresos.toFixed(2)}`, 14 + cardWidth + 5 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('VALOR TOTAL', 14 + cardWidth + 5 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 3: Ticket Promedio (Celeste)
    doc.setFillColor(0, 180, 219); doc.rect(14 + (cardWidth*2) + 10, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`Bs. ${totales.promedio.toFixed(2)}`, 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('TICKET PROMEDIO', 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 4: Completados (Naranja)
    doc.setFillColor(244, 107, 69); doc.rect(14 + (cardWidth*3) + 15, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${totales.completados}`, 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('COMPLETADOS', 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 17, { align: 'center' });

    // ==========================================
    // 3. CONFIGURACIÓN DE TABLA ANIDADA (BLOQUES)
    // ==========================================
    const columnas = ['Descripción del Producto', 'Cant.', 'P. Unitario', 'Subtotal'];
    let filas: any[][] = [];

    pedidosAgrupados.forEach(pedido => {
      // 3.1 CABECERA DEL PEDIDO (Fondo gris azulado)
      filas.push([
        { 
          content: `PEDIDO #${pedido.idPedido}   |   Fecha: ${pedido.fechaPedido} ${pedido.horaPedido}\nCliente: ${pedido.cliente}   |   Estado: ${pedido.estado}`, 
          colSpan: 4, 
          styles: { fillColor: [237, 242, 247], textColor: [45, 55, 72], fontStyle: 'bold', cellPadding: 4 } 
        }
      ]);

      // 3.2 DETALLES DE PRODUCTOS (Fondo blanco)
      pedido.detalles.forEach((detalle: any) => {
        filas.push([
          { content: `   • ${detalle.producto}`, styles: { textColor: [80, 80, 80] } }, // Viñeta
          { content: detalle.cantidad.toString(), styles: { halign: 'center', textColor: [80, 80, 80] } },
          { content: `Bs. ${detalle.precioUnitario.toFixed(2)}`, styles: { halign: 'right', textColor: [80, 80, 80] } },
          { content: `Bs. ${detalle.subtotal.toFixed(2)}`, styles: { halign: 'right', textColor: [80, 80, 80] } }
        ]);
      });

      // 3.3 FILA DE TOTALES (Fondo verde tenue para destacar)
      let textoTotal = `TOTAL PEDIDO: Bs. ${pedido.totalNeto.toFixed(2)}`;

      filas.push([
        { content: '', colSpan: 2, styles: { fillColor: [255, 255, 255] } }, // Espacios vacíos
        { content: textoTotal, colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 244, 234], textColor: [25, 135, 84] } }
      ]);

      // 3.4 FILA ESPACIADORA (Para separar visualmente los pedidos)
      filas.push([
        { content: '', colSpan: 4, styles: { fillColor: [255, 255, 255], minCellHeight: 6, cellPadding: 0, lineWidth: 0 } }
      ]);
    });

    // ==========================================
    // 4. DIBUJAR LA TABLA
    // ==========================================
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 75, // Empezar debajo de las tarjetas
      theme: 'plain', // Usamos plain porque nosotros controlamos los colores de cada fila
      showHead: 'firstPage', // ¡IMPORTANTE! Solo muestra el encabezado negro en la 1ra hoja
      headStyles: { 
        fillColor: [33, 37, 41], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 4
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        lineColor: [230, 230, 230], 
        lineWidth: 0.1 // Bordes muy finos y elegantes
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 15, halign: 'center' }, 
        2: { cellWidth: 35, halign: 'right' },  
        3: { cellWidth: 35, halign: 'right' }
      },
      // PIE DE PÁGINA
      didDrawPage: function (data) {
        const str = `Página ${data.pageNumber}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // ==========================================
    // 5. DESCARGAR
    // ==========================================
    doc.save(`Reporte_Pedidos_${filtros.fechaInicio}.pdf`);
  }








  /**
   * Genera un PDF profesional para las distintas pestañas del módulo de Productos
   */
  exportarReporteProductos(
    datosTabla: any[], 
    tipoReporte: string, // 'bajo_stock', 'mas_vendidos', 'menos_vendidos', 'quietos', 'maestro'
    estadisticas: any, 
    filtros: any
  ) {
    // 1. Crear documento Horizontal para que quepan las columnas largas
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    
    // ==========================================
    // 1. ENCABEZADO PRINCIPAL
    // ==========================================
    doc.setFillColor(52, 58, 64); // Gris muy oscuro/Negro elegante
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    
    // Título dinámico
    let tituloReporte = 'Reporte de Productos';
    if (tipoReporte === 'bajo_stock') tituloReporte = 'Reporte: Productos con Bajo Stock';
    if (tipoReporte === 'mas_vendidos') tituloReporte = 'Reporte: Productos Más Vendidos';
    if (tipoReporte === 'menos_vendidos') tituloReporte = 'Reporte: Productos Menos Vendidos';
    if (tipoReporte === 'quietos') tituloReporte = 'Reporte: Inventario Inmovilizado';
    if (tipoReporte === 'maestro') tituloReporte = 'Maestro General de Productos';
    
    doc.text(tituloReporte, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaImpresion = new Date().toLocaleDateString('es-ES');
    
    // Filtros dinámicos en el encabezado
    let textoFiltro = '';
    if (tipoReporte === 'bajo_stock') textoFiltro = `Stock Máximo <= ${filtros.umbralStock || 10}`;
    else if (tipoReporte === 'quietos') textoFiltro = `Sin ventas desde: ${filtros.fechaLimite}`;
    else if (tipoReporte === 'maestro') textoFiltro = `Estado: ${filtros.estadoProducto === '1' ? 'Activo' : filtros.estadoProducto === '0' ? 'Inactivo' : 'Todos'}`;
    else textoFiltro = `Período: ${filtros.fechaInicio} al ${filtros.fechaFin}`;

    doc.text(textoFiltro, 14, 29);
    doc.text(`Impreso: ${fechaImpresion}`, pageWidth - 14, 29, { align: 'right' });

    // ==========================================
    // 2. TARJETAS DE ESTADÍSTICAS DINÁMICAS
    // ==========================================
    const cardY = 45;
    const cardHeight = 22;
    const cardWidth = (pageWidth - 28 - 15) / 4; 
    
    // Funciones helper para dibujar cajas
    const drawCard = (x: number, title: string, value: string, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2]); 
      doc.rect(x, cardY, cardWidth, cardHeight, 'F');
      doc.setTextColor(255, 255, 255); 
      doc.setFont("helvetica", "bold"); 
      doc.setFontSize(14);
      doc.text(value, x + (cardWidth/2), cardY + 10, { align: 'center' });
      doc.setFontSize(8); 
      doc.setFont("helvetica", "normal");
      doc.text(title, x + (cardWidth/2), cardY + 17, { align: 'center' });
    };

    // Dibujar estadísticas según el tipo
    const colorC1 = [102, 126, 234]; // Azul
    const colorC2 = [78, 205, 196]; // Verde
    const colorC3 = [0, 180, 219];  // Celeste
    const colorC4 = [244, 107, 69]; // Naranja
    const colorDanger = [220, 53, 69]; // Rojo

    if (tipoReporte === 'bajo_stock') {
      drawCard(14, 'PRODUCTOS', `${datosTabla.length}`, colorC1);
      drawCard(14 + cardWidth + 5, 'STOCK CRÍTICO (<=5)', `${estadisticas.criticos}`, colorDanger);
      drawCard(14 + (cardWidth*2) + 10, 'PROVEEDORES INVOLUCRADOS', `${estadisticas.proveedores}`, colorC3);
    } 
    else if (tipoReporte === 'mas_vendidos' || tipoReporte === 'menos_vendidos') {
      drawCard(14, 'PRODUCTOS LISTADOS', `${datosTabla.length}`, colorC1);
      drawCard(14 + cardWidth + 5, 'UNIDADES VENDIDAS', `${estadisticas.unidades}`, colorC2);
      drawCard(14 + (cardWidth*2) + 10, 'INGRESOS GENERADOS', `Bs. ${estadisticas.ingresos.toFixed(2)}`, colorC3);
    } 
    else if (tipoReporte === 'maestro') {
      drawCard(14, 'TOTAL INVENTARIO', `${datosTabla.length}`, colorC1);
      drawCard(14 + cardWidth + 5, 'PRODUCTOS ACTIVOS', `${estadisticas.activos}`, colorC2);
      drawCard(14 + (cardWidth*2) + 10, 'USUARIOS REGISTRO', `${estadisticas.usuarios}`, colorC3);
    }
    // Si es "quietos" no dibujamos cards o puedes agregar una genérica.

    // ==========================================
    // 3. CONFIGURACIÓN DE TABLA PLANA
    // ==========================================
    let columnas: string[] = [];
    let filas: any[][] = [];

    if (tipoReporte === 'bajo_stock') {
      columnas = ['SKU', 'Producto', 'Categoría', 'Stock Actual', 'Proveedor', 'Contacto'];
      filas = datosTabla.map(p => [ p.sku, p.nombre, p.categoria, p.stockActual, p.proveedor, p.telefonoProveedor ]);
    } 
    else if (tipoReporte === 'mas_vendidos' || tipoReporte === 'menos_vendidos') {
      columnas = ['SKU', 'Producto', 'Categoría', 'Stock Actual', 'U. Vendidas', 'Ingresos'];
      filas = datosTabla.map(p => [ p.sku, p.nombre, p.categoria, p.stockActual, p.unidadesVendidas, `Bs. ${p.ingresosTotales.toFixed(2)}` ]);
    } 
    else if (tipoReporte === 'quietos') {
      columnas = ['SKU', 'Producto', 'Stock Actual', 'P. Compra', 'Capital Estancado'];
      filas = datosTabla.map(p => [ p.sku, p.nombre, p.stockActual, `Bs. ${p.precioCompra.toFixed(2)}`, `Bs. ${p.capitalEstancado.toFixed(2)}` ]);
    } 
    else if (tipoReporte === 'maestro') {
      columnas = ['SKU', 'Producto', 'Estado', 'P. Compra', 'P. Venta', 'Registrado Por'];
      filas = datosTabla.map(p => [ p.sku, p.nombre, (p.estado === 1 ? 'Activo' : 'Inactivo'), `Bs. ${p.precioCompra.toFixed(2)}`, `Bs. ${p.precio.toFixed(2)}`, p.registradoPor ]);
    }

    // ==========================================
    // 4. DIBUJAR LA TABLA
    // ==========================================
    const startYValue = (tipoReporte === 'quietos') ? 45 : 75; // Si no hay cards, subimos la tabla

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: startYValue, 
      theme: 'striped',
      showHead: 'everyPage', // Aquí SÍ queremos encabezados en cada página
      headStyles: { 
        fillColor: [33, 37, 41], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 4
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        lineColor: [230, 230, 230], 
        lineWidth: 0.1 
      },
      didParseCell: function (data) {
        // Pintar celdas de rojo si el stock es muy bajo (en reporte bajo stock)
        if (tipoReporte === 'bajo_stock' && data.section === 'body' && data.column.index === 3) {
          const stock = Number(data.cell.raw);
          if (stock <= 5) {
            data.cell.styles.textColor = [220, 53, 69]; // Rojo
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      didDrawPage: function (data) {
        const str = `Página ${data.pageNumber}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // ==========================================
    // 5. DESCARGAR
    // ==========================================
    doc.save(`Reporte_Productos_${tipoReporte}_${fechaImpresion.replace(/\//g, '-')}.pdf`);
  }



  /**
   * Genera un PDF profesional para el módulo de Envíos (Tabla plana + Tarjetas)
   */
  exportarReporteEnvios(
    datosTabla: any[], 
    estadisticas: { totalEnvios: number, costoTotal: number, entregados: number, pendientes: number }, 
    filtros: any
  ) {
    // 1. Crear documento Horizontal para que quepan las columnas
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    
    // ==========================================
    // 1. ENCABEZADO PRINCIPAL
    // ==========================================
    doc.setFillColor(78, 205, 196); // Verde azulado (teal)
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('Reporte Analítico de Envíos', 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaImpresion = new Date().toLocaleDateString('es-ES');
    
    // Texto de filtros
    const tipoOrigenTxt = filtros.tipoOrigen ? filtros.tipoOrigen : 'Todos';
    const estadoTxt = filtros.estadoEnvio ? filtros.estadoEnvio : 'Todos';
    doc.text(`Período: ${filtros.fechaInicio} al ${filtros.fechaFin}   |   Origen: ${tipoOrigenTxt}   |   Estado: ${estadoTxt}`, 14, 29);
    doc.text(`Impreso: ${fechaImpresion}`, pageWidth - 14, 29, { align: 'right' });

    // ==========================================
    // 2. TARJETAS DE ESTADÍSTICAS (Estilo UI)
    // ==========================================
    const cardY = 45;
    const cardHeight = 22;
    const cardWidth = (pageWidth - 28 - 15) / 4; // 4 tarjetas
    
    // Tarjeta 1: Total Envíos (Azul)
    doc.setFillColor(102, 126, 234); doc.rect(14, cardY, cardWidth, cardHeight, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${estadisticas.totalEnvios}`, 14 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('TOTAL ENVÍOS', 14 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 2: Costo Total (Verde)
    doc.setFillColor(78, 205, 196); doc.rect(14 + cardWidth + 5, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`Bs. ${estadisticas.costoTotal.toFixed(2)}`, 14 + cardWidth + 5 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('COSTO TOTAL', 14 + cardWidth + 5 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 3: Entregados (Celeste)
    doc.setFillColor(0, 180, 219); doc.rect(14 + (cardWidth*2) + 10, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${estadisticas.entregados}`, 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('ENTREGADOS', 14 + (cardWidth*2) + 10 + (cardWidth/2), cardY + 17, { align: 'center' });

    // Tarjeta 4: En proceso/Pendientes (Naranja)
    doc.setFillColor(244, 107, 69); doc.rect(14 + (cardWidth*3) + 15, cardY, cardWidth, cardHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(`${estadisticas.pendientes}`, 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 10, { align: 'center' });
    doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text('EN PROCESO / PENDIENTES', 14 + (cardWidth*3) + 15 + (cardWidth/2), cardY + 17, { align: 'center' });

    // ==========================================
    // 3. CONFIGURACIÓN DE TABLA PLANA
    // ==========================================
    const columnas = ['ID Envío', 'Cliente', 'Origen', 'Estado', 'Empresa / Método', 'Fecha Envío', 'Cód. Seguimiento', 'Costo'];
    
    // Mapear los datos de la tabla
    const filas = datosTabla.map(envio => [
      `#${envio.idEnvio}`,
      envio.cliente,
      `${envio.tipoOrigen} #${envio.idOrigen}`,
      envio.estado,
      `${envio.empresaEnvio}\n${envio.metodoEnvio}`, // Salto de línea para la empresa y el método
      envio.fechaEnvio || envio.fechaCreacion,
      envio.codigoSeguimiento || 'N/A',
      `Bs. ${envio.costoEnvio.toFixed(2)}`
    ]);

    // ==========================================
    // 4. DIBUJAR LA TABLA
    // ==========================================
    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 75, // Empezar debajo de las tarjetas
      theme: 'striped',
      showHead: 'everyPage', 
      headStyles: { 
        fillColor: [33, 37, 41], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        cellPadding: 4
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3, 
        lineColor: [230, 230, 230], 
        lineWidth: 0.1 
      },
      columnStyles: {
        7: { halign: 'right', textColor: [25, 135, 84], fontStyle: 'bold' } // Columna de costo en verde y derecha
      },
      didDrawPage: function (data) {
        const str = `Página ${data.pageNumber}`;
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    // ==========================================
    // 5. DESCARGAR
    // ==========================================
    doc.save(`Reporte_Envios_${filtros.fechaInicio}_al_${filtros.fechaFin}.pdf`);
  }
  
}