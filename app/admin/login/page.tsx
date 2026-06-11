"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // auto-redirect if already logged in
  useEffect(() => {
    try {
      const logged = localStorage.getItem("adminLoggedIn");
      if (logged === "true") {
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from") ?? "/dashboard";
        router.replace(from);
      }
    } catch {
      // ignore (server rendering won't run this)
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response data:", data.token);

      if (data && data.token) {
        if (data.token) localStorage.setItem("adminToken", data.token);
        const adminEmail = data?.admin?.email ?? data?.email ?? "";
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminEmail", adminEmail);
        // redirect to original "from" path if provided
        const params = new URLSearchParams(window.location.search);
        const from = params.get("from") ?? "/dashboard";
        // Navigate first, then dispatch event after a brief delay to ensure navbar re-renders
        router.replace(from);
        // Dispatch custom event to notify navbar after navigation
        setTimeout(() => {
          window.dispatchEvent(new Event("authChange"));
        }, 100);
      } else {
        setError(data?.message || data?.error || "Invalid email or password");
      }
    } catch {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              <p className="font-medium text-slate-700 mb-2">
                Demo Admin Credentials
              </p>

              <div className="space-y-1 text-slate-600">
                <p>
                  <span className="font-medium">Email:</span> admin@school.com
                </p>
                <p>
                  <span className="font-medium">Password:</span> admin123
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
