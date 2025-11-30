/**
 * Email Verification Page
 * Verifies email and allows user to set password
 */

import { LogoIcon } from "@/components/icons/logo-icon";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { setPassword, verifyEmail } from "@/services/auth.service";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    // Prevent double verification in StrictMode or on re-renders
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      handleVerification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleVerification = async () => {
    try {
      await verifyEmail(token!);
      setIsVerified(true);
      toast.success("Email verified successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsSettingPassword(true);

    try {
      await setPassword({ token: token!, password });
      toast.success("Password set successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to set password";
      toast.error(errorMessage);
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      {/* Background Ripple Effect */}
      <div className="absolute inset-0 [--cell-border-color:hsl(var(--primary)/0.3)] [--cell-fill-color:hsl(var(--primary)/0.15)] [--cell-shadow-color:hsl(var(--primary)/0.4)]">
        <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-4">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <LogoIcon size={32} color="#71abbf" />
            <span className="text-xl font-semibold">Arista ATS</span>
          </Link>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email Verification
            </h1>
            {isVerifying && (
              <p className="text-sm text-muted-foreground">
                Verifying your email...
              </p>
            )}
          </div>
        </div>

        {/* Verifying State */}
        {isVerifying && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader size="lg" text="Please wait..." />
          </div>
        )}

        {/* Error State */}
        {!isVerifying && error && !isVerified && (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-destructive">
                Verification Failed
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </div>
        )}

        {/* Success State with Password Setup */}
        {!isVerifying && isVerified && !error && (
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-green-600">Email Verified!</p>
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to access your account
                </p>
              </div>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>Create Password (Optional)</FieldLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    minLength={8}
                    disabled={isSettingPassword}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    At least 8 characters with uppercase, lowercase, and number
                  </p>
                </Field>

                <Field>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSettingPassword}
                  />
                </Field>
              </FieldGroup>

              <Button
                type="submit"
                className="w-full"
                disabled={isSettingPassword || !password || !confirmPassword}
              >
                {isSettingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  "Set Password & Login"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/magic-link")}
              >
                Use Passwordless Login (Magic Link)
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                With magic link, you'll receive a login link via email each time
                you want to sign in.
              </p>

              <Link
                to="/"
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors pt-2"
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Home
                </span>
              </Link>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
