import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditPortfolioDialog } from "@/components/EditPortfolioDialog";
import { DeletePortfolioDialog } from "@/components/DeletePortfolioDialog";
import { useAuth } from "@/_core/hooks/useAuth";

export function PortfoliosPage() {
  const { user } = useAuth();
  const [editingPortfolioId, setEditingPortfolioId] = useState<number | null>(null);
  const [deletingPortfolioId, setDeletingPortfolioId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: portfolios, isLoading, refetch } = trpc.portfolio.list.useQuery();

  if (!user) {
    return <div>Por favor inicia sesión</div>;
  }

  if (isLoading) {
    return <div>Cargando portafolios...</div>;
  }

  const currentPortfolio = portfolios?.find((p) => p.id === editingPortfolioId);
  const deletingPortfolio = portfolios?.find((p) => p.id === deletingPortfolioId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Portafolios</h1>
          <p className="text-gray-500">Gestiona y edita tus portafolios de inversión</p>
        </div>
        <Button>Crear Nuevo Portafolio</Button>
      </div>

      {!portfolios || portfolios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No tienes portafolios aún. Crea uno para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1">{portfolio.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {portfolio.description || "Sin descripción"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Creado:</span>{" "}
                    {new Date(portfolio.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPortfolioId(portfolio.id);
                      setEditDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeletingPortfolioId(portfolio.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Eliminar
                  </Button>
                  <Button variant="secondary" size="sm">
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentPortfolio && (
        <EditPortfolioDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          portfolioId={currentPortfolio.id}
          initialName={currentPortfolio.name}
          initialDescription={currentPortfolio.description || undefined}
          onSuccess={() => refetch()}
        />
      )}

      {deletingPortfolio && (
        <DeletePortfolioDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          portfolioId={deletingPortfolio.id}
          portfolioName={deletingPortfolio.name}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
