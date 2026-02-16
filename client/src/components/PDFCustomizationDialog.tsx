import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface PDFSections {
  generalInfo: boolean;
  simulationParameters: boolean;
  portfolioComposition: boolean;
  mainMetrics: boolean;
  riskAnalysis: boolean;
  interpretation: boolean;
}

interface PDFCustomizationDialogProps {
  simulationId: number;
  portfolioName?: string;
}

export function PDFCustomizationDialog({
  simulationId,
  portfolioName = "simulacion",
}: PDFCustomizationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<PDFSections>({
    generalInfo: true,
    simulationParameters: true,
    portfolioComposition: true,
    mainMetrics: true,
    riskAnalysis: true,
    interpretation: true,
  });

  const exportPDF = trpc.simulation.exportPDFCustom.useMutation();

  const handleSectionChange = (section: keyof PDFSections) => {
    setSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);

      // Validar que al menos una sección esté seleccionada
      const hasSelection = Object.values(sections).some((v) => v);
      if (!hasSelection) {
        console.error("Debes seleccionar al menos una sección");
        return;
      }

      const result = await exportPDF.mutateAsync({
        simulationId,
        sections,
      });

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
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAll = () => {
    setSections({
      generalInfo: true,
      simulationParameters: true,
      portfolioComposition: true,
      mainMetrics: true,
      riskAnalysis: true,
      interpretation: true,
    });
  };

  const deselectAll = () => {
    setSections({
      generalInfo: false,
      simulationParameters: false,
      portfolioComposition: false,
      mainMetrics: false,
      riskAnalysis: false,
      interpretation: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Personalizar Informe PDF</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecciona las secciones que deseas incluir en tu informe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Secciones */}
          <div className="space-y-3 border-b border-slate-700 pb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generalInfo"
                checked={sections.generalInfo}
                onCheckedChange={() => handleSectionChange("generalInfo")}
                className="border-slate-500"
              />
              <Label htmlFor="generalInfo" className="text-slate-200 cursor-pointer font-normal">
                Información General
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="simulationParameters"
                checked={sections.simulationParameters}
                onCheckedChange={() => handleSectionChange("simulationParameters")}
                className="border-slate-500"
              />
              <Label
                htmlFor="simulationParameters"
                className="text-slate-200 cursor-pointer font-normal"
              >
                Parámetros de Simulación
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="portfolioComposition"
                checked={sections.portfolioComposition}
                onCheckedChange={() => handleSectionChange("portfolioComposition")}
                className="border-slate-500"
              />
              <Label
                htmlFor="portfolioComposition"
                className="text-slate-200 cursor-pointer font-normal"
              >
                Composición del Portafolio
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mainMetrics"
                checked={sections.mainMetrics}
                onCheckedChange={() => handleSectionChange("mainMetrics")}
                className="border-slate-500"
              />
              <Label htmlFor="mainMetrics" className="text-slate-200 cursor-pointer font-normal">
                Métricas Principales
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="riskAnalysis"
                checked={sections.riskAnalysis}
                onCheckedChange={() => handleSectionChange("riskAnalysis")}
                className="border-slate-500"
              />
              <Label htmlFor="riskAnalysis" className="text-slate-200 cursor-pointer font-normal">
                Análisis de Riesgo
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="interpretation"
                checked={sections.interpretation}
                onCheckedChange={() => handleSectionChange("interpretation")}
                className="border-slate-500"
              />
              <Label htmlFor="interpretation" className="text-slate-200 cursor-pointer font-normal">
                Interpretación
              </Label>
            </div>
          </div>

          {/* Botones de selección rápida */}
          <div className="flex gap-2">
            <Button
              onClick={selectAll}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Seleccionar Todo
            </Button>
            <Button
              onClick={deselectAll}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Deseleccionar Todo
            </Button>
          </div>

          {/* Botón de descarga */}
          <Button
            onClick={handleExport}
            disabled={isLoading || !Object.values(sections).some((v) => v)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar Informe Personalizado
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
