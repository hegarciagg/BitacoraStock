import { PDFDocument, rgb } from "pdf-lib";
import { SimulationResult } from "./monteCarloService";

export interface PDFSections {
  generalInfo: boolean;
  simulationParameters: boolean;
  portfolioComposition: boolean;
  mainMetrics: boolean;
  riskAnalysis: boolean;
  interpretation: boolean;
}

export interface MonteCarloReportData {
  portfolioName: string;
  simulationDate: Date;
  numSimulations: number;
  timeHorizonDays: number;
  initialCapital: number;
  results: SimulationResult;
  assets?: Array<{
    symbol: string;
    weight: number;
    expectedReturn: number;
    volatility: number;
  }>;
  sections?: PDFSections;
}

/**
 * Genera un reporte PDF de simulación de Monte Carlo
 */
export async function generateMonteCarloReport(data: MonteCarloReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  let yPosition = height - 50;
  const margin = 40;
  const contentWidth = width - 2 * margin;

  // Secciones por defecto si no se especifican
  const sections = data.sections || {
    generalInfo: true,
    simulationParameters: true,
    portfolioComposition: true,
    mainMetrics: true,
    riskAnalysis: true,
    interpretation: true,
  };

  // Función auxiliar para dibujar texto
  const drawText = (text: string, size: number, bold: boolean = false, color = rgb(0, 0, 0), y?: number) => {
    if (y !== undefined) yPosition = y;
    page.drawText(text, {
      x: margin,
      y: yPosition,
      size,
      color,
    });
    yPosition -= size + 5;
    return yPosition;
  };

  // Función auxiliar para línea separadora
  const drawLine = () => {
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: width - margin, y: yPosition },
      thickness: 1,
      color: rgb(200, 200, 200),
    });
    yPosition -= 15;
  };

  // Encabezado
  drawText("INFORME DE SIMULACION DE MONTE CARLO", 20, true, rgb(0, 51, 102));
  drawLine();

  // Información general
  if (sections.generalInfo) {
    drawText(`Portafolio: ${data.portfolioName}`, 11);
    drawText(`Fecha de Simulacion: ${data.simulationDate.toLocaleDateString("es-ES")}`, 11);
    drawText(`Capital Inicial: $${data.initialCapital.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`, 11);
    yPosition -= 10;
  }

  // Parámetros de simulación
  if (sections.simulationParameters) {
    drawText("PARAMETROS DE SIMULACION", 14, true, rgb(0, 51, 102));
    drawLine();
    drawText(`Numero de Simulaciones: ${data.numSimulations.toLocaleString()}`, 11);
    drawText(`Horizonte Temporal: ${data.timeHorizonDays} dias (${(data.timeHorizonDays / 365).toFixed(2)} anos)`, 11);
    yPosition -= 10;
  }

  // Composición del portafolio
  if (sections.portfolioComposition && data.assets && data.assets.length > 0) {
    drawText("COMPOSICION DEL PORTAFOLIO", 14, true, rgb(0, 51, 102));
    drawLine();

    // Tabla de activos
    const tableY = yPosition;
    const colWidths = [contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25, contentWidth * 0.25];
    const headers = ["Simbolo", "Peso", "Retorno Esp.", "Volatilidad"];
    let colX = margin;

    // Encabezados de tabla
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: colX,
        y: tableY,
        size: 10,
        color: rgb(255, 255, 255),
      });
      colX += colWidths[i];
    });

    // Fondo de encabezado
    page.drawRectangle({
      x: margin,
      y: tableY - 5,
      width: contentWidth,
      height: 15,
      color: rgb(0, 51, 102),
    });

    yPosition -= 25;

    // Filas de tabla
    data.assets.forEach((asset) => {
      colX = margin;
      const rowData = [
        asset.symbol,
        `${(asset.weight * 100).toFixed(1)}%`,
        `${(asset.expectedReturn * 100).toFixed(2)}%`,
        `${(asset.volatility * 100).toFixed(2)}%`,
      ];

      rowData.forEach((value, i) => {
        page.drawText(value, {
          x: colX,
          y: yPosition,
          size: 9,
          color: rgb(0, 0, 0),
        });
        colX += colWidths[i];
      });

      yPosition -= 12;
    });

    yPosition -= 10;
  }

  // Resultados de simulación
  if (sections.mainMetrics) {
    drawText("RESULTADOS DE SIMULACION", 14, true, rgb(0, 51, 102));
    drawLine();
  }

  // Métricas principales
  if (sections.mainMetrics) {
    const metrics = [
    ["Retorno Esperado", `${(data.results.expectedReturn * 100).toFixed(2)}%`],
    ["Volatilidad", `${(data.results.volatility * 100).toFixed(2)}%`],
    ["Sharpe Ratio", `${data.results.sharpeRatio.toFixed(4)}`],
    ["Valor Esperado (Media)", `$${data.results.meanFinalValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
    ["Valor Mediano", `$${data.results.medianFinalValue.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
  ];

    metrics.forEach(([label, value]) => {
      page.drawText(`${label}:`, {
        x: margin,
        y: yPosition,
        size: 10,
      });
      page.drawText(value, {
        x: margin + 200,
        y: yPosition,
        size: 10,
        color: rgb(0, 102, 0),
      });
      yPosition -= 12;
    });

    yPosition -= 10;
  }

  // Análisis de riesgo
  if (sections.riskAnalysis) {
    drawText("ANALISIS DE RIESGO", 14, true, rgb(0, 51, 102));
    drawLine();

    const riskMetrics = [
      ["Percentil 5% (Peor Caso)", `$${data.results.percentile5.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
      ["Percentil 95% (Mejor Caso)", `$${data.results.percentile95.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
      ["Value at Risk 95%", `$${data.results.valueAtRisk95.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
      ["Value at Risk 99%", `$${data.results.valueAtRisk99.toLocaleString("es-ES", { maximumFractionDigits: 2 })}`],
    ];

    riskMetrics.forEach(([label, value]) => {
      page.drawText(`${label}:`, {
        x: margin,
        y: yPosition,
        size: 10,
      });
      page.drawText(value, {
        x: margin + 200,
        y: yPosition,
        size: 10,
        color: rgb(204, 0, 0),
      });
      yPosition -= 12;
    });

    yPosition -= 10;
  }

  // Interpretación
  if (sections.interpretation) {
    drawText("INTERPRETACION", 14, true, rgb(0, 51, 102));
    drawLine();

    const interpretations = [
    `- El retorno esperado de ${(data.results.expectedReturn * 100).toFixed(2)}% representa la ganancia promedio proyectada.`,
    `- La volatilidad de ${(data.results.volatility * 100).toFixed(2)}% indica el nivel de riesgo del portafolio.`,
    `- El Sharpe Ratio de ${data.results.sharpeRatio.toFixed(4)} mide el retorno ajustado por riesgo.`,
    `- Hay 95% de probabilidad de que el valor final este entre $${data.results.percentile5.toLocaleString("es-ES", { maximumFractionDigits: 0 })} y $${data.results.percentile95.toLocaleString("es-ES", { maximumFractionDigits: 0 })}.`,
    `- El VaR 95% de $${data.results.valueAtRisk95.toLocaleString("es-ES", { maximumFractionDigits: 0 })} indica la perdida maxima esperada en el 5% de los casos.`,
  ];

    interpretations.forEach((text) => {
      const words = text.split(" ");
      let line = "";
      let lineY = yPosition;

      words.forEach((word) => {
        const testLine = line + word + " ";
        const textWidth = testLine.length * 3; // Aproximación

        if (textWidth > contentWidth - 20) {
          page.drawText(line, {
            x: margin + 10,
            y: lineY,
            size: 9,
            color: rgb(50, 50, 50),
          });
          line = word + " ";
          lineY -= 11;
        } else {
          line = testLine;
        }
      });

      if (line) {
        page.drawText(line, {
          x: margin + 10,
          y: lineY,
          size: 9,
          color: rgb(50, 50, 50),
        });
      }

      yPosition = lineY - 12;
    });
  }

  // Pie de página
  page.drawText(`Generado: ${new Date().toLocaleString("es-ES")}`, {
    x: margin,
    y: 20,
    size: 8,
    color: rgb(150, 150, 150),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
