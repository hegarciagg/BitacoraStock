import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toast = useToast();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      if (data.requireVerification) {
        toast.success("Verificación requerida", data.message);
        setLocation(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        toast.success("Bienvenido de vuelta", "Has iniciado sesión exitosamente");
        window.location.href = "/dashboard";
      }
    },
    onError: (error: any) => {
      toast.error("Error al iniciar sesión", error.message || "Credenciales inválidas");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-heading tracking-tight text-slate-300">Log in</h1>
          <p className="text-slate-400">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-slate-700 border-slate-600 text-slate-300 placeholder:text-slate-500 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pr-10 bg-slate-700 border-slate-600 text-slate-300 placeholder:text-slate-500 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-end p-1">
              <a href="#" className="text-sm font-medium text-green-400 hover:text-green-500 hover:underline transition-colors">
                Forgot password?
              </a>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/register">
              <span className="text-green-400 hover:text-green-500 hover:underline cursor-pointer">Sign up</span>
            </Link>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-700/50 mt-6">
          By signing in you agree to our <a href="#" className="underline hover:text-slate-300 transition-colors">Terms of Use</a>, <a href="#" className="underline hover:text-slate-300 transition-colors">SMS Consent</a> and <a href="#" className="underline hover:text-slate-300 transition-colors">Privacy Notice</a>.
        </div>
      </div>
    </div>
  );
}
