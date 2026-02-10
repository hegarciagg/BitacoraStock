import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/useToast";

interface DeletePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: number;
  portfolioName: string;
  onSuccess?: () => void;
}

export function DeletePortfolioDialog({
  open,
  onOpenChange,
  portfolioId,
  portfolioName,
  onSuccess,
}: DeletePortfolioDialogProps) {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const deletePortfolioMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      success("Portafolio eliminado", "El portafolio se ha eliminado correctamente.");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      error("Error al eliminar", err.message || "No se pudo eliminar el portafolio.");
    },
  });

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deletePortfolioMutation.mutateAsync({
        portfolioId,
      });

    } catch (error) {
      console.error("Error al eliminar portafolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Portafolio</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar el portafolio "{portfolioName}"?
            Esta acción no se puede deshacer. Se eliminarán todas las inversiones
            asociadas a este portafolio.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
