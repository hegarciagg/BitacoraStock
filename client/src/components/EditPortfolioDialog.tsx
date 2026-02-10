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

const updatePortfolioSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;

interface EditPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: number;
  initialName: string;
  initialDescription?: string;
  onSuccess?: () => void;
}

export function EditPortfolioDialog({
  open,
  onOpenChange,
  portfolioId,
  initialName,
  initialDescription,
  onSuccess,
}: EditPortfolioDialogProps) {
  const { success, error } = useToast();
  const [formData, setFormData] = useState<UpdatePortfolioInput>({
    name: initialName,
    description: initialDescription || "",
  });
  const [errors, setErrors] = useState<Partial<UpdatePortfolioInput>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updatePortfolioMutation = trpc.portfolio.update.useMutation({
    onSuccess: () => {
      success("Portafolio actualizado", "Los cambios se han guardado correctamente.");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      error("Error al actualizar", err.message || "No se pudo actualizar el portafolio.");
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
    if (errors[name as keyof UpdatePortfolioInput]) {
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
      const validated = updatePortfolioSchema.parse(formData);

      // Call mutation
      await updatePortfolioMutation.mutateAsync({
        portfolioId,
        name: validated.name,
        description: validated.description,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<UpdatePortfolioInput> = {};
        error.issues.forEach((issue: any) => {
          const path = issue.path[0] as keyof UpdatePortfolioInput;
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Portafolio</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de tu portafolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Portafolio</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Mi Portafolio de Inversión"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe el propósito de este portafolio..."
              disabled={isLoading}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
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
