"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  initGemmaEngine,
  isGemmaEngineLoaded,
  checkWebGpuSupport,
} from "@/lib/gemmaLiteRtEngine";
import { GEMMA_MODEL_CONFIG } from "@/types/gemma";
import {
  CpuIcon,
  DownloadIcon,
  HardDriveIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "./icons";

interface Props {
  onModelReady?: () => void;
  title?: string;
  description?: string;
}

export default function GemmaModelSetupGate({
  onModelReady,
  title = "Step 1: Mount Google Gemma Model on WebGPU",
  description = "Download the official Gemma model artifact to your device, then load it manually from your local disk. Once initialized on WebGPU, MediScan unlocks on-device vision analysis and private clinical deciphering.",
}: Props) {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webGpuInfo, setWebGpuInfo] = useState<{
    supported: boolean;
    message: string;
  }>({ supported: true, message: "Detecting WebGPU hardware..." });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkWebGpuSupport().then((res) => {
      setWebGpuInfo(res);
    });

    if (isGemmaEngineLoaded()) {
      setIsEngineReady(true);
      if (onModelReady) onModelReady();
    }
  }, [onModelReady]);

  // Handle manual file selection from user's hard drive
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await initGemmaEngine(file);
      setIsEngineReady(true);
      setLoadedFileName(file.name);
      if (onModelReady) onModelReady();
    } catch (err: any) {
      console.error("Manual Gemma model load failure:", err);
      setErrorMessage(
        err?.message ||
          "Failed to mount the selected model artifact on WebGPU. Verify that you selected a valid .litertlm file."
      );
      setIsEngineReady(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isEngineReady
                  ? "bg-emerald-600 animate-pulse"
                  : "bg-amber-500 animate-pulse"
              }`}
            ></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              {isEngineReady
                ? "Gemma WebGPU Engine Active & Ready"
                : "Gemma Model Setup Required"}
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 uppercase tracking-wider">
              WebGPU On-Device
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* WebGPU Status Pill */}
        <div className="flex flex-col items-end">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${
              webGpuInfo.supported
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            {webGpuInfo.supported ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircleIcon className="w-4 h-4 text-rose-600" />
            )}
            <span>
              {webGpuInfo.supported ? "WebGPU Supported" : "WebGPU Not Available"}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            {GEMMA_MODEL_CONFIG.name} ({GEMMA_MODEL_CONFIG.filename})
          </span>
        </div>
      </div>

      {/* Model Already Loaded Badge */}
      {isEngineReady ? (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CpuIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950">
                Gemma 4 E2B is Mounted on WebGPU
              </h3>
              <p className="text-xs text-emerald-800 font-medium">
                Loaded source:{" "}
                <span className="font-mono font-bold">
                  {loadedFileName || GEMMA_MODEL_CONFIG.filename}
                </span>{" "}
                &bull; Zero cloud data leakage &bull; Vision Scanner is
                unlocked below.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".litertlm"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-400 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Reload Different File
            </button>
          </div>
        </div>
      ) : (
        /* Model Selection Workflow (Download -> Select -> Render on WebGPU) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Action 1: Download Model */}
            <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-sm font-extrabold text-black">
                    Download Gemma Model Binary
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Download the official Google Gemma 4 E2B model artifact
                  compiled for LiteRT LM WebGPU. Save it to your local storage.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
                  <p className="text-slate-800 font-bold truncate">
                    File: {GEMMA_MODEL_CONFIG.filename}
                  </p>
                  <p className="text-slate-500">Size: ~1.3 GB (Binary)</p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={GEMMA_MODEL_CONFIG.huggingFaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-700 text-white font-extrabold text-xs hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2 shadow-sm text-center"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download Gemma 4 E2B (.litertlm)</span>
                </a>
              </div>
            </div>

            {/* Action 2: Load Model Manually */}
            <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-extrabold text-black">
                    Load Model from Selected Location
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  After downloading, locate the model file on your hard drive and
                  mount it directly into your browser&apos;s WebGPU memory.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <p className="text-slate-800 font-bold">
                    Hardware Acceleration: WebGPU
                  </p>
                  <p className="text-slate-500 font-medium">
                    Allocates 4096-token KV cache on your local GPU.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".litertlm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                >
                  <HardDriveIcon className="w-4 h-4 text-blue-400" />
                  <span>Select Model from Local Storage</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center space-x-3 text-xs font-bold text-slate-800">
              <span className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></span>
              <span>
                Mounting model on WebGPU, compiling shaders, and allocating
                execution context...
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-950 text-xs font-medium flex items-start space-x-2">
              <AlertCircleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
