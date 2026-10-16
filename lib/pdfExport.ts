import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PrescriptionScanResult, PrescribedMedicine } from "@/types/prescription";

// Helper to parse timetable shorthand into slots
function parseTimetable(freqStr: string) {
  const lower = (freqStr || "").toLowerCase();
  let morning = "-";
  let afternoon = "-";
  let night = "-";

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
}

export function exportPrescriptionToPdf(result: PrescriptionScanResult) {
  // A4 Dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  // Strict Typography Rules:
  // 1. Monospace font: "courier"
  // 2. Black and white ONLY: Text [0,0,0], Borders [0,0,0], Backgrounds [255,255,255]
  // 3. Weight: "normal" or "bold"
  // 4. ITALICS STRICTLY PROHIBITED
  const setMonospace = (weight: "normal" | "bold" = "normal", sizePt = 10) => {
    doc.setFont("courier", weight);
    doc.setFontSize(sizePt);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255);
  };

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 14) {
      doc.addPage();
      y = margin;
    }
  };

  // ===========================================================================
  // DOCUMENT HEADER & TITLE
  // ===========================================================================
  setMonospace("bold", 12);
  doc.text("CLINICAL PRESCRIPTION DECIPHER & PATIENT ROUTINE TRANSCRIPT", pageWidth / 2, y, {
    align: "center"
  });
  y += 5;

  setMonospace("normal", 8);
  doc.text("AUTOMATED CLINICAL OCR AND PHARMACOLOGICAL ANALYSIS REPORT", pageWidth / 2, y, {
    align: "center"
  });
  y += 4;

  // Double horizontal rule
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 1;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4.5;

  // Metadata Line
  setMonospace("normal", 7.5);
  doc.text(`RECORD ID: ${result.id.slice(0, 16)}`, margin, y);
  doc.text(`CONSULTATION DATE: ${result.doctor.consultationDate || "Not Specified"}`, pageWidth / 2, y, { align: "center" });
  doc.text(`EXPORT DATE: ${new Date().toISOString().slice(0, 10)}`, pageWidth - margin, y, { align: "right" });
  y += 3.5;

  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ===========================================================================
  // SECTION 1: PHYSICIAN & PATIENT PROFILES (GRID TABLE WITH ALL BORDERS PRESENT)
  // ===========================================================================
  ensureSpace(40);

  const docLines = [
    `PHYSICIAN: ${result.doctor.name || "Not Specified"}`,
    `QUALIFICATIONS: ${result.doctor.degrees || "N/A"}`,
    `REGISTRATION NO: ${result.doctor.registrationNumber || "N/A"}`,
    `CLINIC/HOSPITAL: ${result.doctor.clinicOrHospital || "N/A"}`,
    result.doctor.contactNumber && result.doctor.contactNumber !== "Not stated"
      ? `CONTACT: ${result.doctor.contactNumber}`
      : ""
  ].filter(Boolean).join("\n");

  const vitalsText = result.patient.vitals
    ? [
        result.patient.vitals.bloodPressure ? `BP: ${result.patient.vitals.bloodPressure}` : "",
        result.patient.vitals.pulseRate ? `PULSE: ${result.patient.vitals.pulseRate}` : "",
        result.patient.vitals.temperature ? `TEMP: ${result.patient.vitals.temperature}` : "",
        result.patient.vitals.spo2 ? `SPO2: ${result.patient.vitals.spo2}` : ""
      ].filter(Boolean).join(" | ")
    : "";

  const patLines = [
    `PATIENT: ${result.patient.name}`,
    `AGE/GENDER: ${result.patient.age || "N/A"} / ${result.patient.gender || "N/A"}${result.patient.weight ? ` (Weight: ${result.patient.weight})` : ""}`,
    `DIAGNOSIS: ${result.patient.diagnosis || "Under Evaluation"}`,
    result.patient.chiefComplaints && result.patient.chiefComplaints.length > 0
      ? `CHIEF COMPLAINTS: ${result.patient.chiefComplaints.join(", ")}`
      : "",
    vitalsText ? `VITALS: ${vitalsText}` : ""
  ].filter(Boolean).join("\n");

  autoTable(doc, {
    startY: y,
    head: [["PRESCRIBING PHYSICIAN", "PATIENT RECORD & CLINICAL DIAGNOSIS"]],
    body: [[docLines, patLines]],
    theme: "grid", // Guarantees all borders are drawn
    styles: {
      font: "courier",
      fontStyle: "normal",
      fontSize: 7.5,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 3,
      overflow: "linebreak"
    },
    headStyles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 8,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      halign: "left"
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    },
    margin: { left: margin, right: margin }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 5;

  // ===========================================================================
  // SECTION 2: DAILY MEDICATION SCHEDULE (PATIENT ROUTINE TIMETABLE)
  // ===========================================================================
  ensureSpace(35);

  setMonospace("bold", 8.5);
  doc.text("SECTION 2: PATIENT DAILY MEDICATION SCHEDULE (ROUTINE TIMETABLE)", margin, y);
  y += 2.5;

  const timetableHead = [
    [
      "NO",
      "MEDICINE & STRENGTH",
      "ACTIVE CHEMICAL SALT",
      "MORNING\n(BREAKFAST)",
      "AFTERNOON\n(LUNCH)",
      "NIGHT\n(DINNER/BED)",
      "FOOD TIMING",
      "COURSE"
    ]
  ];

  const timetableBody = result.medicines.map((m, idx) => {
    const s = parseTimetable(m.frequencyOriginal || m.frequencyDecoded);
    return [
      String(idx + 1),
      `${m.name}`,
      `${m.genericName}`,
      s.morning,
      s.afternoon,
      s.night,
      m.timingInstruction || "Take with water",
      m.duration || "As advised"
    ];
  });

  // Column widths sum: 8 + 40 + 36 + 16 + 16 + 16 + 30 + 20 = 182mm (exact contentWidth)
  autoTable(doc, {
    startY: y,
    head: timetableHead,
    body: timetableBody,
    theme: "grid",
    styles: {
      font: "courier",
      fontStyle: "normal",
      fontSize: 7.2,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2,
      halign: "left",
      valign: "middle",
      overflow: "linebreak"
    },
    headStyles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 7.5,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 40, fontStyle: "bold" },
      2: { cellWidth: 36 },
      3: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      6: { cellWidth: 30 },
      7: { cellWidth: 20, halign: "center" }
    },
    margin: { left: margin, right: margin }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 5;

  // ===========================================================================
  // SECTION 3: DETAILED MEDICINE COMPOSITION & SAFETY RULES
  // ===========================================================================
  ensureSpace(20);

  setMonospace("bold", 8.5);
  doc.text("SECTION 3: PHARMACOLOGICAL COMPOSITION & PATIENT SAFETY RULES", margin, y);
  y += 2.5;

  result.medicines.forEach((med: PrescribedMedicine, idx: number) => {
    ensureSpace(30);

    const rulesStr = med.guidelines && med.guidelines.length > 0
      ? med.guidelines.map((g) => `* ${g}`).join("\n")
      : "Follow standard administration instructions.";

    const medTableBody = [
      [
        "ACTIVE CHEMICAL COMPOSITION",
        med.chemicalComposition || "Not specified"
      ],
      [
        "DOSAGE & TIMING SCHEDULE",
        `${med.dosage} | ${med.frequencyDecoded} (Prescription Shorthand: ${med.frequencyOriginal})`
      ],
      [
        "WHEN & COURSE DURATION",
        `${med.timingInstruction || "Take with water"} | Total Course: ${med.duration || "As advised"}`
      ],
      [
        "CLINICAL PURPOSE (INDICATION)",
        med.primaryIndication || "Prescribed for diagnosed clinical condition"
      ],
      [
        "PATIENT SAFETY PRECAUTIONS",
        rulesStr
      ],
      [
        "CLINICAL SUMMARY NOTE",
        med.shortNote || "Take strictly as prescribed."
      ]
    ];

    autoTable(doc, {
      startY: y,
      head: [[`[MEDICINE ${idx + 1}] ${med.name.toUpperCase()} (Generic: ${med.genericName})`, ""]],
      body: medTableBody,
      theme: "grid",
      styles: {
        font: "courier",
        fontStyle: "normal",
        fontSize: 7.2,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 2,
        overflow: "linebreak"
      },
      headStyles: {
        font: "courier",
        fontStyle: "bold",
        fontSize: 8,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        halign: "left"
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: contentWidth - 55 }
      },
      margin: { left: margin, right: margin }
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    y = doc.lastAutoTable.finalY + 4;
  });

  // ===========================================================================
  // SECTION 4: DIAGNOSTIC & LABORATORY INVESTIGATIONS (IF ANY)
  // ===========================================================================
  if (result.labTests && result.labTests.length > 0) {
    ensureSpace(25);

    setMonospace("bold", 8.5);
    doc.text("SECTION 4: RECOMMENDED LABORATORY & DIAGNOSTIC INVESTIGATIONS", margin, y);
    y += 2.5;

    const labHead = [["NO", "TEST / INVESTIGATION", "CLINICAL PURPOSE", "PATIENT PREPARATION / FASTING"]];
    const labBody = result.labTests.map((t, idx) => [
      String(idx + 1),
      t.testName,
      t.clinicalReason,
      t.instructions || "Standard procedure"
    ]);

    // Widths: 10 + 50 + 62 + 60 = 182mm
    autoTable(doc, {
      startY: y,
      head: labHead,
      body: labBody,
      theme: "grid",
      styles: {
        font: "courier",
        fontStyle: "normal",
        fontSize: 7.2,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 2.2,
        overflow: "linebreak"
      },
      headStyles: {
        font: "courier",
        fontStyle: "bold",
        fontSize: 7.5,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        halign: "center"
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 50, fontStyle: "bold" },
        2: { cellWidth: 62 },
        3: { cellWidth: 60 }
      },
      margin: { left: margin, right: margin }
    });

    // @ts-expect-error autoTable adds lastAutoTable to doc
    y = doc.lastAutoTable.finalY + 5;
  }

  // ===========================================================================
  // SECTION 5: PHYSICIAN CARE ADVICE & FOLLOW-UP SCHEDULE
  // ===========================================================================
  ensureSpace(25);

  const adviceText = result.generalAdvice && result.generalAdvice.length > 0
    ? result.generalAdvice.map((a) => `* ${a}`).join("\n")
    : "Maintain healthy hydration and balanced diet.";

  const followUpText = [
    `SCHEDULE: ${result.followUp || "Follow up as advised by physician."}`,
    "NOTE: Please bring this digital summary and previous diagnostic reports to your follow-up visit."
  ].join("\n\n");

  autoTable(doc, {
    startY: y,
    head: [["PHYSICIAN LIFESTYLE & DIETARY ADVICE", "FOLLOW-UP CONSULTATION SCHEDULE"]],
    body: [[adviceText, followUpText]],
    theme: "grid",
    styles: {
      font: "courier",
      fontStyle: "normal",
      fontSize: 7.2,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      cellPadding: 3,
      overflow: "linebreak"
    },
    headStyles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 8,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      halign: "left"
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    },
    margin: { left: margin, right: margin }
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  y = doc.lastAutoTable.finalY + 5;

  // ===========================================================================
  // SECTION 6: MANDATORY LEGAL & CLINICAL AI DISCLAIMER
  // ===========================================================================
  ensureSpace(28);

  const disclaimerNotice =
    "MANDATORY LEGAL & CLINICAL VERIFICATION NOTICE:\n" +
    "ALL RESPONSES AND DATA CONTAINED IN THIS DOCUMENT ARE GENERATED BY AN ARTIFICIAL " +
    "INTELLIGENCE (AI) AGENT UTILIZING COMPUTER VISION OPTICAL CHARACTER RECOGNITION (OCR) " +
    "AND PHARMACOLOGICAL KNOWLEDGE PROCESSING.\n\n" +
    "ALL EXTRACTED VALUES, MEDICINE NAMES, CHEMICAL FORMULATIONS, DOSAGE FREQUENCIES, " +
    "AND INSTRUCTIONS ARE SUBJECT TO MACHINE-INTERPRETATION AND HANDWRITING VARIANCE " +
    "LIMITATIONS. THIS TRANSCRIPT DOES NOT CONSTITUTE MEDICAL ADVICE, A FORMAL DIAGNOSIS, " +
    "OR A SUBSTITUTE FOR CLINICAL CONSULTATION.\n\n" +
    "CRITICAL REQUIREMENT: YOU MUST DIRECTLY CROSS-VERIFY ALL EXTRACTED MEDICATIONS, " +
    "DOSAGES, TIMINGS, AND LAB ORDERS WITH A LICENSED PHYSICIAN OR REGISTERED PHARMACIST " +
    "BEFORE IMPLEMENTING, ADMINISTERING, OR ALTERING ANY TREATMENT. THE APPLICATION " +
    "OPERATORS AND DEVELOPERS EXPRESSLY DISCLAIM ALL LIABILITY FOR CLINICAL ERRORS, " +
    "OMISSIONS, OR ADVERSE EVENTS RESULTING FROM RELIANCE ON THIS AI-GENERATED REPORT.";

  autoTable(doc, {
    startY: y,
    body: [[disclaimerNotice]],
    theme: "grid",
    styles: {
      font: "courier",
      fontStyle: "bold",
      fontSize: 6.8,
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      cellPadding: 3,
      halign: "left",
      overflow: "linebreak"
    },
    margin: { left: margin, right: margin }
  });

  // ===========================================================================
  // PAGE NUMBERS & RUNNING HEADER/FOOTER (DRAWN ACROSS ALL PAGES)
  // ===========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Page border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);

    // Running footer rule
    doc.line(margin, pageHeight - margin + 1, pageWidth - margin, pageHeight - margin + 1);

    // Running footer text
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);

    doc.text(
      "CONFIDENTIAL MEDICAL TRANSCRIPT | BLACK & WHITE MONOSPACE A4 EXPORT",
      margin,
      pageHeight - margin + 4.5
    );

    doc.text(
      `PAGE ${p} OF ${totalPages}`,
      pageWidth - margin,
      pageHeight - margin + 4.5,
      { align: "right" }
    );
  }

  // Generate safe filename and trigger download
  const safePatient = (result.patient.name || "Patient").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `Prescription_Report_${safePatient}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
