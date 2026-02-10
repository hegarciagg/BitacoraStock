import { useState } from "react";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";

const updateInvestmentSchema = z.object({
  symbol: z.string().optional(),
  quantity: z.string().optional(),
  unitPrice: z.string().optional(),
  totalValue: z.string().optional(),
  commission: z.string().optional(),
  saleDate: z.date().optional(),
  salePrice: z.string().optional(),
  saleValue: z.string().optional(),
  saleCommission: z.string().optional(),
  dividend: z.string().optional(),
  comments: z.string().optional(),
});

type UpdateInvestmentInput = z.infer<typeof updateInvestmentSchema>;

interface EditInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentId: number;
  portfolioId: number;
  initialData: {
    symbol: string;
    quantity: string;
    unitPrice: string;
    totalValue: string;
    commission?: string;
    dividend?: string;
    comments?: string;
  };
  onSuccess?: () => void;
}

export function EditInvestmentDialog({
  open,
  onOpenChange,
  investmentId,
  portfolioId,
  initialData,
  onSuccess,
}: EditInvestmentDialogProps) {
  const { success, error } = useToast();
  const [formData, setFormData] = useState<UpdateInvestmentInput>({
    symbol: initialData.symbol,
    quantity: initialData.quantity,
    unitPrice: initialData.unitPrice,
    totalValue: initialData.totalValue,
    commission: initialData.commission || "",
    dividend: initialData.dividend || "",
    comments: initialData.comments || "",
  });
  const [errors, setErrors] = useState<Partial<UpdateInvestmentInput>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateInvestmentMutation = trpc.investment.update.useMutation({
    onSuccess: () => {
      success("Inversión actualizada", "Los cambios se han guardado correctamente.");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      error("Error al actualizar", err.message || "No se pudo actualizar la inversión.");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof UpdateInvestmentInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      const validated = updateInvestmentSchema.parse(formData);

      // Call mutation
      await updateInvestmentMutation.mutateAsync({
        investmentId,
        portfolioId,
        ...validated,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<UpdateInvestmentInput> = {};
        error.issues.forEach((issue: any) => {
          const path = issue.path[0] as keyof UpdateInvestmentInput;
          newErrors[path] = issue.message as any;
        });
        setErrors(newErrors);
        console.error("Errores de validación:", newErrors);
      } else {
        console.error("Error desconocido:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Inversión</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu inversión.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Símbolo</Label>
              <Input
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="AAPL"
                disabled={isLoading}
              />
              {errors.symbol && (
                <p className="text-sm text-red-500">{errors.symbol}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="100"
                disabled={isLoading}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Precio Unitario</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleChange}
                placeholder="150.00"
                disabled={isLoading}
              />
              {errors.unitPrice && (
                <p className="text-sm text-red-500">{errors.unitPrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalValue">Valor Total</Label>
              <Input
                id="totalValue"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                placeholder="15000.00"
                disabled={isLoading}
              />
              {errors.totalValue && (
                <p className="text-sm text-red-500">{errors.totalValue}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">Comisión (Opcional)</Label>
            <Input
              id="commission"
              name="commission"
              value={formData.commission}
              onChange={handleChange}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.commission && (
              <p className="text-sm text-red-500">{errors.commission}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dividend">Dividendo (Opcional)</Label>
            <Input
              id="dividend"
              name="dividend"
              value={formData.dividend}
              onChange={handleChange}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.dividend && (
              <p className="text-sm text-red-500">{errors.dividend}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentarios (Opcional)</Label>
            <Textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Notas sobre esta inversión..."
              disabled={isLoading}
              rows={2}
            />
            {errors.comments && (
              <p className="text-sm text-red-500">{errors.comments}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
