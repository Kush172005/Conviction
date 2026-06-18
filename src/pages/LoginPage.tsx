import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { CredentialResponse } from "@react-oauth/google";
import { ArrowRight, ArrowLeft, Shield, AlertCircle } from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { RtpGlobalBadge } from "@/components/RtpGlobalBranding";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { useAuthStore, useOnboardingStore } from "@/store";
import { authApi, mapBackendUser } from "@/services/api/auth";
import { wakeServer } from "@/services/api/client";
import { getFriendlyApiError } from "@/lib/apiErrors";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState("");

  // Wake Render before the user clicks sign-in (cold start can take ~60s)
  useEffect(() => {
    wakeServer().catch(() => {});
  }, []);

  // Already logged in — redirect appropriately
  useEffect(() => {
    if (isAuthenticated && user) {
      const isDemo = useAuthStore.getState().isDemo;
      if (isDemo || user.onboardingCompleted) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  async function completeRealLogin(
    token: string,
    onboardingCompleted: boolean
  ) {
    useAuthStore.setState({ token, isAuthenticated: true });
    const backendUser = await authApi.getMe();
    login(mapBackendUser(backendUser), token, false);

    if (!onboardingCompleted) {
      const { currentStep } = useOnboardingStore.getState();
      if (currentStep >= 2) useOnboardingStore.getState().reset();
      navigate("/onboarding", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      setError("Google did not return a valid credential. Please try again.");
      return;
    }
    setIsGoogleLoading(true);
    setError(null);
    setLoadingHint("");
    const slowTimer = window.setTimeout(
      () => setLoadingHint("The first login may take up to 20–25 seconds while the backend starts. Please keep this tab open."),
      6000
    );
    try {
      const tokenResponse = await authApi.googleLogin(
        credentialResponse.credential
      );
      await completeRealLogin(
        tokenResponse.access_token,
        tokenResponse.onboarding_completed
      );
    } catch (err) {
      setError(
        getFriendlyApiError(
          err,
          "auth",
          "Google sign-in failed. Please try again."
        )
      );
    } finally {
      window.clearTimeout(slowTimer);
      setIsGoogleLoading(false);
      setLoadingHint("");
    }
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    setError(null);
    setLoadingHint("");
    const slowTimer = window.setTimeout(
      () => setLoadingHint("The backend is starting up — almost there…"),
      6000
    );
    try {
      const tokenResponse = await authApi.mockLogin();
      useAuthStore.setState({
        token: tokenResponse.access_token,
        isAuthenticated: true,
      });
      const backendUser = await authApi.getMe();
      // isDemo = true — skip onboarding, go straight to dashboard
      login(mapBackendUser(backendUser), tokenResponse.access_token, true);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        getFriendlyApiError(
          err,
          "demo",
          "Couldn't load the demo workspace. Please try again."
        )
      );
    } finally {
      window.clearTimeout(slowTimer);
      setIsDemoLoading(false);
      setLoadingHint("");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 py-16 sm:py-8 relative overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-conviction-500/6 blur-[120px] pointer-events-none" />

      <Link
        to="/"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground hover:border-border hover:bg-card"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <Link
          to="/"
          className="block text-center mb-8 group rounded-xl p-2 -m-2 transition-colors hover:bg-card/40"
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-conviction mb-4 brand-glow-anim transition-transform group-hover:scale-105">
            <LogoMark className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Conviction</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Never lose the reasoning behind a decision.
          </p>
          <div className="mt-3 flex justify-center">
            <RtpGlobalBadge />
          </div>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">Welcome</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your investment workspace
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google sign-in — new user flow */}
          {GOOGLE_CLIENT_ID ? (
            isGoogleLoading ? (
              <div className="flex flex-col items-center gap-3 py-5 rounded-lg border border-border/60 bg-secondary/20">
                <div className="h-5 w-5 rounded-full border-2 border-conviction-500/20 border-t-conviction-400 animate-spin" />
                <div className="text-center space-y-1.5 px-4">
                  <p className="text-sm font-medium text-foreground">Preparing your workspace…</p>
                  {loadingHint && (
                    <p className="text-xs text-muted-foreground leading-snug max-w-xs mx-auto">
                      {loadingHint}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <GoogleSignInButton
                clientId={GOOGLE_CLIENT_ID}
                disabled={isDemoLoading}
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError(
                    "Google sign-in failed. Make sure http://localhost:5173 is added to Authorized JavaScript origins in Google Cloud Console."
                  )
                }
              />
            )
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400">
              Google OAuth is not configured. Add{" "}
              <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> to your
              frontend <code className="font-mono">.env</code> and restart the
              dev server.
            </div>
          )}

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Demo login */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">
                Explore the demo workspace
              </p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                See the full product with RTP Global's sample deal pipeline — no
                account needed.
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full h-9"
              onClick={handleDemoLogin}
              disabled={isDemoLoading || isGoogleLoading}
            >
              {isDemoLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin flex-shrink-0" />
                  <span className="text-xs truncate">{loadingHint || "Loading demo workspace…"}</span>
                </span>
              ) : (
                <>
                  Load demo workspace
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Your data is encrypted and private.</span>
          </div>
          <p className="text-xs text-muted-foreground">
            New here?{" "}
            <Link
              to="/"
              className="font-medium text-conviction-300 hover:text-conviction-200 transition-colors inline-flex items-center gap-1"
            >
              See how Conviction works
              <ArrowRight className="h-3 w-3" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
