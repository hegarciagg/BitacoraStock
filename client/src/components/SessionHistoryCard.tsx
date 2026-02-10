import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Monitor, LogOut, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function SessionHistoryCard() {
  const toast = useToast();
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  const { data: sessions, isLoading, refetch } = trpc.auth.getSessions.useQuery();
  const closeSessionMutation = trpc.auth.closeSession.useMutation({
    onSuccess: async () => {
      toast.success("Sesión cerrada correctamente");
      setSessionToDelete(null);
      await refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Error al cerrar la sesión");
    },
  });

  const getDeviceIcon = (deviceType?: string | null) => {
    if (deviceType === "mobile") return <Smartphone className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sesiones Activas</CardTitle>
          <CardDescription className="text-slate-400">
            Dispositivos conectados a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">Cargando sesiones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Sesiones Activas</CardTitle>
          <CardDescription className="text-slate-400">
            Dispositivos conectados a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!sessions || sessions.length === 0 ? (
            <p className="text-slate-400">No hay sesiones activas</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getDeviceIcon(session.deviceType)}
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {session.browserName || "Navegador desconocido"}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {session.osName || "SO desconocido"}
                      </p>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Última actividad: {formatDate(session.lastActivityAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {session.isCurrentSession === 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 ml-2"
                      onClick={() => setSessionToDelete(session.sessionId)}
                      disabled={closeSessionMutation.isPending}
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                  {session.isCurrentSession === 1 && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      Actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open: boolean) => !open && setSessionToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Cerrar Sesión</DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas cerrar esta sesión? Se cerrará el acceso desde ese dispositivo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (sessionToDelete) {
                  closeSessionMutation.mutate({ sessionId: sessionToDelete });
                }
              }}
              disabled={closeSessionMutation.isPending}
            >
              {closeSessionMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
