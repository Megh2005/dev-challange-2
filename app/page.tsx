"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileTextIcon, ArrowRightIcon } from "@/components/icons";

export default function HomePage() {
  const { data: session } = useSession();

  const coreHighlights = [
    {
      title: "Plain-Language Timing",
      desc: "Translates doctor shorthand like OD, BD, TDS, and PC into everyday instructions like 'Take twice a day after meals'.",
    },
    {
      title: "Active Chemical Composition",
      desc: "Identifies the exact active chemical ingredients, what condition the medicine is for, and key safety rules.",
    },
    {
      title: "Diagnostic Lab Tests",
      desc: "Detects recommended blood, urine, or imaging investigations with clinical purpose and fasting preparation rules.",
    },
    {
      title: "Pathology Health Score",
      desc: "Upload blood reports to compute an average health score and decode parameters with age and gender standards.",
    },
  ];

  return (
    <div className="w-full bg-white text-black min-h-[90vh] py-12 flex items-center justify-center">
      <main className="w-[85vw] max-w-[80vw] mx-auto text-center flex flex-col items-center justify-center">
        {/* Category Tag */}
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full mb-6">
          Prescription OCR &amp; Medical Translation
        </span>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black   max-w-3xl">
          Clear &amp; Understandable Medical Information for Everyone
        </h1>

       

        {/* Primary Call to Action */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/scan"
            className="px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-base hover:bg-blue-800 transition-colors inline-flex items-center space-x-2 shadow-sm"
          >
            <FileTextIcon className="w-5 h-5" />
            <span>
              {session?.user
                ? "Go to Prescription Scanner"
                : "Scan Prescription Now"}
            </span>
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/reports"
            className="px-6 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-base transition-colors inline-flex items-center space-x-2 border border-slate-300"
          >
            <FileTextIcon className="w-5 h-5 text-blue-700" />
            <span>Analyze Pathology Report</span>
          </Link>

          {!session?.user && (
            <Link
              href="/auth/signup"
              className="px-6 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base transition-colors inline-flex items-center space-x-1 border border-slate-200"
            >
              <span>Create Account</span>
            </Link>
          )}
        </div>

        {/* 4 Core Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-12 text-left">
          {coreHighlights.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-600 transition-colors shadow-xs"
            >
              <h2 className="text-base font-bold text-black mb-1.5">
                {item.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
