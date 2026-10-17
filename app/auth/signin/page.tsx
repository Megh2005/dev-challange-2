"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MedicalCrossIcon } from "@/components/icons";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/scan";
  const errorParam = searchParams.get("error");
  const registeredParam = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (registeredParam === "true") {
      setSuccessMessage("Account created successfully! Please sign in below.");
    }
  }, [registeredParam]);

  useEffect(() => {
    if (errorParam) {
      if (errorParam === "CredentialsSignin") {
        setErrorMessage("Invalid email or password. Please check your credentials.");
      } else if (errorParam === "SessionRequired") {
        setErrorMessage("Please sign in to access that page.");
      } else {
        setErrorMessage("Authentication failed. Please try again.");
      }
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false
      });

      if (!res?.ok || res.error) {
        if (res?.error === "CredentialsSignin") {
          setErrorMessage("Invalid email or password. Please verify your credentials.");
        } else {
          setErrorMessage(res?.error || "Failed to sign in. Please try again.");
        }
        setIsLoading(false);
      } else {
        // Direct window navigation guarantees session cookies are sent to middleware
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl border-2 border-slate-200 shadow-sm">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white">
              <MedicalCrossIcon className="w-4 h-4" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-blue-700">
              MediScan Auth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-slate-600">
            Access prescription deciphering, routine timetables, and pharmacy price checks.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-semibold rounded-xl flex items-start space-x-2">
            <svg className="w-4 h-4 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-sm text-black placeholder-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-sm text-black placeholder-slate-400 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-black px-1.5 py-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-700 text-white font-extrabold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {isLoading ? "Signing In..." : "Sign In to MediScan"}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/auth/signup"
              className="font-bold text-blue-700 hover:text-blue-900 underline ml-1"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50">
          <div className="text-sm font-semibold text-slate-500">Loading sign in...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
