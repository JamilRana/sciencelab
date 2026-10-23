"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import Image from "next/image";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

function getRedirectUrl(role?: string, callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") && callbackUrl !== "/login") {
    if (role === "ADMIN" || role === "STAFF") {
      if (callbackUrl.startsWith("/admin-route")) return callbackUrl;
    } else if (role === "TEACHER") {
      if (callbackUrl.startsWith("/teacher-route")) return callbackUrl;
    } else if (role === "STUDENT") {
      if (callbackUrl.startsWith("/student-route")) return callbackUrl;
    }
  }

  if (role === "TEACHER") return "/teacher-route/dashboard";
  if (role === "STUDENT") return "/student-route/dashboard";
  return "/admin-route/dashboard";
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- Redirect if session already exists ---
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await getSession();
        if (session?.user) {
          setRedirecting(true);
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get("callbackUrl");
          const target = getRedirectUrl(session.user.role, callbackUrl);
          window.location.replace(target);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    }

    checkSession();
  }, []);

  // --- Form submit ---
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setRedirecting(false);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;

    if (!username || !password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Keep button in loading/redirecting state to indicate progress
      setRedirecting(true);

      // Determine user role for redirection
      let role: string | undefined;
      try {
        const session = await getSession();
        role = session?.user?.role;
      } catch {
        // Fallback
      }

      if (!role) {
        try {
          const sessionRes = await fetch(`/api/auth/session?_t=${Date.now()}`, {
            cache: "no-store",
          });
          if (sessionRes.ok) {
            const sessionData = await sessionRes.json();
            role = sessionData?.user?.role;
          }
        } catch {
          // Default role will be used
        }
      }

      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl");
      const target = getRedirectUrl(role, callbackUrl);

      // Full browser navigation avoids Next.js App Router client cache desync
      window.location.replace(target);
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
      setRedirecting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo1.png"
            alt="Science Lab"
            width={240}
            height={62}
            className="h-14 w-auto object-contain mb-2"
            priority
          />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Coaching Center Portal
          </p>
        </div>
        <h2 className="text-base font-bold text-center text-zinc-800 mb-6">
          Sign In to Your Account
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              disabled={loading || redirecting}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                disabled={loading || redirecting}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-zinc-100 disabled:text-zinc-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading || redirecting}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 focus:outline-none disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || redirecting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {redirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
