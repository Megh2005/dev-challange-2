"use client";

import React from "react";
import Link from "next/link";
import { FileTextIcon, ArrowRightIcon } from "@/components/icons";

export default function HomePage() {
  const coreHighlights = [
    {
      title: "Plain-Language Timing",
      desc: "Translates doctor shorthand like OD, BD, TDS, and PC into everyday instructions like 'Take twice a day after meals'."
    },
    {
      title: "Active Chemical Composition",
      desc: "Identifies the exact active chemical ingredients, what condition the medicine is for, and key safety rules."
    },
    {
      title: "Diagnostic Lab Tests",
      desc: "Detects recommended blood, urine, or imaging investigations with clinical purpose and fasting preparation rules."
    }
  ];

  return (
    <div className="w-full bg-white text-black h-[92vh] flex items-center justify-center">
      <main className="w-[80vw] mx-auto text-center flex flex-col items-center justify-center">
        {/* Category Tag */}
        <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-full mb-6">
          Prescription OCR &amp; Medical Translation
        </span>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight max-w-3xl">
          Clear, Understandable Prescription Information for Everyone
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mt-4 leading-relaxed">
          Upload any doctor&apos;s prescription. Instantly translate complex medical shorthand into plain daily schedules, identify active chemical ingredients, and review ordered diagnostic tests with total clarity.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-8">
          <Link
            href="/scan"
            className="px-8 py-4 rounded-xl bg-blue-700 text-white font-bold text-base hover:bg-blue-800 transition-colors inline-flex items-center space-x-2"
          >
            <FileTextIcon className="w-5 h-5" />
            <span>Scan Prescription Now</span>
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {/* 3 Core Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-[80vw] mt-12 text-left">
          {coreHighlights.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-600 transition-colors"
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