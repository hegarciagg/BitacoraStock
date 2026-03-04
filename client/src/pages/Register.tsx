import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toast = useToast();
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data: any) => {
      toast.success("Registro exitoso", "Hemos enviado un código de verificación a tu correo.");
      setLocation(`/verify-email?email=${encodeURIComponent(email)}`);
    },
    onError: (error: any) => {
      toast.error("Error al registrarse", error.message || "No se pudo crear la cuenta");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (name && email && password) {
      registerMutation.mutate({ name, email, password });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-heading tracking-tight text-slate-300">Sign up</h1>
          <p className="text-slate-400">Create an account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Enter your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 bg-slate-700 border-slate-600 text-slate-300 placeholder:text-slate-500 focus-visible:ring-primary"
            />
          </div>

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
                placeholder="Create a password" 
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type={showPassword ? "text" : "password"} 
              placeholder="Confirm your password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 bg-slate-700 border-slate-600 text-slate-300 placeholder:text-slate-500 focus-visible:ring-primary"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating account..." : "Create account"}
          </Button>

          <div className="text-center text-sm text-slate-400 mt-4">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-green-400 hover:text-green-500 hover:underline cursor-pointer">Log in</span>
            </Link>
          </div>
        </form>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-700/50 mt-6">
          By signing up you agree to our <a href="#" className="underline hover:text-slate-300 transition-colors">Terms of Use</a> and <a href="#" className="underline hover:text-slate-300 transition-colors">Privacy Notice</a>.
        </div>
      </div>
    </div>
  );
}
