"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { LabReportAnalysisResult, LabReportParameter } from "@/types/labReport";
import {
  RefreshCwIcon,
  FileTextIcon,
  DownloadIcon
} from "./icons";
import { exportLabReportToPdf } from "@/lib/pdfExport";

interface Props {
  result: LabReportAnalysisResult;
  previewUrl?: string | null;
  onReset: () => void;
}

export default function LabReportResultView({ result, previewUrl, onReset }: Props) {
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [filter, setFilter] = useState<"all" | "attention" | "optimal">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleExportPdf = () => {
    setIsExportingPdf(true);
    try {
      exportLabReportToPdf(result);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Filter parameters by category / status / search query
  const filteredParameters = useMemo(() => {
    return result.parameters.filter((p) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "attention"
          ? p.status === "attention_required" || p.status === "mild_deviation"
          : p.status === "optimal";

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.testName.toLowerCase().includes(query) ||
        p.commonName.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.laymanExplanation.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [result.parameters, filter, searchTerm]);

  // Ensure currentIndex stays within bounds when filter changes
  useEffect(() => {
    if (currentIndex >= filteredParameters.length) {
      setCurrentIndex(Math.max(0, filteredParameters.length - 1));
    }
  }, [filteredParameters.length, currentIndex]);

  const totalParams = filteredParameters.length;
  const currentParam: LabReportParameter | undefined = filteredParameters[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < totalParams - 1 ? prev + 1 : prev));
  }, [totalParams]);

  // Keyboard navigation for desktop users (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Health Score color palette (high contrast & clear visibility)
  const getScoreTheme = (score: number) => {
    if (score >= 85) {
      return {
        text: "text-emerald-800",
        bg: "bg-emerald-50",
        border: "border-emerald-300",
        badge: "bg-emerald-700 text-white",
        bar: "bg-emerald-600"
      };
    }
    if (score >= 70) {
      return {
        text: "text-blue-900",
        bg: "bg-blue-50",
        border: "border-blue-300",
        badge: "bg-blue-700 text-white",
        bar: "bg-blue-600"
      };
    }
    if (score >= 50) {
      return {
        text: "text-amber-900",
        bg: "bg-amber-50",
        border: "border-amber-300",
        badge: "bg-amber-600 text-white",
        bar: "bg-amber-500"
      };
    }
    return {
      text: "text-rose-950",
      bg: "bg-rose-50",
      border: "border-rose-300",
      badge: "bg-rose-700 text-white",
      bar: "bg-rose-600"
    };
  };

  const scoreTheme = getScoreTheme(result.healthScore.score);

  return (
    <div className="w-full space-y-8">
      {/* ========================================================================= */}
      {/* TOP ACTION BAR (EXACT SAME AS PRESCRIPTION ANALYZER) */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-blue-700"></span>
          <div>
            <h2 className="text-base font-extrabold text-black">
              Pathology Report Analysis Completed
            </h2>
            <p className="text-xs text-slate-600">
              {result.parameters.length} Clinical Parameters Extracted &bull; Health Score: {result.healthScore.score}/100 ({result.healthScore.rating})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {previewUrl && (
            <button
              type="button"
              onClick={() => setShowOriginalImage(!showOriginalImage)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileTextIcon className="w-4 h-4 text-slate-600" />
              <span>{showOriginalImage ? "Hide Report Photo" : "View Original Report"}</span>
            </button>
          )}

          {/* Export PDF Button matching prescription analyzer */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-extrabold hover:bg-blue-800 disabled:opacity-50 flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{isExportingPdf ? "Generating PDF..." : "Export PDF"}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCwIcon className="w-4 h-4 text-slate-600" />
            <span>Scan Another</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLLAPSIBLE ORIGINAL LAB REPORT IMAGE PREVIEW */}
      {/* ========================================================================= */}
      {showOriginalImage && previewUrl && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                Original Scanned Lab Report Slip Photo
              </h3>
              <p className="text-xs text-slate-500">
                Cross-reference the original laboratory report slip with the digitized deciphered parameters below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOriginalImage(false)}
              className="text-xs font-bold text-slate-600 hover:text-black underline cursor-pointer"
            >
              Close Photo Preview
            </button>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Original Uploaded Lab Slip"
              className="max-h-[56vh] object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER CLINICAL DOCUMENT CONTAINER */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* ========================================================================= */}
        {/* SECTION 1: LABORATORY RECORD & PATIENT PROFILE */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-200 p-6 sm:p-8 bg-slate-50">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest">
              Section 1: Laboratory Record &amp; Patient Profile
            </span>
            <span className="text-xs font-bold text-slate-500">
              Report Ref #{result.id ? result.id.slice(0, 8) : "LAB-REP"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Diagnostic Laboratory Details */}
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Diagnostic Laboratory
              </span>
              <h3 className="text-2xl font-black text-black tracking-tight">
                {result.patient.labName || "Pathological Diagnostics Center"}
              </h3>
              <p className="text-sm font-bold text-blue-700">
                Clinical Pathology &amp; Bio-Chemical Analysis
              </p>
              <div className="pt-2 text-xs text-slate-600 flex items-center justify-between">
                <span>Date: <strong className="text-black">{result.patient.reportDate}</strong></span>
                <span>Total Parameters: <strong className="text-black">{result.keyFindings.totalTestsCount}</strong></span>
              </div>
            </div>

            {/* Right Column: Patient Profile */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Patient Overview
              </span>
              <div className="flex items-baseline space-x-3">
                <h4 className="text-2xl font-black text-black tracking-tight">
                  {result.patient.name}
                </h4>
                <span className="text-sm font-semibold text-slate-600">
                  ({result.patient.age || "Age not specified"}, {result.patient.gender || "Gender not specified"})
                </span>
              </div>

              {/* Status Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                    Overall Health Index
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-700 text-white">
                    {result.healthScore.rating}
                  </span>
                </div>
                <p className="text-sm font-bold text-blue-950 leading-snug pt-1">
                  Average Score: {result.healthScore.score} / 100
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: HEALTH SCORE & KEY FINDINGS */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-200 p-6 sm:p-8 bg-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
                Section 2: Health Score Index &amp; Tally
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-black">
                Personalized Health Score: {result.healthScore.score} / 100
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                {result.healthScore.summary}
              </p>
            </div>

            {/* Big Health Gauge Badge */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 min-w-[160px]">
              <div className={`text-4xl sm:text-5xl font-black ${scoreTheme.text} leading-none`}>
                {result.healthScore.score}
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                Health Index
              </span>
              <div className="w-28 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${scoreTheme.bar}`}
                  style={{ width: `${result.healthScore.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider block">
                Total Parameters
              </span>
              <span className="text-2xl font-black text-black mt-1 block">
                {result.keyFindings.totalTestsCount}
              </span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-300">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                Optimal (Normal)
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {result.keyFindings.normalCount}
              </span>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-300">
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
                Mild Deviations
              </span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {result.keyFindings.deviatedCount}
              </span>
            </div>

            <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-300">
              <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider block">
                Needs Attention
              </span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {result.keyFindings.criticalCount}
              </span>
            </div>
          </div>

          {/* Critical Priority Items Banner */}
          {result.criticalAlerts && result.criticalAlerts.length > 0 && (
            <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-rose-950 font-black text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>Priority Attention Items (Discuss with Your Physician)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm font-semibold text-rose-900 pl-1">
                {result.criticalAlerts.map((alert, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: PARAMETER CAROUSEL SHOWCASE (LARGE FONTS, HIGH CONTRAST, ZERO EMOJIS) */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-200 p-6 sm:p-8 bg-white space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
                Section 3: Parameter Carousel Analysis
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-black">
                Interactive Parameter Breakdown
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Browse each parameter one-by-one with layman explanations and demographic standard comparisons.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-300">
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    filter === "all"
                      ? "bg-white text-black shadow-xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  All ({result.parameters.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("attention");
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    filter === "attention"
                      ? "bg-white text-rose-700 shadow-xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Out of Range ({result.keyFindings.deviatedCount + result.keyFindings.criticalCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("optimal");
                    setCurrentIndex(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    filter === "optimal"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Normal ({result.keyFindings.normalCount})
                </button>
              </div>

              <input
                type="text"
                placeholder="Search parameter..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentIndex(0);
                }}
                className="px-3.5 py-1.5 rounded-xl border-2 border-slate-300 text-xs text-black placeholder-slate-400 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>

          {/* Carousel Control Bar & Progress */}
          {totalParams > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="px-3.5 py-1 rounded-lg bg-blue-700 text-white text-xs font-black uppercase tracking-wider">
                    Parameter {currentIndex + 1} of {totalParams}
                  </span>
                  <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                    Use Previous / Next buttons or keyboard &larr; &rarr; arrows to browse
                  </span>
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === totalParams - 1}
                    className="px-4 py-2 rounded-xl bg-blue-700 font-extrabold text-xs text-white hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <span>Next</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-700 transition-all duration-300 ease-out"
                  style={{ width: `${((currentIndex + 1) / totalParams) * 100}%` }}
                />
              </div>

              {/* Direct Jump To Parameter Selector (No Horizontal Scrolling) */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <label htmlFor="param-selector" className="text-xs font-black uppercase tracking-wider text-slate-700 shrink-0">
                    Jump To:
                  </label>
                  <div className="relative">
                    <select
                      id="param-selector"
                      value={currentIndex}
                      onChange={(e) => setCurrentIndex(Number(e.target.value))}
                      className="px-3.5 py-1.5 pr-8 rounded-xl border-2 border-slate-300 font-extrabold text-xs text-black bg-white hover:border-blue-600 focus:outline-none focus:border-blue-700 shadow-2xs cursor-pointer appearance-none max-w-[260px] sm:max-w-[340px] truncate"
                    >
                      {filteredParameters.map((p, idx) => (
                        <option key={p.id || idx} value={idx}>
                          #{idx + 1}. {p.commonName} ({p.statusLabel})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Compact Numbered Jump Chips (Wrap naturally, zero scrolling) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {filteredParameters.map((p, idx) => {
                    const isActive = idx === currentIndex;
                    const isOpt = p.status === "optimal";
                    const isMild = p.status === "mild_deviation";
                    const dotBg = isOpt ? "bg-emerald-500" : isMild ? "bg-amber-500" : "bg-rose-500";

                    return (
                      <button
                        key={p.id || idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        title={`#${idx + 1} ${p.commonName} (${p.statusLabel})`}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center relative cursor-pointer ${
                          isActive
                            ? "bg-blue-700 text-white shadow-xs scale-105"
                            : "bg-white text-slate-700 border border-slate-300 hover:border-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <span>{idx + 1}</span>
                        <span
                          className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${dotBg}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Carousel Slide Card */}
          {totalParams === 0 ? (
            <div className="p-12 text-center bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-600 text-sm font-bold">
              No test parameters match your selected filter or search query.
            </div>
          ) : (
            currentParam && (
              <CarouselSlideCard
                param={currentParam}
                patientAge={result.patient.age}
                patientGender={result.patient.gender}
                onPrev={handlePrev}
                onNext={handleNext}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex < totalParams - 1}
                currentIndex={currentIndex}
                totalParams={totalParams}
              />
            )
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: CLINICAL GUIDANCE & QUESTIONS FOR DOCTOR */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 bg-slate-50 space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
              Section 4: Clinical Consultation Guidance
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-black">
              Daily Lifestyle Habits &amp; Questions for Your Physician
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lifestyle & Dietary Guidance */}
            <div className="p-6 bg-white border-2 border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h4 className="text-sm font-black uppercase tracking-wider text-black">
                  Everyday Lifestyle &amp; Dietary Guidance
                </h4>
              </div>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-800">
                {result.lifestyleRecommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start space-x-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
                    <span className="leading-relaxed font-medium">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions to Ask Doctor */}
            <div className="p-6 bg-white border-2 border-slate-200 rounded-2xl space-y-4 shadow-2xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                <h4 className="text-sm font-black uppercase tracking-wider text-black">
                  Questions to Ask Your Doctor
                </h4>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Take these targeted questions to your next clinical consultation:
              </p>
              <ul className="space-y-2.5 text-sm sm:text-base text-slate-800">
                {result.doctorDiscussionQuestions.map((q, qIdx) => (
                  <li key={qIdx} className="flex items-start space-x-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-black text-xs shrink-0 mt-0.5">
                      Q{qIdx + 1}
                    </span>
                    <span className="leading-relaxed font-semibold text-black">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// CAROUSEL SLIDE CARD COMPONENT (LARGE FONTS, HIGH CONTRAST, ZERO EMOJIS)
// =========================================================================
interface CarouselSlideCardProps {
  param: LabReportParameter;
  patientAge?: string;
  patientGender?: string;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalParams: number;
}

function CarouselSlideCard({
  param,
  patientAge,
  patientGender,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalParams
}: CarouselSlideCardProps) {
  const isOptimal = param.status === "optimal";
  const isMild = param.status === "mild_deviation";

  // High-contrast, vibrant visual themes
  const theme = isOptimal
    ? {
        cardBorder: "border-emerald-300",
        badgeBg: "bg-emerald-700",
        badgeText: "text-white",
        accentBg: "bg-emerald-50/70",
        accentBorder: "border-emerald-200",
        statusText: "Optimal Standard"
      }
    : isMild
    ? {
        cardBorder: "border-amber-400",
        badgeBg: "bg-amber-600",
        badgeText: "text-white",
        accentBg: "bg-amber-50/70",
        accentBorder: "border-amber-200",
        statusText: "Mild Deviation"
      }
    : {
        cardBorder: "border-rose-400",
        badgeBg: "bg-rose-700",
        badgeText: "text-white",
        accentBg: "bg-rose-50/70",
        accentBorder: "border-rose-200",
        statusText: "Requires Attention"
      };

  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl border-2 ${theme.cardBorder} bg-white shadow-xs space-y-6 transition-all`}
    >
      {/* 1. SLIDE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b-2 border-slate-100">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center space-x-2">
            <span className="text-xs font-extrabold text-blue-800 uppercase tracking-widest bg-blue-100 border border-blue-200 px-3 py-0.5 rounded-full">
              {param.category}
            </span>
            <span className="text-xs font-bold text-slate-500">
              Parameter #{currentIndex + 1}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            {param.commonName}
          </h2>
          <p className="text-sm sm:text-base font-bold text-slate-600">
            Laboratory Technical Term: <span className="text-black font-extrabold">{param.testName}</span>
          </p>
        </div>

        {/* High-Contrast Status Pill */}
        <div className="flex flex-col items-end">
          <span
            className={`px-4 py-2 rounded-xl text-sm sm:text-base font-black uppercase tracking-wider shadow-xs ${theme.badgeBg} ${theme.badgeText}`}
          >
            {param.statusLabel}
          </span>
          <span className="text-xs font-bold text-slate-500 mt-1">
            Status: {theme.statusText}
          </span>
        </div>
      </div>

      {/* 2. MAIN READING CALLOUT */}
      <div className={`p-6 rounded-2xl border-2 ${theme.accentBorder} ${theme.accentBg} space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Observed Value */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600 block">
              Observed Test Result:
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl sm:text-5xl font-black text-black tracking-tight">
                {param.observedValue}
              </span>
              <span className="text-lg sm:text-xl font-bold text-slate-700">
                {param.unit}
              </span>
            </div>
          </div>

          {/* Reference Range */}
          <div className="p-4 bg-white rounded-xl border border-slate-300 space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Standard Clinical Range:
            </span>
            <span className="text-xl sm:text-2xl font-black text-black block">
              {param.referenceStandards.standardRange}
            </span>
            <span className="text-xs font-semibold text-slate-600 block">
              Standard reference range for healthy adult evaluation
            </span>
          </div>
        </div>
      </div>

      {/* 3. EXPLANATION: What This Test Measures & What It Portrays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What This Test Measures */}
        <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
              Educational
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              What This Test Actually Measures
            </h4>
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium pt-1">
            {param.laymanExplanation}
          </p>
        </div>

        {/* What This Portrays About Your Health */}
        <div className="p-5 bg-blue-50/70 border-2 border-blue-200 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-700 text-white text-xs font-black uppercase tracking-wider">
              Clinical Insight
            </span>
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              What This Portrays About Your Health
            </h4>
          </div>
          <p className="text-sm sm:text-base text-slate-900 leading-relaxed font-semibold pt-1">
            {param.whatItPortrays}
          </p>
        </div>
      </div>

      {/* 4. REFERENCE STANDARDS: Age & Gender Comparison Guide */}
      <div className="space-y-4 pt-1">
        <div>
          <h4 className="text-base sm:text-lg font-black text-black tracking-tight">
            Demographic Reference Standards (Tally With Your Age &amp; Gender)
          </h4>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            Standard laboratory ranges vary according to biological sex and age brackets.
          </p>
        </div>

        {/* Gender Breakdown (Male vs Female) */}
        {param.referenceStandards.genderStandards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-blue-200 space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 block">
                Men (Male Standard Range)
              </span>
              <span className="text-lg sm:text-xl font-black text-black block">
                {param.referenceStandards.genderStandards.male}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Standard clinical range for adult males
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border-2 border-purple-200 space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 block">
                Women (Female Standard Range)
              </span>
              <span className="text-lg sm:text-xl font-black text-black block">
                {param.referenceStandards.genderStandards.female}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Standard clinical range for non-pregnant adult females
              </span>
            </div>
          </div>
        )}

        {/* Age Group Breakdown Table */}
        {param.referenceStandards.ageStandards && param.referenceStandards.ageStandards.length > 0 && (
          <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Age Group Reference Standards Table
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Age Bracket</th>
                    <th className="py-2.5 px-4 text-right">Standard Range Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {param.referenceStandards.ageStandards.map((ageStd, aIdx) => (
                    <tr key={aIdx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 text-slate-800 font-bold">{ageStd.ageGroup}</td>
                      <td className="py-2.5 px-4 text-right font-black text-black">
                        {ageStd.range}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Regional / Location Reference Note */}
        {param.referenceStandards.regionOrLocationNote && (
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 flex items-start space-x-2">
            <span className="px-2 py-0.5 rounded bg-slate-300 text-slate-800 font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              Region Note
            </span>
            <span className="leading-relaxed">
              {param.referenceStandards.regionOrLocationNote}
            </span>
          </div>
        )}
      </div>

      {/* 5. ACTIONABLE GUIDANCE & TIP FOOTER */}
      {param.actionableTip && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-black space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-xs font-black uppercase tracking-wider">
              Guidance
            </span>
            <h5 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              Actionable Health &amp; Lifestyle Tip
            </h5>
          </div>
          <p className="text-sm sm:text-base font-medium text-emerald-950 leading-relaxed pt-1">
            {param.actionableTip}
          </p>
        </div>
      )}

      {/* 6. BOTTOM CAROUSEL FOOTER BUTTONS */}
      <div className="pt-4 border-t-2 border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          className="px-5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-black text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Previous Parameter</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Parameter {currentIndex + 1} of {totalParams}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className="px-5 py-2.5 rounded-xl bg-blue-700 font-black text-sm text-white hover:bg-blue-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5 shadow-xs cursor-pointer"
        >
          <span>Next Parameter</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
