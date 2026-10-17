"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { MedicalCrossIcon, FileTextIcon } from "./icons";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/scan", label: "Scan Prescription", icon: FileTextIcon },
    { href: "/reports", label: "Pathology Reports", icon: FileTextIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 h-[5rem] flex items-center shadow-xl">
      <div className="w-[85vw] max-w-[90vw] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 text-black">
          <div className="w-12 h-12 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-xs">
            <MedicalCrossIcon className="w-10 h-10" />
          </div>
          <div>
            <span className="font-extrabold text-3xl text-black  block ">
              MediScan
            </span>
          </div>
        </Link>

        {/* Center / Right Navigation Items */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-700 hover:text-black hover:bg-slate-100"
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Gemma 4 E2B WebGPU Badge */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Gemma 4 E2B WebGPU</span>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Authentication Actions */}
          <div className="flex items-center space-x-2">
            {status === "loading" ? (
              <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-lg" />
            ) : session?.user ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                    pathname === "/auth/signin"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-700 hover:text-black hover:bg-slate-100"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
