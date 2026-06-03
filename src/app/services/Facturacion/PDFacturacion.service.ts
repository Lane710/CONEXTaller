// src/app/services/pdfactura.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PDFacturaService {

  constructor() { }

  /**
   * Método público 1: Genera y DESCARGA el PDF
   */
  async generarFacturaPDF(pedidoData: any, datosSiat: any): Promise<void> {
    const doc = await this.prepararDocumentoPDF(pedidoData, datosSiat);
    doc.save(`Factura_CONEX_${datosSiat.numeroFacturaSiat}.pdf`);
  }

  /**
   * Método público 2: Genera y DEVUELVE el PDF en formato Blob
   */
  async obtenerPdfBlob(pedidoData: any, datosSiat: any): Promise<Blob> {
    const doc = await this.prepararDocumentoPDF(pedidoData, datosSiat);
    return doc.output('blob');
  }

  /**
   * Método PRIVADO central: Dibuja toda la factura.
   */
  private async prepararDocumentoPDF(pedidoData: any, datosSiat: any): Promise<jsPDF> {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. ENCABEZADO: DATOS DE LA EMPRESA (Izquierda) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text('CONEX REPRESENTACIONES', 14, 20);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('Casa Matriz', 14, 25);
    doc.text('Calle Campero #740 entre Bolívar e Ingavi', 14, 29);
    doc.text('Tarija, Bolivia', 14, 33);
    doc.text('Correo: conexs.representaciones@gmail.com', 14, 37);
    doc.text('Teléfono: 75135309', 14, 41);

    // --- 2. ENCABEZADO: BLOQUE SIAT (Derecha) ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - 95, 14, 81, 30); // Cuadro contenedor un poco más alto

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('NIT:', pageWidth - 90, 20);
    doc.text('FACTURA N°:', pageWidth - 90, 25);
    doc.text('CÓD. AUTORIZACIÓN:', pageWidth - 90, 30);

    doc.setFont("helvetica", "normal");
    // Usamos el NIT que proporcionaste como predeterminado
    doc.text(datosSiat.nitEmpresa || '702163037', pageWidth - 18, 20, { align: 'right' }); 
    doc.text(`${datosSiat.numeroFacturaSiat}`, pageWidth - 18, 25, { align: 'right' });
    
    doc.setFontSize(7);
    // Margen ajustado para el CUF para que no choque con el título
    const cufFormat = doc.splitTextToSize(datosSiat.cuf, 75);
    doc.text(cufFormat, pageWidth - 90, 34);

    // --- 3. TÍTULO DEL DOCUMENTO ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('FACTURA ELECTRÓNICA EN LÍNEA', pageWidth / 2, 54, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text('(Con Derecho a Crédito Fiscal)', pageWidth / 2, 59, { align: 'center' });

    // Actividad Económica Realista
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const actividadEcon = "VENTA AL POR MENOR DE COMPUTADORAS, EQUIPOS PERIFÉRICOS, PROGRAMAS INFORMÁTICOS Y ACCESORIOS";
    doc.text(`Actividad Económica: ${actividadEcon}`, pageWidth / 2, 64, { align: 'center' });

    // --- 4. DATOS DEL CLIENTE ---
    const fechaActual = new Date().toLocaleString('es-BO'); 
    const cliente = pedidoData.pedido?.usuario?.persona;
    const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellidop}` : (pedidoData.pedido?.usuario?.username || 'S/N');
    const nitCliente = cliente?.ci ? cliente.ci : '99002'; // 99002 es Control Tributario

    doc.setFont("helvetica", "bold");
    doc.text('Fecha y Hora:', 14, 75);
    doc.text('Señor(es):', 14, 80);
    doc.text('NIT/CI/CEX:', pageWidth - 70, 75);
    doc.text('Cod. Cliente:', pageWidth - 70, 80);

    doc.setFont("helvetica", "normal");
    doc.text(`${fechaActual}`, 40, 75);
    doc.text(`${nombreCliente}`, 32, 80);
    doc.text(`${nitCliente}`, pageWidth - 45, 75);
    doc.text(`${cliente?.id || 'S/N'}`, pageWidth - 45, 80);

    doc.line(14, 83, pageWidth - 14, 83);

    // --- 5. TABLA DE PRODUCTOS ---
    const columnas = ['CÓDIGO', 'CANT.', 'DESCRIPCIÓN', 'P. UNIT (Bs)', 'SUBTOTAL (Bs)'];
    const filas = pedidoData.detallePedidos.map((det: any) => {
      const descripcionTecnica = det.producto.descripcionTecnica ? `\n${det.producto.descripcionTecnica}` : '';
      return [
        det.producto.sku || `PROD-${det.producto.idProducto}`,
        det.cantidad,
        `${det.producto.nombre}${descripcionTecnica}`,
        parseFloat(det.precioUnitario).toFixed(2),
        parseFloat(det.subtotal).toFixed(2)
      ];
    });

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 87, // Bajamos un poco la tabla para que no se pegue a la línea
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0], halign: 'center' },
      bodyStyles: { lineWidth: 0.1, lineColor: [0,0,0], valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'left', cellWidth: 'auto' }, 
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 }
      }
    });

    // --- 6. TOTALES Y LITERAL ---
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    const totalVenta = parseFloat(datosSiat.total);
    
    // Bloque de totales (Derecha)
    doc.setFont("helvetica", "normal");
    doc.text('SUBTOTAL:', pageWidth - 50, finalY);
    doc.text(`${totalVenta.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
    
    doc.text('DESCUENTO:', pageWidth - 50, finalY + 5);
    doc.text('0.00', pageWidth - 14, finalY + 5, { align: 'right' });

    doc.setFont("helvetica", "bold");
    doc.text('TOTAL A PAGAR:', pageWidth - 50, finalY + 10);
    doc.text(`${totalVenta.toFixed(2)}`, pageWidth - 14, finalY + 10, { align: 'right' });

    doc.text('IMPORTE BASE CRÉDITO FISCAL:', pageWidth - 70, finalY + 15);
    doc.text(`${totalVenta.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });

    // Bloque Literal (Izquierda) - Ahora generado dinámicamente
    doc.setFontSize(8);
    const centavos = Math.round((totalVenta % 1) * 100).toString().padStart(2, '0');
    // Generamos el texto si no viene del backend
    const literal = datosSiat.montoLiteral ? datosSiat.montoLiteral : this.convertirNumeroALetras(Math.floor(totalVenta)); 
    
    doc.text(`Son: ${literal} ${centavos}/100 BOLIVIANOS`, 14, finalY + 5); 

    // --- 7. CÓDIGO QR Y LEYENDAS SIAT ---
    const startFooterY = finalY + 25;

    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(datosSiat.urlQr)}`;
      const qrBase64 = await this.getBase64ImageFromURL(qrCodeUrl);
      doc.addImage(qrBase64, 'PNG', pageWidth / 2 - 15, startFooterY, 30, 30); 
    } catch (error) {
      doc.rect(pageWidth / 2 - 15, startFooterY, 30, 30); 
      doc.text("QR NO CARGADO", pageWidth / 2, startFooterY + 15, { align: 'center' });
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    const leyendaFija = "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY";
    const leyendaCuf = datosSiat.leyenda || "Ley N° 453: Tienes derecho a recibir información sobre las características y contenidos de los servicios que utilices.";
    const leyendaRepresentacion = "Este documento es la Representación Gráfica de un Documento Fiscal Digital emitido en una modalidad de facturación en línea";

    doc.text(doc.splitTextToSize(leyendaFija, 180), pageWidth / 2, startFooterY + 35, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(leyendaCuf, 180), pageWidth / 2, startFooterY + 40, { align: 'center' });
    doc.text(doc.splitTextToSize(leyendaRepresentacion, 180), pageWidth / 2, startFooterY + 45, { align: 'center' });

    return doc;
  }

  // --- MÉTODOS AUXILIARES ---

  private getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('No context');
        }
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
  }

  /**
   * Convierte un número entero a su representación en letras (Ej: 850 -> OCHOCIENTOS CINCUENTA)
   */
  private convertirNumeroALetras(num: number): string {
    if (num === 0) return 'CERO';

    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenasMultiplos = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertirMenosDeMil = (n: number): string => {
      let letras = '';
      if (n >= 100) {
        if (n === 100) return 'CIEN';
        letras += centenas[Math.floor(n / 100)] + ' ';
        n %= 100;
      }
      if (n >= 10 && n <= 19) {
        letras += decenas[n - 10];
        return letras;
      } else if (n >= 20) {
        if (n === 20) return letras + 'VEINTE';
        if (n < 30) return letras + 'VEINTI' + unidades[n % 10];
        letras += decenasMultiplos[Math.floor(n / 10)];
        n %= 10;
        if (n > 0) letras += ' Y ';
      }
      if (n > 0) letras += unidades[n];
      return letras.trim();
    };

    if (num < 1000) return convertirMenosDeMil(num);
    
    if (num < 1000000) {
      const miles = Math.floor(num / 1000);
      const resto = num % 1000;
      let letrasMiles = miles === 1 ? 'MIL' : convertirMenosDeMil(miles) + ' MIL';
      return resto === 0 ? letrasMiles : letrasMiles + ' ' + convertirMenosDeMil(resto);
    }

    return 'MONTO FUERA DE RANGO'; // Para montos mayores a 1 millón (puedes extenderlo si lo necesitas)
  }
}