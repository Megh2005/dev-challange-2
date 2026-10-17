"use client";

import React, { useState, useMemo, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Country } from "country-state-city";
import { MedicalCrossIcon } from "@/components/icons";

function SignUpContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("India");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allCountries = useMemo(() => {
    try {
      const countries = Country.getAllCountries();
      return countries.sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [{ name: "India", isoCode: "IN" }];
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      setIsLoading(false);
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Register new user in MongoDB
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          country
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      // 2. Automatically log the user in
      const signInRes = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false
      });

      if (signInRes?.ok) {
        window.location.href = "/scan";
      } else {
        // Fallback to sign in page with success banner
        window.location.href = "/auth/signin?registered=true";
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Registration failed. Please try again."
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
            Create Your Account
          </h1>
          <p className="text-xs text-slate-600">
            Sign up to unlock clinical prescription analysis, regimen schedules, and pharmacy shopping.
          </p>
        </div>

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
              Full Name
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-sm text-black placeholder-slate-400 bg-white"
            />
          </div>

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
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
              Country of Residence
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-sm text-black bg-white cursor-pointer"
            >
              {allCountries.map((c) => (
                <option key={c.isoCode} value={c.name}>
                  {c.name} ({c.isoCode})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-700 text-white font-extrabold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {isLoading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-200 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-bold text-blue-700 hover:text-blue-900 underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center bg-slate-50">
          <div className="text-sm font-semibold text-slate-500">Loading registration...</div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
