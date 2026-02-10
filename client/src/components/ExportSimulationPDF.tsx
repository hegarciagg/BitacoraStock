import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
interface ExportSimulationPDFProps {
  simulationId: number;
  portfolioName?: string;
}

export function ExportSimulationPDF({ simulationId, portfolioName = "simulacion" }: ExportSimulationPDFProps) {
  const [isLoading, setIsLoading] = useState(false);
  const exportPDF = trpc.simulation.exportPDF.useMutation();

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const result = await exportPDF.mutateAsync({ simulationId });

      if (result.success && result.pdfBase64) {
        // Convertir base64 a blob
        const binaryString = atob(result.pdfBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || `${portfolioName}_simulacion.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log("PDF descargado correctamente");
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      console.error("Error al descargar PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Descargar PDF
        </>
      )}
    </Button>
  );
}
