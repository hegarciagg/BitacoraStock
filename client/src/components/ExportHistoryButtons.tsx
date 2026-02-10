import { Button } from "@/components/ui/button";
import { Download, FileText, File } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

interface ExportHistoryButtonsProps {
  portfolioId: number;
}

export function ExportHistoryButtons({ portfolioId }: ExportHistoryButtonsProps) {
  const [isExporting, setIsExporting] = useState<"csv" | "pdf" | null>(null);

  const exportCSV = trpc.portfolio.exportHistoryCSV.useQuery(
    { portfolioId },
    { enabled: false }
  );

  const exportPDF = trpc.portfolio.exportHistoryPDF.useQuery(
    { portfolioId },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    setIsExporting("csv");
    try {
      const result = await exportCSV.refetch();
      if (result.data?.csv) {
        const element = document.createElement("a");
        const file = new Blob([result.data.csv], { type: "text/csv" });
        element.href = URL.createObjectURL(file);
        element.download = result.data.filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error("Error exportando CSV:", error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      const result = await exportPDF.refetch();
      if (result.data?.pdf) {
        const binaryString = atob(result.data.pdf);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const element = document.createElement("a");
        const file = new Blob([bytes], { type: "application/pdf" });
        element.href = URL.createObjectURL(file);
        element.download = result.data.filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error("Error exportando PDF:", error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportCSV}
        disabled={isExporting !== null}
        variant="outline"
        size="sm"
        className="text-slate-300 border-slate-600 hover:bg-slate-700"
      >
        <FileText className="w-4 h-4 mr-2" />
        {isExporting === "csv" ? "Exportando..." : "Descargar CSV"}
      </Button>
      <Button
        onClick={handleExportPDF}
        disabled={isExporting !== null}
        variant="outline"
        size="sm"
        className="text-slate-300 border-slate-600 hover:bg-slate-700"
      >
        <File className="w-4 h-4 mr-2" />
        {isExporting === "pdf" ? "Exportando..." : "Descargar PDF"}
      </Button>
    </div>
  );
}
