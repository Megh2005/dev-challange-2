"use client";

import React, { useState, useEffect } from "react";
import LabReportResultView from "@/components/LabReportResultView";
import { LabReportAnalysisResult } from "@/types/labReport";
import { UploadCloudIcon } from "@/components/icons";

export default function LabReportsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(
    "Analyzing Lab Report...",
  );
  const [analysisResult, setAnalysisResult] =
    useState<LabReportAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setErrorMessage(null);
    }
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage(null);
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select or drop a lab report image to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisProgress("Extracting laboratory readings & patient profile...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const progressTimer1 = setTimeout(() => {
        setAnalysisProgress(
          "Translating medical parameters into plain layman terms...",
        );
      }, 3500);

      const progressTimer2 = setTimeout(() => {
        setAnalysisProgress(
          "Computing average health score & demographic standards...",
        );
      }, 7000);

      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        body: formData,
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      const resData = await response.json();

      if (resData.success && resData.data) {
        setAnalysisResult(resData.data);
      } else {
        if (response.status === 401) {
          window.location.href =
            "/auth/signin?callbackUrl=/reports&error=SessionRequired";
          return;
        }
        setErrorMessage(
          resData.error ||
            "Lab report analysis failed. Please verify that the image is clear and legible.",
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Lab report analysis failed. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-[80vw] mx-auto py-8 bg-white text-black min-h-[92vh]">
      {/* If results are displayed, show the revamped full result view directly */}
      {analysisResult ? (
        <LabReportResultView
          result={analysisResult}
          previewUrl={previewUrl}
          onReset={handleClearFile}
        />
      ) : (
        /* If no result yet, show the streamlined upload & scan interface */
        <div className="space-y-6">
          {/* Page Title */}
          <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black ">
                Pathology Lab Report Analyzer
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Upload a lab report photo to automatically decode medical
                shorthand, calculate your personalized health score, and tally
                findings with demographic reference standards.
              </p>
            </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* File Picker Dropzone */}
              <div className="md:col-span-7">
                <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-2xl p-8 sm:p-12 text-center bg-slate-50 transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <UploadCloudIcon className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-black">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to select or drag & drop lab report image"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports high-resolution JPG, PNG, and WEBP medical
                      laboratory report slips
                    </p>
                  </div>
                </div>
              </div>

              {/* Action & Preview Summary */}
              <div className="md:col-span-5 space-y-4">
                {selectedFile && previewUrl ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="truncate pr-2">
                        <p className="text-sm font-bold text-black truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="text-xs font-bold text-slate-600 hover:text-black underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="h-36 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Lab report preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                    <p className="text-sm font-bold text-black">
                      No lab report selected
                    </p>
                    <p className="text-xs text-slate-500">
                      Select or drop your lab report file on the left to begin
                      automatic clinical extraction.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-medium rounded-xl">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !selectedFile}
                  className="w-full py-4 px-6 rounded-xl bg-blue-700 text-white font-extrabold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>{analysisProgress}</span>
                    </span>
                  ) : (
                    "Analyze Lab Report"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick instructions / features card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                1. Layman Translation
              </h3>
              <p className="text-xs text-slate-600">
                Converts complex clinical lab shorthand and test abbreviations
                into plain layman terms.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                2. Average Health Score
              </h3>
              <p className="text-xs text-slate-600">
                Computes an intelligent average health index from 1-100 across
                all verified parameters.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                3. Demographic Standards
              </h3>
              <p className="text-xs text-slate-600">
                Provides standard clinical reference values broken down across
                age brackets and gender.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
