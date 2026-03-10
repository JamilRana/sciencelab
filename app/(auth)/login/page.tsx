"use client";

import { useState, useEffect } from "react";
import { signIn, useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Redirect if session exists ---
  useEffect(() => {
    async function checkSession() {
      const session = await getSession(); // fetch current session
      if (session?.user?.role) {
        // Redirect based on role
        if (session.user.role === "ADMIN" || session.user.role === "STAFF") {
          router.replace("/admin-route/dashboard");
        } else if (session.user.role === "TEACHER") {
          router.replace("/teacher-route/dashboard");
        } else if (session.user.role === "STUDENT") {
          router.replace("/student-route/dashboard");
        } else {
          router.replace("/admin-route/dashboard");
        }
      }
    }

    checkSession();
  }, [router]);

  // --- Form submit ---
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password");
      return;
    }

    // Fetch session again after login
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF") {
      router.replace("/admin-route/dashboard");
    } else if (session?.user?.role === "TEACHER") {
      router.replace("/teacher-route/dashboard");
    } else if (session?.user?.role === "STUDENT") {
      router.replace("/student-route/dashboard");
    } else {
      router.replace("/admin-route/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Science Lab Science Lab Coaching Center
        </h1>
        <h2 className="text-xl font-bold text-center mb-6">Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}