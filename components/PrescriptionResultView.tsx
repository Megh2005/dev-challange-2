"use client";

import React, { useState } from "react";
import { PrescriptionScanResult, PrescribedMedicine } from "@/types/prescription";
import {
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  RefreshCwIcon,
  FileTextIcon
} from "./icons";

interface Props {
  result: PrescriptionScanResult;
  previewUrl?: string | null;
  onReset: () => void;
}

export default function PrescriptionResultView({ result, previewUrl, onReset }: Props) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedMedId, setCopiedMedId] = useState<string | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState(false);

  const handleCopyAll = () => {
    const lines = [
      `==================================================`,
      `          PRESCRIPTION ANALYSIS REPORT`,
      `==================================================`,
      `PHYSICIAN: ${result.doctor.name} (${result.doctor.degrees})`,
      `REGISTRATION NO: ${result.doctor.registrationNumber}`,
      `CLINIC / HOSPITAL: ${result.doctor.clinicOrHospital}`,
      `DATE: ${result.doctor.consultationDate}`,
      result.doctor.contactNumber ? `CONTACT: ${result.doctor.contactNumber}` : "",
      ``,
      `PATIENT: ${result.patient.name}`,
      `AGE / GENDER: ${result.patient.age} / ${result.patient.gender}`,
      result.patient.weight ? `WEIGHT: ${result.patient.weight}` : "",
      `DIAGNOSIS: ${result.patient.diagnosis}`,
      result.patient.chiefComplaints && result.patient.chiefComplaints.length > 0
        ? `CHIEF COMPLAINTS: ${result.patient.chiefComplaints.join(", ")}`
        : "",
      ``,
      `--------------------------------------------------`,
      `DAILY MEDICATION SCHEDULE:`,
      `--------------------------------------------------`,
      ...result.medicines.map((m, i) => {
        const schedule = parseTimetable(m.frequencyOriginal || m.frequencyDecoded);
        return `${i + 1}. ${m.name} (${m.genericName})
   - Routine: Morning: ${schedule.morning} | Afternoon: ${schedule.afternoon} | Night: ${schedule.night}
   - Dosage: ${m.dosage}
   - When: ${m.timingInstruction}
   - Duration: ${m.duration}
   - Active Composition: ${m.chemicalComposition}
   - Why Prescribed: ${m.primaryIndication}
   - Patient Rules: ${m.guidelines.join("; ")}
   - Note: ${m.shortNote}\n`;
      }),
      result.labTests && result.labTests.length > 0
        ? `--------------------------------------------------
LABORATORY & DIAGNOSTIC TESTS:
--------------------------------------------------
${result.labTests
  .map(
    (t, i) =>
      `${i + 1}. ${t.testName}\n   - Purpose: ${t.clinicalReason}\n   - Preparation: ${t.instructions}`
  )
  .join("\n\n")}\n`
        : "",
      `--------------------------------------------------`,
      `PHYSICIAN ADVICE:`,
      `--------------------------------------------------`,
      result.generalAdvice && result.generalAdvice.length > 0
        ? result.generalAdvice.map((a) => `- ${a}`).join("\n")
        : "None specified.",
      ``,
      `FOLLOW-UP: ${result.followUp || "As directed by physician"}`,
      `==================================================`
    ];

    navigator.clipboard.writeText(lines.filter(Boolean).join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySingleMedicine = (med: PrescribedMedicine) => {
    const text = `${med.name} (${med.genericName})
- Dosage & Timing: ${med.dosage} • ${med.frequencyDecoded}
- When: ${med.timingInstruction}
- Course Duration: ${med.duration}
- Active Chemical Composition: ${med.chemicalComposition}
- Clinical Purpose: ${med.primaryIndication}
- Safety Rules: ${med.guidelines.join("; ")}
- Clinical Note: ${med.shortNote}`;

    navigator.clipboard.writeText(text);
    setCopiedMedId(med.id);
    setTimeout(() => setCopiedMedId(null), 2000);
  };

  // Helper to extract dosage quantity (e.g. 1 Tablet, 5ml, etc.)
  const getDoseUnit = (dosageStr: string) => {
    if (!dosageStr) return "dose";
    const parts = dosageStr.trim().split(" ");
    return parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
  };

  // Helper to parse timetable slots (Morning, Afternoon, Night)
  const parseTimetable = (freqStr: string) => {
    const lower = (freqStr || "").toLowerCase();
    let morning = "-";
    let afternoon = "-";
    let night = "-";

    // Numerical formats: 1-0-1, 1-1-1, 1-0-0, 0-0-1, 0-1-0, etc.
    if (lower.includes("1-0-1")) {
      morning = "1";
      afternoon = "-";
      night = "1";
    } else if (lower.includes("1-1-1")) {
      morning = "1";
      afternoon = "1";
      night = "1";
    } else if (lower.includes("1-0-0")) {
      morning = "1";
      afternoon = "-";
      night = "-";
    } else if (lower.includes("0-0-1")) {
      morning = "-";
      afternoon = "-";
      night = "1";
    } else if (lower.includes("0-1-0")) {
      morning = "-";
      afternoon = "1";
      night = "-";
    } else if (lower.includes("1-1-0")) {
      morning = "1";
      afternoon = "1";
      night = "-";
    } else if (lower.includes("bd") || lower.includes("twice")) {
      morning = "1";
      afternoon = "-";
      night = "1";
    } else if (lower.includes("tds") || lower.includes("tid") || lower.includes("thrice") || lower.includes("three times")) {
      morning = "1";
      afternoon = "1";
      night = "1";
    } else if (lower.includes("qid") || lower.includes("four times")) {
      morning = "1";
      afternoon = "1";
      night = "1";
    } else if (lower.includes("hs") || lower.includes("bedtime") || lower.includes("night") || lower.includes("nocte")) {
      morning = "-";
      afternoon = "-";
      night = "1";
    } else if (lower.includes("od mane") || lower.includes("morning")) {
      morning = "1";
      afternoon = "-";
      night = "-";
    } else if (lower.includes("od") || lower.includes("once")) {
      morning = "1";
      afternoon = "-";
      night = "-";
    } else if (lower.includes("sos") || lower.includes("prn") || lower.includes("as needed")) {
      morning = "SOS";
      afternoon = "SOS";
      night = "SOS";
    }

    return { morning, afternoon, night };
  };

  return (
    <div className="w-full space-y-8 print:m-0 print:p-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-blue-700"></span>
          <div>
            <h2 className="text-base font-extrabold text-black">
              Prescription Analysis Completed
            </h2>
            <p className="text-xs text-slate-600">
              {result.medicines.length} Medicines Identified &bull;{" "}
              {result.labTests ? result.labTests.length : 0} Diagnostic Tests Ordered
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {previewUrl && (
            <button
              type="button"
              onClick={() => setShowOriginalImage(!showOriginalImage)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
            >
              <FileTextIcon className="w-4 h-4 text-slate-600" />
              <span>{showOriginalImage ? "Hide Prescription Photo" : "View Original Prescription"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyAll}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
          >
            {copiedAll ? (
              <>
                <CheckIcon className="w-4 h-4 text-blue-700" />
                <span className="text-blue-700">Copied Transcript</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4 text-slate-600" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-extrabold hover:bg-blue-800 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>Print Official Schedule</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4 text-slate-600" />
            <span>Scan Another</span>
          </button>
        </div>
      </div>

      {/* Collapsible Original Prescription Image Preview */}
      {showOriginalImage && previewUrl && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wide">
                Original Scanned Prescription Photo
              </h3>
              <p className="text-xs text-slate-500">
                Cross-reference the original doctor&apos;s handwriting with the digitized deciphered data below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowOriginalImage(false)}
              className="text-xs font-bold text-slate-600 hover:text-black underline"
            >
              Close Photo Preview
            </button>
          </div>
          <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Original Uploaded Prescription"
              className="max-h-[56vh] object-contain mx-auto rounded"
            />
          </div>
        </div>
      )}

      {/* Master Clinical Document Container */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden print:border-none shadow-sm">
        {/* ========================================================================= */}
        {/* SECTION 1: OFFICIAL CONSULTATION RECORD & PATIENT PROFILE */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-slate-200 p-6 sm:p-8 bg-slate-50">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest">
              Section 1: Consultation Details &amp; Patient Profile
            </span>
            <span className="text-xs font-bold text-slate-500">
              Prescription Ref #{result.id.slice(0, 8)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Doctor / Hospital Details */}
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Prescribing Physician
              </span>
              <h3 className="text-2xl font-black text-black tracking-tight">
                {result.doctor.name}
              </h3>
              <p className="text-sm font-bold text-blue-700">
                {result.doctor.degrees}
              </p>
              <p className="text-xs text-slate-700 font-medium">
                Medical Registration No: <strong className="text-black font-bold">{result.doctor.registrationNumber}</strong>
              </p>
              <p className="text-xs text-slate-700 font-medium">
                Clinic / Hospital: <strong className="text-black">{result.doctor.clinicOrHospital}</strong>
              </p>
              <div className="pt-2 text-xs text-slate-600 flex items-center justify-between">
                <span>Date: <strong className="text-black">{result.doctor.consultationDate}</strong></span>
                {result.doctor.contactNumber && result.doctor.contactNumber !== "Not stated" && (
                  <span>Contact: <strong className="text-black">{result.doctor.contactNumber}</strong></span>
                )}
              </div>
            </div>

            {/* Right Column: Patient Profile & Diagnosis */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Patient Overview
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <h4 className="text-2xl font-black text-black tracking-tight">
                    {result.patient.name}
                  </h4>
                  <span className="text-sm font-semibold text-slate-600">
                    ({result.patient.age}, {result.patient.gender}
                    {result.patient.weight && `, ${result.patient.weight}`})
                  </span>
                </div>
              </div>

              {/* Diagnosis Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block mb-1">
                  Clinical Diagnosis
                </span>
                <p className="text-base font-bold text-blue-950 leading-snug">
                  {result.patient.diagnosis}
                </p>
                {result.patient.chiefComplaints && result.patient.chiefComplaints.length > 0 && (
                  <p className="text-xs text-blue-900 mt-2 font-medium">
                    <strong>Chief Complaints:</strong> {result.patient.chiefComplaints.join(", ")}
                  </p>
                )}
              </div>

              {/* Vitals */}
              {result.patient.vitals && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {result.patient.vitals.bloodPressure && (
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold">
                      BP: {result.patient.vitals.bloodPressure}
                    </span>
                  )}
                  {result.patient.vitals.pulseRate && (
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold">
                      Pulse: {result.patient.vitals.pulseRate}
                    </span>
                  )}
                  {result.patient.vitals.temperature && (
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold">
                      Temp: {result.patient.vitals.temperature}
                    </span>
                  )}
                  {result.patient.vitals.spo2 && (
                    <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold">
                      SpO2: {result.patient.vitals.spo2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: DAILY MEDICATION TIMETABLE (PATIENT ROUTINE) */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 border-b-2 border-slate-200">
          <div className="mb-6">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
              Section 2: Daily Medication Schedule
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-black">
              Patient Medication Routine (When to Take What)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Follow this structured routine every day. Each slot indicates the dosage count and food requirement.
            </p>
          </div>

          <div className="overflow-x-auto border-2 border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b-2 border-slate-200 text-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Medicine &amp; Formulation</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">Morning<br /><span className="text-xs font-normal text-slate-500">Breakfast</span></th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">Afternoon<br /><span className="text-xs font-normal text-slate-500">Lunch</span></th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">Night<br /><span className="text-xs font-normal text-slate-500">Dinner / Bed</span></th>
                  <th className="py-3.5 px-4 min-w-[140px]">Food Relation</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Course Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {result.medicines.map((med, idx) => {
                  const schedule = parseTimetable(med.frequencyOriginal || med.frequencyDecoded);
                  const unit = getDoseUnit(med.dosage);

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-black">
                        <div className="text-base text-black font-extrabold">{med.name}</div>
                        <div className="text-xs font-semibold text-slate-600 mt-0.5">{med.genericName}</div>
                      </td>

                      {/* Morning Slot */}
                      <td className="py-4 px-3 text-center">
                        {schedule.morning !== "-" ? (
                          <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 font-extrabold text-blue-900 text-xs sm:text-sm">
                            {schedule.morning} {schedule.morning !== "SOS" ? unit : ""}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-base">&mdash;</span>
                        )}
                      </td>

                      {/* Afternoon Slot */}
                      <td className="py-4 px-3 text-center">
                        {schedule.afternoon !== "-" ? (
                          <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 font-extrabold text-blue-900 text-xs sm:text-sm">
                            {schedule.afternoon} {schedule.afternoon !== "SOS" ? unit : ""}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-base">&mdash;</span>
                        )}
                      </td>

                      {/* Night Slot */}
                      <td className="py-4 px-3 text-center">
                        {schedule.night !== "-" ? (
                          <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 font-extrabold text-blue-900 text-xs sm:text-sm">
                            {schedule.night} {schedule.night !== "SOS" ? unit : ""}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-base">&mdash;</span>
                        )}
                      </td>

                      {/* Food Relation */}
                      <td className="py-4 px-4 text-xs sm:text-sm font-semibold text-slate-800">
                        {med.timingInstruction || "Take with water"}
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 text-xs sm:text-sm font-bold text-black">
                        {med.duration}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: COMPREHENSIVE PHARMACOLOGICAL & USAGE BREAKDOWN */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 border-b-2 border-slate-200 space-y-6">
          <div>
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
              Section 3: Detailed Medicine Information
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-black">
              Prescribed Medicines &amp; Clinical Safety Guide ({result.medicines.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Review active chemical salts, clinical indication, patient safety rules, and clinical summary for every prescribed item.
            </p>
          </div>

          <div className="space-y-6">
            {result.medicines.map((med, idx) => (
              <div
                key={med.id || idx}
                className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-700 transition-colors space-y-5"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xl font-black text-black tracking-tight">{med.name}</h4>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        Generic Salt / Molecule: <strong className="text-black">{med.genericName}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopySingleMedicine(med)}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors print:hidden"
                  >
                    {copiedMedId === med.id ? "Copied" : "Copy Medicine Info"}
                  </button>
                </div>

                {/* Plain-English Schedule Strip */}
                <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                      Plain-Language Schedule (How &amp; When to Take)
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-white text-blue-900 border border-blue-300">
                      Prescription Shorthand: {med.frequencyOriginal}
                    </span>
                  </div>

                  <p className="text-lg sm:text-xl font-black text-blue-950">
                    {med.dosage} &bull; {med.frequencyDecoded}
                  </p>

                  <div className="text-xs sm:text-sm font-semibold text-blue-900 flex flex-wrap gap-x-6 gap-y-1">
                    <span><strong>When:</strong> {med.timingInstruction}</span>
                    <span><strong>Course:</strong> {med.duration}</span>
                  </div>
                </div>

                {/* Clinical Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Active Chemical Composition */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-extrabold text-slate-600 uppercase tracking-wider block">
                      Active Chemical Composition
                    </span>
                    <p className="text-sm font-extrabold text-black">
                      {med.chemicalComposition}
                    </p>
                  </div>

                  {/* Why It Is Prescribed */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-extrabold text-slate-600 uppercase tracking-wider block">
                      Why This Is Prescribed
                    </span>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">
                      {med.primaryIndication}
                    </p>
                  </div>
                </div>

                {/* Patient Safety Rules & Precautions */}
                {med.guidelines && med.guidelines.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                      Important Patient Rules &amp; Precautions
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      {med.guidelines.map((guide, gIdx) => (
                        <li key={gIdx} className="leading-relaxed">
                          {guide}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Single Summary Note */}
                <div className="pt-2 text-xs sm:text-sm text-slate-700 border-t border-slate-200">
                  <strong className="text-black uppercase tracking-wider font-extrabold">Clinical Summary Note: </strong>
                  <span>{med.shortNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: LABORATORY & DIAGNOSTIC INVESTIGATIONS */}
        {/* ========================================================================= */}
        {result.labTests && result.labTests.length > 0 && (
          <div className="p-6 sm:p-8 border-b-2 border-slate-200 space-y-4">
            <div>
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
                Section 4: Diagnostic Tests
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-black">
                Recommended Laboratory &amp; Diagnostic Investigations ({result.labTests.length})
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Tests ordered by your physician for clinical diagnosis and continuous monitoring.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.labTests.map((test, tIdx) => (
                <div
                  key={test.id || tIdx}
                  className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-blue-700 text-white">
                      Test #{tIdx + 1}
                    </span>
                    <h4 className="text-base font-bold text-black">{test.testName}</h4>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                    <strong>Clinical Purpose:</strong> {test.clinicalReason}
                  </p>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                    <strong>Patient Preparation:</strong> {test.instructions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: PHYSICIAN ADVICE & FOLLOW-UP SCHEDULE */}
        {/* ========================================================================= */}
        <div className="p-6 sm:p-8 bg-slate-50">
          <div className="mb-6">
            <span className="text-xs font-extrabold text-blue-700 uppercase tracking-widest block mb-1">
              Section 5: Care Instructions &amp; Next Appointment
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-black">
              Physician Advice &amp; Follow-up Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lifestyle & Care Advice */}
            <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Lifestyle, Diet &amp; Recovery Guidance
              </h4>
              {result.generalAdvice && result.generalAdvice.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-800">
                  {result.generalAdvice.map((adv, aIdx) => (
                    <li key={aIdx} className="leading-relaxed">
                      {adv}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500">No specific dietary or lifestyle restrictions recorded.</p>
              )}
            </div>

            {/* Follow-up Schedule */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                Follow-up Consultation
              </h4>
              <div className="p-4 bg-white border-2 border-slate-200 rounded-xl">
                <p className="text-base font-extrabold text-black">
                  {result.followUp || "Follow up with physician as advised or if symptoms persist."}
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Please bring this digital record, your original prescription slip, and any completed laboratory test reports to your next appointment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
