import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Edit2,
  Save,
  X,
  Monitor,
  Smartphone,
  LogOut,
  Clock,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/* ──────────────────────────────────────────────────────── */
/* Form schema                                              */
/* ──────────────────────────────────────────────────────── */
const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  riskProfile: z.enum(["conservative", "moderate", "aggressive"]),
});
type ProfileForm = z.infer<typeof profileSchema>;

const riskLabels: Record<string, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Agresivo",
};

/* ──────────────────────────────────────────────────────── */
/* Helpers                                                  */
/* ──────────────────────────────────────────────────────── */
function formatDate(date: Date) {
  return new Date(date).toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DeviceIcon({ type }: { type?: string | null }) {
  return type === "mobile" ? (
    <Smartphone className="w-4 h-4 text-slate-500" />
  ) : (
    <Monitor className="w-4 h-4 text-slate-500" />
  );
}

/* ──────────────────────────────────────────────────────── */
/* Page                                                     */
/* ──────────────────────────────────────────────────────── */
export default function UserSettings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [sessionToClose, setSessionToClose] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect once loading is complete and user is definitively not authenticated
    if (!loading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, loading, navigate]);

  const { data: sessions, refetch: refetchSessions } =
    trpc.auth.getSessions.useQuery(undefined, { enabled: isAuthenticated });

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Configuración guardada correctamente");
      await utils.auth.me.invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || "Error al guardar"),
  });

  const closeSession = trpc.auth.closeSession.useMutation({
    onSuccess: async () => {
      toast.success("Sesión cerrada");
      setSessionToClose(null);
      await refetchSessions();
    },
    onError: (err) => toast.error(err.message || "Error al cerrar la sesión"),
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      riskProfile: (user?.riskProfile as ProfileForm["riskProfile"]) ?? "moderate",
    },
  });

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        riskProfile: (user.riskProfile as ProfileForm["riskProfile"]) ?? "moderate",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  const onSubmit = (data: ProfileForm) => updateProfile.mutate(data);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
          <Settings className="w-4 h-4" />
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-medium">Account Settings</span>
        </div>

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your personal information and preferences.
            </p>
          </div>

          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="bg-slate-900 hover:bg-slate-700 text-white gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  form.reset();
                  setEditing(false);
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateProfile.isPending}
                className="bg-slate-900 hover:bg-slate-700 text-white gap-2"
              >
                <Save className="w-4 h-4" />
                {updateProfile.isPending ? "Guardando..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        {/* ── Top panels: Personal Information + Security ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Personal Information */}
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-slate-900 text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">
                  Full Name
                </Label>
                {editing ? (
                  <Input
                    {...form.register("name")}
                    className="border-slate-300 bg-slate-50 text-slate-900"
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <p className="text-slate-900 font-semibold text-lg">{user.name || "—"}</p>
                )}
                {form.formState.errors.name && (
                  <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email (always read-only) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Email</Label>
                <div className="flex items-center gap-2">
                  <p className="text-slate-900 font-semibold text-lg">{user.email || "—"}</p>
                  {user.isEmailVerified === 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {user.isEmailVerified === 1 ? "Email verificado" : "Email no verificado"}
                </p>
              </div>

              {/* Risk Profile */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">
                  Perfil de Riesgo
                </Label>
                {editing ? (
                  <Select
                    value={form.watch("riskProfile")}
                    onValueChange={(v) =>
                      form.setValue("riskProfile", v as ProfileForm["riskProfile"])
                    }
                  >
                    <SelectTrigger className="border-slate-300 bg-slate-50 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservador – Bajo riesgo</SelectItem>
                      <SelectItem value="moderate">Moderado – Riesgo equilibrado</SelectItem>
                      <SelectItem value="aggressive">Agresivo – Alto potencial</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-slate-900 font-semibold text-lg">
                    {riskLabels[user.riskProfile ?? "moderate"] ?? "Moderado"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">
                  Login Method
                </Label>
                <p className="text-slate-900 font-semibold capitalize">
                  {user.loginMethod || "Email"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">
                  Email Status
                </Label>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full ${
                    user.isEmailVerified === 1
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {user.isEmailVerified === 1 ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {user.isEmailVerified === 1 ? "Verified" : "Not verified"}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">
                  Last Sign-In
                </Label>
                <p className="text-slate-900 font-semibold">
                  {formatDate(user.lastSignedIn)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500 uppercase tracking-wide">Role</Label>
                <span className="inline-flex items-center text-sm font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">
                  {user.role}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Active Sessions ── */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-slate-900 text-base">Active Sessions</CardTitle>
            <p className="text-slate-500 text-sm mt-1">
              Devices currently connected to your account.
            </p>
          </CardHeader>
          <CardContent className="pt-5">
            {!sessions || sessions.length === 0 ? (
              <p className="text-slate-400 text-sm">No active sessions found.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <DeviceIcon type={s.deviceType} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 font-medium text-sm">
                          {s.browserName || "Unknown browser"}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {s.osName || "Unknown OS"}
                          {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                        </p>
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Last activity: {formatDate(s.lastActivityAt)}</span>
                        </div>
                      </div>
                    </div>

                    {s.isCurrentSession === 1 ? (
                      <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full ml-2">
                        Current
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                        onClick={() => setSessionToClose(s.sessionId)}
                        disabled={closeSession.isPending}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Close
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Close session confirmation dialog */}
      <AlertDialog
        open={!!sessionToClose}
        onOpenChange={(open) => !open && setSessionToClose(null)}
      >
        <AlertDialogContent className="bg-white border-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">Close Session</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to close this session? That device will be logged out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-300 text-slate-700 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (sessionToClose) closeSession.mutate({ sessionId: sessionToClose });
              }}
              disabled={closeSession.isPending}
            >
              {closeSession.isPending ? "Closing..." : "Close Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
