"use client";

import React, { useState, useEffect } from "react";
import LabReportResultView from "@/components/LabReportResultView";
import GemmaModelSetupGate from "@/components/GemmaModelSetupGate";
import {
  analyzeLabReportWithGemma,
  isGemmaEngineLoaded,
} from "@/lib/gemmaLiteRtEngine";
import { LabReportAnalysisResult } from "@/types/labReport";
import { UploadCloudIcon, CpuIcon } from "@/components/icons";

export default function LabReportsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isModelReady, setIsModelReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(
    "Analyzing Lab Report with Gemma 4 E2B..."
  );
  const [analysisResult, setAnalysisResult] =
    useState<LabReportAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsModelReady(isGemmaEngineLoaded());
  }, []);

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

    if (!isGemmaEngineLoaded()) {
      setErrorMessage(
        "Please download and mount the Gemma 4 E2B model artifact on WebGPU above before analyzing."
      );
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisProgress("Initializing Gemma 4 E2B WebGPU vision pipelines...");

    try {
      // Execute on-device multimodal vision inference using Gemma 4 E2B
      const result = await analyzeLabReportWithGemma(
        selectedFile,
        (progress) => {
          setAnalysisProgress(progress.slice(-160));
        }
      );

      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Lab report analysis failure:", err);
      setErrorMessage(
        err?.message ||
          "Lab report analysis failed with Gemma 4 E2B. Please verify that the image is clear and legible."
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
          {/* Page Title & Geolocation Status */}
          <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black">
                Pathology Lab Report Analyzer
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Powered exclusively by Google Gemma 4 E2B on WebGPU. Translates
                laboratory parameters into plain layman findings, computes your
                personalized health score, and tallies with demographic
                reference standards.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 self-start">
              Model: Gemma 4 E2B (WebGPU)
            </span>
          </div>

          {/* STEP 1: GEMMA 4 E2B MODEL SETUP GATE (Download -> Select -> Render on WebGPU) */}
          <GemmaModelSetupGate
            onModelReady={() => setIsModelReady(true)}
            title="Step 1: Download & Mount Gemma 4 E2B on WebGPU"
            description="Download the Gemma 4 E2B model binary from our website, then select the file from your local storage. MediScan mounts it directly into your local WebGPU memory for hardware-accelerated vision deciphering."
          />

          {/* STEP 2: LAB REPORT UPLOAD & VISION SCANNER CARD */}
          <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-lg bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-base sm:text-lg font-black text-black">
                Upload Lab Report Photo for Gemma 4 E2B Vision Analysis
              </h2>
            </div>

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
                        className="text-xs font-bold text-slate-600 hover:text-black underline shrink-0 cursor-pointer"
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
                      Gemma 4 E2B vision extraction.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-medium rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {isAnalyzing && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-mono truncate">
                    {analysisProgress}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing || !selectedFile}
                  className="w-full py-4 px-6 rounded-xl bg-blue-700 text-white font-extrabold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Deciphering with Gemma 4 E2B Vision...</span>
                    </span>
                  ) : (
                    <>
                      <CpuIcon className="w-4 h-4" />
                      <span>Analyze Pathology Report with Gemma 4 E2B</span>
                    </>
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
                Gemma 4 E2B deciphers complex laboratory markers into plain,
                understandable concepts.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                2. Health Score Index
              </h3>
              <p className="text-xs text-slate-600">
                Calculates a personalized 0 to 100 average health score based on
                your test parameters.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                3. On-Device WebGPU Privacy
              </h3>
              <p className="text-xs text-slate-600">
                Your medical reports are processed locally with Gemma 4 E2B on
                your GPU with zero data sharing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
