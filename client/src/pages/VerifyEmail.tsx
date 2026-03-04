import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const emailParams = new URLSearchParams(window.location.search).get("email");
  const email = emailParams || "hector@goperla.com";
  
  const toast = useToast();
  const verifyMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: () => {
      setLocation("/email-verified");
    },
    onError: (error: any) => {
      toast.error("Error al verificar código", error.message || "Código inválido");
    }
  });

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(106); // 1:46 in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = () => {
    if (otp.length === 6 && email) {
      verifyMutation.mutate({ email, code: otp });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl space-y-8 text-center sm:text-left">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading tracking-tight text-slate-300">Check your email</h1>
          <p className="text-slate-400 text-lg">
            We sent a verification link to<br/>
            <span className="font-medium text-slate-300">{email}</span>
          </p>
        </div>

        <div className="flex justify-center sm:justify-start">
          <InputOTP 
             maxLength={6} 
             value={otp}
             onChange={(val) => setOtp(val)}
             containerClassName="gap-2"
          >
            <InputOTPGroup className="gap-2">
              <InputOTPSlot index={0} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
              <InputOTPSlot index={1} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
              <InputOTPSlot index={2} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
              <InputOTPSlot index={3} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
              <InputOTPSlot index={4} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
              <InputOTPSlot index={5} className="w-14 h-16 text-2xl bg-slate-700 border-slate-600 text-slate-300 focus-visible:ring-primary" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
           onClick={handleVerify}
           disabled={otp.length !== 6 || verifyMutation.isPending}
           variant="secondary"
           className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-500"
        >
          {verifyMutation.isPending ? "Verifying..." : "Verify code"}
        </Button>

        <div className="text-center pt-8">
          <p className="text-slate-400">
            Resend verification code in <span className="text-slate-300 font-medium">{formatTime(timeLeft)}</span>
          </p>
        </div>

        <div className="text-center text-sm text-slate-500 pt-4 border-t border-slate-700/50 mt-6 mx-auto sm:max-w-xs">
          By signing in you agree to our <a href="#" className="underline hover:text-slate-300 transition-colors">Terms of Use</a>, <a href="#" className="underline hover:text-slate-300 transition-colors">SMS Consent</a> and <a href="#" className="underline hover:text-slate-300 transition-colors">Privacy Notice</a>.
        </div>
      </div>
    </div>
  );
}
