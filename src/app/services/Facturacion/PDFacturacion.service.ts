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
   * Genera el diseño profesional de la Factura (Representación Gráfica SIAT)
   * @param pedidoData Datos del pedido y sus detalles (del frontend)
   * @param datosSiat Datos devueltos por tu backend (CUF, QR, Num Factura, etc.)
   */
  async generarFacturaPDF(pedidoData: any, datosSiat: any) {
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. ENCABEZADO: DATOS DE LA EMPRESA ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('TECH BOLIVIA S.R.L.', 14, 20); 

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('Casa Matriz: Av. La Paz Nro. 123', 14, 25);
    doc.text('Teléfono: 77123456', 14, 29);
    doc.text('Tarija, Bolivia', 14, 33);

    // --- 2. ENCABEZADO: BLOQUE SIAT (Lado derecho) ---
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - 95, 14, 81, 28); // Cuadro contenedor

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text('NIT:', pageWidth - 90, 20);
    doc.text('FACTURA N°:', pageWidth - 90, 25);
    doc.text('CÓD. AUTORIZACIÓN:', pageWidth - 90, 30);

    doc.setFont("helvetica", "normal");
    doc.text('3115970018', pageWidth - 18, 20, { align: 'right' }); // Tu NIT
    doc.text(`${datosSiat.numeroFacturaSiat}`, pageWidth - 18, 25, { align: 'right' });
    
    // El CUF es largo, lo dividimos para que quepa en el cuadro
    doc.setFontSize(7);
    const cufFormat = doc.splitTextToSize(datosSiat.cuf, 55);
    doc.text(cufFormat, pageWidth - 90, 34);

    // --- 3. TÍTULO DEL DOCUMENTO ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('FACTURA ELECTRÓNICA EN LÍNEA', pageWidth / 2, 52, { align: 'center' });
    doc.setFontSize(9);
    doc.text('(Con Derecho a Crédito Fiscal)', pageWidth / 2, 57, { align: 'center' });

    // --- 4. DATOS DEL CLIENTE ---
    const fechaActual = new Date().toLocaleString('es-BO'); // Fecha y hora
    const cliente = pedidoData.pedido?.usuario?.persona;
    const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellidop}` : (pedidoData.pedido?.usuario?.username || 'S/N');
    const nitCliente = cliente?.ci ? cliente.ci : '99002';

    doc.setFont("helvetica", "bold");
    doc.text('Fecha y Hora:', 14, 68);
    doc.text('Señor(es):', 14, 73);
    doc.text('NIT/CI/CEX:', pageWidth - 70, 68);

    doc.setFont("helvetica", "normal");
    doc.text(`${fechaActual}`, 40, 68);
    doc.text(`${nombreCliente}`, 32, 73);
    doc.text(`${nitCliente}`, pageWidth - 45, 68);

    // Línea separadora
    doc.line(14, 76, pageWidth - 14, 76);

    // --- 5. TABLA DE PRODUCTOS (Detalle Técnico) ---
    const columnas = ['CÓDIGO', 'CANT.', 'DESCRIPCIÓN', 'P. UNIT (Bs)', 'SUBTOTAL (Bs)'];
    const filas = pedidoData.detallePedidos.map((det: any) => {
      // Concatenamos nombre + atributos técnicos si existen para dar más contexto (ideal para tecnología)
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
      startY: 80,
      theme: 'plain',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0,0,0], halign: 'center' },
      bodyStyles: { lineWidth: 0.1, lineColor: [0,0,0], valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'left', cellWidth: 'auto' }, // Toma el espacio restante
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

    // Bloque Literal (Izquierda)
    doc.setFontSize(8);
    // Nota: Aquí deberías usar una función real de números a letras. Uso un placeholder dinámico básico.
    const centavos = Math.round((totalVenta % 1) * 100).toString().padStart(2, '0');
    doc.text(`Son: Bolivianos con ${centavos}/100`, 14, finalY + 5); 

    // --- 7. CÓDIGO QR Y LEYENDAS SIAT ---
    const startFooterY = finalY + 25;

    try {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(datosSiat.urlQr)}`;
      const qrBase64 = await this.getBase64ImageFromURL(qrCodeUrl);
      doc.addImage(qrBase64, 'PNG', pageWidth / 2 - 15, startFooterY, 30, 30); // Centrado
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

    // --- 8. GUARDAR PDF ---
    doc.save(`Factura_Tech_${datosSiat.numeroFacturaSiat}.pdf`);
  }

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
}