import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function EmailVerified() {
  const [, setLocation] = useLocation();

  const handleContinue = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl space-y-6 flex flex-col items-center text-center pt-10">
        
        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2 ring-8 ring-green-500/5">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-heading tracking-tight text-slate-300">Email Verified</h1>
          <p className="text-slate-400 text-lg">
            Your email has been successfully verified.
            <br />
            Click below to log in
          </p>
        </div>

        <Button 
          onClick={handleContinue}
          className="w-full h-12 text-base font-semibold mt-8 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Continue
        </Button>

      </div>
    </div>
  );
}
