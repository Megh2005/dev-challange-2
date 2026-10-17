"use client";

import React, { useState, useEffect } from "react";
import PrescriptionResultView from "@/components/PrescriptionResultView";
import { PrescriptionScanResult } from "@/types/prescription";
import { UploadCloudIcon } from "@/components/icons";

export default function ScanPrescriptionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PrescriptionScanResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Request browser geolocation to search buying options with respect to user's exact coordinates
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoordinates({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setLocationLabel(
            `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
          );
        },
        (err) => {
          console.warn("Geolocation prompt skipped or denied:", err.message);
          setLocationLabel("Default region active");
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setErrorMessage(null);
    }
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMessage(null);
  };

  const handleRunScan = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select or drop a prescription image to analyze.");
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      if (userCoordinates) {
        formData.append("latitude", userCoordinates.latitude.toString());
        formData.append("longitude", userCoordinates.longitude.toString());
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const resData = await response.json();
      if (resData.success) {
        setScanResult(resData.data);
      } else {
        if (response.status === 401) {
          window.location.href =
            "/auth/signin?callbackUrl=/scan&error=SessionRequired";
          return;
        }
        setErrorMessage(
          resData.error ||
            "Prescription analysis failed. Please verify your file.",
        );
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Prescription analysis failed.",
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-[80vw] mx-auto py-8 bg-white text-black min-h-[92vh]">
      {/* If results are displayed, show the revamped full result view directly */}
      {scanResult ? (
        <PrescriptionResultView
          result={scanResult}
          previewUrl={previewUrl}
          onReset={handleClearFile}
        />
      ) : (
        /* If no result yet, show the streamlined upload & scan interface */
        <div className="space-y-6">
          {/* Page Title & Geolocation Status */}
          <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-black ">
                Prescription Scanner &amp; Decipher
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Upload a prescription photo to automatically extract medicines,
                plain-language dosage instructions, chemical formulas, and
                laboratory tests.
              </p>
            </div>
            {locationLabel && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 self-start">
                Location: {locationLabel}
              </span>
            )}
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
                        : "Click to select or drag & drop prescription image"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports high-resolution JPG, PNG, and WEBP doctor
                      prescription slips
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
                        alt="Prescription preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                    <p className="text-sm font-bold text-black">
                      No prescription selected
                    </p>
                    <p className="text-xs text-slate-500">
                      Select or drop your prescription file on the left to begin
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
                  onClick={handleRunScan}
                  disabled={isScanning || !selectedFile}
                  className="w-full py-4 px-6 rounded-xl bg-blue-700 text-white font-extrabold text-sm hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isScanning ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Transcribing &amp; Analyzing Prescription...</span>
                    </span>
                  ) : (
                    "Analyze Prescription"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick instructions / features card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                1. Shorthand Decoding
              </h3>
              <p className="text-xs text-slate-600">
                Converts OD, BD, TDS, AC, PC, and HS shorthand into clear,
                everyday timing instructions.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                2. Chemical Identification
              </h3>
              <p className="text-xs text-slate-600">
                Identifies active pharmacological molecules, exact salt
                strengths, and therapeutic indication.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">
                3. Daily Timetable
              </h3>
              <p className="text-xs text-slate-600">
                Generates a clean Morning, Afternoon, and Night routine table
                suitable for all ages.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
