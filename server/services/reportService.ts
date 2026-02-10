/**
 * Servicio de Generación de Reportes PDF
 * Genera reportes detallados de análisis de portafolio y simulaciones
 */

import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { SimulationResult } from "./monteCarloService";
import { Recommendation } from "./recommendationService";

export interface ReportInput {
  portfolioName: string;
  totalValue: number;
  assets: Array<{
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    weight: number;
    gainLoss: number;
  }>;
  simulationResult: SimulationResult;
  recommendations: Recommendation[];
  generatedDate: Date;
}

/**
 * Genera un análisis narrativo del portafolio usando LLM
 */
export async function generatePortfolioNarrative(input: ReportInput): Promise<string> {
  const assetsSummary = input.assets
    .map((a) => `${a.symbol}: ${(a.weight * 100).toFixed(1)}% (${a.quantity} unidades)`)
    .join(", ");

  const prompt = `Analiza el siguiente portafolio de inversión y proporciona un análisis narrativo profesional en español:

Portafolio: ${input.portfolioName}
Valor Total: $${input.totalValue.toFixed(2)}
Activos: ${assetsSummary}

Métricas de Simulación de Monte Carlo:
- Retorno Esperado: ${(input.simulationResult.expectedReturn * 100).toFixed(2)}%
- Volatilidad: ${(input.simulationResult.volatility * 100).toFixed(2)}%
- Sharpe Ratio: ${input.simulationResult.sharpeRatio.toFixed(2)}
- Valor en Riesgo (95%): ${input.simulationResult.valueAtRisk95.toFixed(2)}
- Valor Esperado Final: $${input.simulationResult.meanFinalValue.toFixed(2)}

Proporciona un análisis que incluya:
1. Resumen ejecutivo del portafolio
2. Análisis de diversificación
3. Evaluación de riesgo
4. Perspectiva de rendimiento esperado
5. Recomendaciones clave`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Eres un analista financiero profesional. Proporciona análisis detallados y perspicaces de portafolios de inversión.",
      },
      {
        role: "user",
        content: prompt as any,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? content : "No se pudo generar el análisis narrativo.";
}

/**
 * Genera explicaciones de recomendaciones usando LLM
 */
export async function generateRecommendationExplanations(
  recommendations: Recommendation[]
): Promise<string> {
  if (recommendations.length === 0) {
    return "No hay recomendaciones disponibles en este momento.";
  }

  const recommendationsSummary = recommendations
    .map((r) => `${r.title}: ${r.description}`)
    .join("\n\n");

  const prompt = `Proporciona explicaciones detalladas y educativas para las siguientes recomendaciones de inversión en español:

${recommendationsSummary}

Para cada recomendación, explica:
1. Por qué es importante
2. Cómo implementarla
3. Beneficios esperados
4. Riesgos potenciales

Mantén un tono profesional pero accesible para inversores de todos los niveles.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Eres un educador financiero experto. Explica conceptos de inversión de manera clara y comprensible.",
      },
      {
        role: "user",
        content: prompt as any,
      },
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" ? content : "No se pudieron generar las explicaciones.";
}

/**
 * Genera HTML para el reporte PDF
 */
export function generateReportHTML(
  input: ReportInput,
  narrative: string,
  explanations: string
): string {
  const assetsTable = input.assets
    .map(
      (asset) => `
    <tr>
      <td>${asset.symbol}</td>
      <td>${asset.name}</td>
      <td>${asset.quantity.toFixed(2)}</td>
      <td>$${asset.currentPrice.toFixed(2)}</td>
      <td>${(asset.weight * 100).toFixed(1)}%</td>
      <td>$${asset.gainLoss.toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const recommendationsHTML = input.recommendations
    .map(
      (rec) => `
    <div class="recommendation">
      <h4>${rec.title}</h4>
      <p><strong>Prioridad:</strong> ${rec.priority}</p>
      <p>${rec.description}</p>
      <ul>
        ${rec.suggestedActions.map((action) => `<li>${action.action}: ${action.reason}</li>`).join("")}
      </ul>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Portafolio - ${input.portfolioName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a73e8;
      border-bottom: 3px solid #1a73e8;
      padding-bottom: 10px;
    }
    h2 {
      color: #1a73e8;
      margin-top: 30px;
    }
    h3 {
      color: #555;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      padding: 15px;
      background: #f0f4ff;
      border-radius: 5px;
    }
    .metric {
      padding: 10px;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      font-weight: 600;
    }
    .metric-value {
      font-size: 1.3em;
      color: #1a73e8;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #1a73e8;
      color: white;
      padding: 12px;
      text-align: left;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .recommendation {
      background: #f0f4ff;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #1a73e8;
      border-radius: 4px;
    }
    .narrative {
      background: #f9f9f9;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      line-height: 1.8;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 0.9em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reporte de Análisis de Portafolio</h1>
    
    <div class="header-info">
      <div class="metric">
        <div class="metric-label">Portafolio</div>
        <div class="metric-value">${input.portfolioName}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Valor Total</div>
        <div class="metric-value">$${input.totalValue.toFixed(2)}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Retorno Esperado</div>
        <div class="metric-value">${(input.simulationResult.expectedReturn * 100).toFixed(2)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Volatilidad</div>
        <div class="metric-value">${(input.simulationResult.volatility * 100).toFixed(2)}%</div>
      </div>
    </div>

    <h2>Composición del Portafolio</h2>
    <table>
      <thead>
        <tr>
          <th>Símbolo</th>
          <th>Nombre</th>
          <th>Cantidad</th>
          <th>Precio Actual</th>
          <th>Peso</th>
          <th>Ganancia/Pérdida</th>
        </tr>
      </thead>
      <tbody>
        ${assetsTable}
      </tbody>
    </table>

    <h2>Análisis Narrativo del Portafolio</h2>
    <div class="narrative">
      ${narrative.replace(/\n/g, "<br>")}
    </div>

    <h2>Métricas de Simulación de Monte Carlo</h2>
    <table>
      <tr>
        <th>Métrica</th>
        <th>Valor</th>
      </tr>
      <tr>
        <td>Retorno Esperado</td>
        <td>${(input.simulationResult.expectedReturn * 100).toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Volatilidad (Desv. Est.)</td>
        <td>${(input.simulationResult.volatility * 100).toFixed(2)}%</td>
      </tr>
      <tr>
        <td>Sharpe Ratio</td>
        <td>${input.simulationResult.sharpeRatio.toFixed(4)}</td>
      </tr>
      <tr>
        <td>Valor en Riesgo (95%)</td>
        <td>$${input.simulationResult.valueAtRisk95.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Valor en Riesgo (99%)</td>
        <td>$${input.simulationResult.valueAtRisk99.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Valor Esperado Final (Media)</td>
        <td>$${input.simulationResult.meanFinalValue.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Valor Esperado Final (Mediana)</td>
        <td>$${input.simulationResult.medianFinalValue.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Percentil 5%</td>
        <td>$${input.simulationResult.percentile5.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Percentil 95%</td>
        <td>$${input.simulationResult.percentile95.toFixed(2)}</td>
      </tr>
    </table>

    <h2>Recomendaciones Personalizadas</h2>
    ${recommendationsHTML}

    <h2>Explicación de Recomendaciones</h2>
    <div class="narrative">
      ${explanations.replace(/\n/g, "<br>")}
    </div>

    <div class="footer">
      <p>Reporte generado el ${input.generatedDate.toLocaleDateString("es-ES")} a las ${input.generatedDate.toLocaleTimeString("es-ES")}</p>
      <p>Este reporte es solo para propósitos informativos y no constituye asesoramiento financiero.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Genera un reporte PDF completo y lo almacena en S3
 */
export async function generateAndStorePDF(
  input: ReportInput,
  userId: number
): Promise<{ url: string; fileKey: string }> {
  try {
    // Generar análisis narrativo
    const narrative = await generatePortfolioNarrative(input);

    // Generar explicaciones de recomendaciones
    const explanations = await generateRecommendationExplanations(input.recommendations);

    // Generar HTML
    const html = generateReportHTML(input, narrative, explanations);

    // Convertir HTML a Buffer (en producción se usaría weasyprint o similar)
    const htmlBuffer = Buffer.from(html, "utf-8");

    // Subir a S3
    const filename = `portfolio-report-${Date.now()}.html`;
    const fileKey = `reports/${userId}/${filename}`;
    const result = await storagePut(fileKey, htmlBuffer, "text/html");

    return {
      url: result.url,
      fileKey: result.key,
    };
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
}
