import { User } from "@shared/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Calendar, Shield } from "lucide-react";

interface UserProfileCardProps {
  user: User;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  const createdDate = new Date(user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Perfil de Usuario</CardTitle>
        <CardDescription className="text-slate-400">
          Información de tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar y nombre */}
        <div className="flex items-center space-x-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.profilePicture || undefined} alt={user.name || "Usuario"} />
            <AvatarFallback className="bg-primary text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.name || "Usuario"}</h3>
            <p className="text-sm text-slate-400">{user.loginMethod || "Manus OAuth"}</p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3 border-t border-slate-700 pt-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Correo Electrónico</p>
              <p className="text-sm text-white">{user.email || "No especificado"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Rol</p>
              <p className="text-sm text-white capitalize">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-slate-500">Miembro desde</p>
              <p className="text-sm text-white">{createdDate}</p>
            </div>
          </div>
        </div>

        {/* Perfil de riesgo */}
        {user.riskProfile && (
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs text-slate-500 mb-2">Perfil de Riesgo</p>
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-primary text-white capitalize">
              {user.riskProfile}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
