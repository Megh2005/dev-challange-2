"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MedicalCrossIcon, FileTextIcon } from "./icons";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/scan", label: "Scan Prescription", icon: FileTextIcon }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 h-16 flex items-center">
      <div className="w-[80vw] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 text-black">
          <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white">
            <MedicalCrossIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-black tracking-tight block leading-tight">
              MediScan
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Clinical Prescription Intelligence
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex items-center space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2 ${
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
      </div>
    </header>
  );
}
