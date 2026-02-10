import { PDFDocument, rgb } from "pdf-lib";

interface HistoryEntry {
  id: number;
  portfolioId: number;
  userId: number;
  changeType: string;
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface PortfolioInfo {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

/**
 * Exporta historial de portafolio a formato CSV
 */
export async function exportHistoryToCSV(
  portfolio: PortfolioInfo,
  history: HistoryEntry[]
): Promise<string> {
  // Encabezados
  const headers = [
    "Fecha",
    "Tipo de Cambio",
    "Descripción",
    "Valor Anterior",
    "Valor Nuevo",
    "Cambio",
    "Metadatos",
  ];

  // Datos
  const rows = history.map((entry) => {
    const prevValue = entry.previousValue ? parseFloat(entry.previousValue) : null;
    const newValue = entry.newValue ? parseFloat(entry.newValue) : null;
    const change = prevValue && newValue ? newValue - prevValue : null;

    return [
      new Date(entry.createdAt).toLocaleString("es-ES"),
      getChangeTypeLabel(entry.changeType),
      entry.description || "",
      prevValue !== null ? `$${prevValue.toFixed(2)}` : "",
      newValue !== null ? `$${newValue.toFixed(2)}` : "",
      change !== null ? `$${change.toFixed(2)}` : "",
      entry.metadata ? entry.metadata : "",
    ];
  });

  // Construir CSV
  let csv = `Portafolio: ${portfolio.name}\n`;
  csv += `Creado: ${new Date(portfolio.createdAt).toLocaleString("es-ES")}\n`;
  csv += `Fecha de Exportación: ${new Date().toLocaleString("es-ES")}\n\n`;
  csv += headers.map((h) => `"${h}"`).join(",") + "\n";
  csv += rows
    .map((row) =>
      row
        .map((cell) => {
          // Escapar comillas en celdas
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  return csv;
}

/**
 * Exporta historial de portafolio a formato PDF
 */
export async function exportHistoryToPDF(
  portfolio: PortfolioInfo,
  history: HistoryEntry[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4
  let yPosition = 750;

  const margin = 40;
  const lineHeight = 14;

  // Función para agregar texto
  const addText = (text: string, size: number = 12, bold: boolean = false) => {
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = 750;
    }

    page.drawText(text, {
      x: margin,
      y: yPosition,
      size,
      color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight + (bold ? 4 : 2);
  };

  // Encabezado
  addText("HISTORIAL DE PORTAFOLIO", 16, true);
  yPosition -= 10;

  addText(`Portafolio: ${portfolio.name}`, 11, true);
  addText(`Creado: ${new Date(portfolio.createdAt).toLocaleString("es-ES")}`, 11);
  addText(`Exportado: ${new Date().toLocaleString("es-ES")}`, 11);
  addText(`Total de Cambios: ${history.length}`, 11);

  yPosition -= 10;

  // Tabla de historial
  if (history.length > 0) {
    addText("CAMBIOS REGISTRADOS", 12, true);
    yPosition -= 5;

    // Encabezados de tabla
    const colWidths = [80, 100, 60, 60, 60, 60];
    const headers = ["Fecha", "Tipo", "Descripción", "Anterior", "Nuevo", "Cambio"];

    // Dibujar encabezados
    let xPos = margin;
    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: xPos,
        y: yPosition,
        size: 9,
        color: rgb(1, 1, 1),
      });
      xPos += colWidths[i];
    }

    yPosition -= 12;

    // Dibujar filas
    for (const entry of history) {
      if (yPosition < margin + 30) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 750;
      }

      const prevValue = entry.previousValue ? parseFloat(entry.previousValue) : null;
      const newValue = entry.newValue ? parseFloat(entry.newValue) : null;
      const change = prevValue && newValue ? newValue - prevValue : null;

      const rowData = [
        new Date(entry.createdAt).toLocaleDateString("es-ES"),
        getChangeTypeLabel(entry.changeType).substring(0, 15),
        (entry.description || "").substring(0, 12),
        prevValue !== null ? `$${prevValue.toFixed(0)}` : "-",
        newValue !== null ? `$${newValue.toFixed(0)}` : "-",
        change !== null ? `$${change.toFixed(0)}` : "-",
      ];

      xPos = margin;
      for (let i = 0; i < rowData.length; i++) {
        page.drawText(rowData[i], {
          x: xPos,
          y: yPosition,
          size: 8,
          color: rgb(0.2, 0.2, 0.2),
        });
        xPos += colWidths[i];
      }

      yPosition -= 10;
    }
  } else {
    addText("No hay cambios registrados en este portafolio.", 11);
  }

  // Pie de página
  yPosition = 30;
  page.drawText("Generado por Web Financiera - Optimizador de Portafolios", {
    x: margin,
    y: yPosition,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Obtiene etiqueta legible para tipo de cambio
 */
function getChangeTypeLabel(changeType: string): string {
  const labels: Record<string, string> = {
    created: "Portafolio Creado",
    updated: "Portafolio Actualizado",
    asset_added: "Activo Agregado",
    asset_removed: "Activo Removido",
    asset_modified: "Activo Modificado",
    rebalanced: "Rebalanceado",
    deleted: "Portafolio Eliminado",
  };
  return labels[changeType] || changeType;
}
