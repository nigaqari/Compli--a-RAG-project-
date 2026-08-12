"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api/auth";
import {
  ShieldCheck, Loader2, AlertCircle, CheckCircle2,
  ArrowLeft, RefreshCw, KeyRound
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupSuccess = searchParams.get("signup_success");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    signupSuccess ? "Account created successfully! Please sign in below." : null
  );

  // Step 1: Submit email & password -> triggers OTP email
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      if (res.status === "otp_required") {
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otpCode);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError(null);
    try {
      await authApi.resendOtp(email);
      setSuccessMessage("A fresh verification code has been dispatched to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      <AnimatePresence mode="wait">
        {step === "credentials" ? (
          <motion.div
            key="step-credentials"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">
                Enter your work credentials to access the Compli dashboard.
              </p>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCredentialSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Work Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="jane@company.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••••••"
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading || !email || !password}
                className="h-11 mt-2 bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying Credentials...</>
                ) : (
                  "Continue to 2FA Verification"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-[var(--brand-red)] hover:underline">
                Sign up
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step-otp"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[var(--brand-red)] font-semibold text-sm">
                <ShieldCheck className="h-5 w-5" /> Two-Factor Authentication
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Enter Verification Code</h1>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit security code to <strong className="text-foreground">{email}</strong>.
              </p>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="otp" className="sr-only">6-Digit Code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="otp" 
                    type="text" 
                    maxLength={6}
                    placeholder="000000" 
                    autoFocus
                    required 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="h-12 pl-11 text-center font-mono text-xl tracking-[0.4em] font-bold"
                  />
                </div>
                <span className="text-xs text-muted-foreground text-center">
                  Code expires in 5 minutes
                </span>
              </div>

              <Button 
                type="submit" 
                disabled={loading || otpCode.length < 6}
                className="h-11 bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying Code...</>
                ) : (
                  "Verify & Enter Dashboard"
                )}
              </Button>
            </form>

            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtpCode(""); setError(null); }}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="inline-flex items-center gap-1 text-[var(--brand-red)] hover:underline font-semibold"
              >
                <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                Resend Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
