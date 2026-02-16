import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { UserProfileCard } from "@/components/UserProfileCard";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { SessionHistoryCard } from "@/components/SessionHistoryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">Mi Perfil</h1>
          <div className="w-10" />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Perfil de usuario */}
          <div className="md:col-span-2">
            <UserProfileCard user={user} />

            {/* Acciones */}
            <Card className="bg-slate-800 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Acciones</CardTitle>
                <CardDescription className="text-slate-400">
                  Gestiona tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <EditProfileDialog user={user} />
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  disabled
                >
                  Cambiar Contraseña (Próximamente)
                </Button>
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Estadísticas */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">Portafolios</p>
                  <p className="text-2xl font-bold text-primary">0</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Inversiones</p>
                  <p className="text-2xl font-bold text-green-400">0</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valor Total</p>
                  <p className="text-2xl font-bold text-purple-400">$0.00</p>
                </div>
              </CardContent>
            </Card>

            {/* Información de seguridad */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Seguridad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Autenticación</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                    Activa
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Última sesión: {new Date(user.lastSignedIn).toLocaleDateString("es-ES")}
                </div>
              </CardContent>
            </Card>

            {/* Historial de sesiones */}
            <SessionHistoryCard />
          </div>
        </div>
      </div>
    </div>
  );
}
