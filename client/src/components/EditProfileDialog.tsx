import { useState } from "react";
import { User } from "@shared/types";
import { trpc } from "@/lib/trpc";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const editProfileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255, "El nombre es muy largo").optional(),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]).optional(),
});

type EditProfileInput = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  user: User;
  onSuccess?: () => void;
}

export function EditProfileDialog({ user, onSuccess }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const utils = trpc.useUtils();

  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user.name || "",
      riskProfile: user.riskProfile || "moderate",
    },
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Perfil actualizado correctamente");
      await utils.auth.me.invalidate();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar el perfil");
    },
  });

  const onSubmit = (data: EditProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white shadow-sm border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Editar Perfil</DialogTitle>
          <DialogDescription className="text-slate-500">
            Actualiza tu nombre y perfil de riesgo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre completo"
                      {...field}
                      className="bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500"
                    />
                  </FormControl>
                  <FormDescription className="text-slate-500">
                    Tu nombre público en la plataforma
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Perfil de Riesgo */}
            <FormField
              control={form.control}
              name="riskProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700">Perfil de Riesgo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-100 border-slate-300 text-slate-900">
                        <SelectValue placeholder="Selecciona tu perfil de riesgo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-100 border-slate-300">
                      <SelectItem value="conservative" className="text-slate-900 hover:bg-slate-600">
                        Conservador - Bajo riesgo, retornos estables
                      </SelectItem>
                      <SelectItem value="moderate" className="text-slate-900 hover:bg-slate-600">
                        Moderado - Riesgo equilibrado
                      </SelectItem>
                      <SelectItem value="aggressive" className="text-slate-900 hover:bg-slate-600">
                        Agresivo - Alto riesgo, retornos potenciales
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-slate-500">
                    Define tu tolerancia al riesgo de inversión
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
