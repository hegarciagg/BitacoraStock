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

interface DeleteInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: number;
  portfolioId: number;
  investmentSymbol: string;
  onSuccess?: () => void;
}

export function DeleteInvestmentDialog({
  open,
  onOpenChange,
  investmentId,
  portfolioId,
  investmentSymbol,
  onSuccess,
}: DeleteInvestmentDialogProps) {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const deleteInvestmentMutation = trpc.investment.delete.useMutation({
    onSuccess: () => {
      success("Inversión eliminada", "La inversión se ha eliminado correctamente.");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      error("Error al eliminar", err.message || "No se pudo eliminar la inversión.");
    },
  });

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteInvestmentMutation.mutateAsync({
        investmentId,
        portfolioId,
      });

    } catch (error) {
      console.error("Error al eliminar inversión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Inversión</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar la inversión en "{investmentSymbol}"?
            Esta acción no se puede deshacer.
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
