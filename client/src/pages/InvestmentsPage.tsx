import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditInvestmentDialog } from "@/components/EditInvestmentDialog";
import { DeleteInvestmentDialog } from "@/components/DeleteInvestmentDialog";
import { useAuth } from "@/_core/hooks/useAuth";

interface InvestmentsPageProps {
  portfolioId: number;
}

export function InvestmentsPage({ portfolioId }: InvestmentsPageProps) {
  const { user } = useAuth();
  const [editingInvestmentId, setEditingInvestmentId] = useState<number | null>(null);
  const [deletingInvestmentId, setDeletingInvestmentId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: investments, isLoading, refetch } = trpc.investment.list.useQuery({
    portfolioId,
  });

  if (!user) {
    return <div>Por favor inicia sesión</div>;
  }

  if (isLoading) {
    return <div>Cargando inversiones...</div>;
  }

  const currentInvestment = investments?.find((i) => i.id === editingInvestmentId);
  const deletingInvestment = investments?.find((i) => i.id === deletingInvestmentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inversiones</h1>
          <p className="text-gray-500">Gestiona las inversiones de tu portafolio</p>
        </div>
        <Button>Agregar Inversión</Button>
      </div>

      {!investments || investments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No tienes inversiones aún. Agrega una para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Símbolo</th>
                <th className="text-left py-3 px-4">Cantidad</th>
                <th className="text-left py-3 px-4">Precio Unitario</th>
                <th className="text-left py-3 px-4">Valor Total</th>
                <th className="text-left py-3 px-4">Comisión</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((investment) => (
                <tr key={investment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold">{investment.symbol}</td>
                  <td className="py-3 px-4">{investment.quantity}</td>
                  <td className="py-3 px-4">${investment.unitPrice}</td>
                  <td className="py-3 px-4">${investment.totalValue}</td>
                  <td className="py-3 px-4">${investment.commission || "0.00"}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingInvestmentId(investment.id);
                          setEditDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingInvestmentId(investment.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentInvestment && (
        <EditInvestmentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          investmentId={currentInvestment.id}
          portfolioId={portfolioId}
          initialData={{
            symbol: currentInvestment.symbol,
            quantity: currentInvestment.quantity,
            unitPrice: currentInvestment.unitPrice,
            totalValue: currentInvestment.totalValue,
            commission: currentInvestment.commission || undefined,
            dividend: currentInvestment.dividend || undefined,
            comments: currentInvestment.comments || undefined,
          }}
          onSuccess={() => refetch()}
        />
      )}

      {deletingInvestment && (
        <DeleteInvestmentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          investmentId={deletingInvestment.id}
          portfolioId={portfolioId}
          investmentSymbol={deletingInvestment.symbol}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
