/**
 * Magic Link Verify Page
 * Automatically verifies magic link and logs user in
 */

import { LogoIcon } from "@/components/icons/logo-icon";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import * as authUtils from "@/lib/auth-utils";
import { verifyMagicLink } from "@/services/auth.service";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function VerifyMagicLinkPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

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
      const response = await verifyMagicLink(token!);

      // Save tokens to localStorage
      if (response.data.accessToken) {
        authUtils.setAccessToken(response.data.accessToken);
      }
      if (response.data.refreshToken) {
        authUtils.setRefreshToken(response.data.refreshToken);
      }

      setIsSuccess(true);
      toast.success("Logged in successfully!");

      // Redirect to dashboard - the ProtectedRoute will handle auth check
      // and AuthContext will load user from the saved token
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid or expired magic link";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
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
              Magic Link Verification
            </h1>
          </div>
        </div>

        {/* Verifying State */}
        {isVerifying && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader size="lg" text="Verifying your magic link..." />
          </div>
        )}

        {/* Error State */}
        {!isVerifying && error && !isSuccess && (
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
            <Button onClick={() => navigate("/magic-link")}>
              Request New Magic Link
            </Button>
          </div>
        )}

        {/* Success State */}
        {!isVerifying && isSuccess && !error && (
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium text-green-600">Success!</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
