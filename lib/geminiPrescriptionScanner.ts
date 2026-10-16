import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrescriptionScanResult } from "@/types/prescription";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function processPrescriptionFile(
  file: File
): Promise<PrescriptionScanResult> {
  const startTime = Date.now();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in your environment. Please add your Gemini API key to .env to analyze prescriptions."
    );
  }

  const tempDir = os.tmpdir();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "prescription.jpg";
  const tempFilePath = path.join(tempDir, `rx_${Date.now()}_${safeFileName}`);

  let uploadedFileUri = "";
  let uploadedFileName = "";
  const fileManager = new GoogleAIFileManager(apiKey);

  try {
    const bytes = await file.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(bytes));

    const mimeType = file.type || "image/jpeg";
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: file.name || "Medical Prescription"
    });

    uploadedFileUri = uploadResult.file.uri;
    uploadedFileName = uploadResult.file.name;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const prompt = `You are an expert clinical medical pharmacist and prescription transcription specialist.
Analyze this medical prescription image thoroughly using your internal medical and pharmacological knowledge.
Extract all details from the prescription and return a strictly valid JSON object matching this schema:

{
  "doctor": {
    "name": "Doctor name with professional title (e.g. Dr. Rajesh Mehta)",
    "degrees": "Qualifications like MBBS, MD, MS, DNB",
    "registrationNumber": "Medical council registration number or 'Not stated'",
    "clinicOrHospital": "Hospital, clinic, or healthcare centre name",
    "contactNumber": "Phone number or helpline if visible, else 'Not stated'",
    "consultationDate": "Date of consultation on the prescription"
  },
  "patient": {
    "name": "Patient full name or 'Patient'",
    "age": "Age in years or 'Adult'",
    "gender": "Male / Female / Other / 'Not stated'",
    "weight": "Patient weight if recorded",
    "diagnosis": "Diagnosed illness, symptoms, or clinical condition",
    "chiefComplaints": ["Symptoms or complaints stated by patient"],
    "vitals": {
      "bloodPressure": "Blood pressure reading if present",
      "pulseRate": "Pulse rate if present",
      "temperature": "Body temperature if present",
      "spo2": "Oxygen saturation if present"
    }
  },
  "medicines": [
    {
      "id": "med-1",
      "name": "Prescribed medicine name with dosage form (e.g. Tab Augmentin 625 Duo)",
      "brandName": "Brand / Trade Name",
      "genericName": "Generic pharmaceutical name",
      "chemicalComposition": "Using your internal medical knowledge, state the exact active chemical ingredients with strength (e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg)",
      "dosage": "Unit dosage prescribed, e.g. 1 Tablet, 1 Capsule, 10 ml",
      "frequencyOriginal": "Original doctor acronym like OD, BD, TDS, QID, SOS, AC, PC, HS",
      "frequencyDecoded": "Convert the medical shorthand (OD, BD, TDS, QID, SOS, AC, PC, HS, etc.) into crystal-clear plain English that any patient can easily understand: e.g. 'Twice in a day (every 12 hours) - After food' or 'Once in a day - Before breakfast on empty stomach'",
      "duration": "Duration of medication course, e.g. 5 Days",
      "timingInstruction": "Clear instruction: e.g. Take 15-30 minutes after breakfast and dinner with water",
      "primaryIndication": "Using your medical knowledge, specify for what disease, illness, or clinical case this medicine is used",
      "guidelines": [
        "Clear safety rules and basic precautions the patient must follow while taking this medicine"
      ],
      "shortNote": "A concise single short note summarizing what this medicine does and why it was prescribed"
    }
  ],
  "labTests": [
    {
      "id": "test-1",
      "testName": "Name of diagnostic investigation (e.g. Complete Blood Count - CBC)",
      "clinicalReason": "Clinical purpose of this laboratory test",
      "instructions": "Patient preparation rules like fasting or collection timing"
    }
  ],
  "generalAdvice": [
    "General lifestyle, hydration, rest, or dietary advice noted on the prescription"
  ],
  "followUp": "Follow-up consultation schedule or review date"
}

Important Instructions:
- Use your comprehensive pharmacological knowledge base to supply the exact active chemical composition, clinical indication, and precautions for every medicine found.
- Convert all shorthand terms (OD, BD, TDS, QID, SOS, AC, BBF, PC, HS, etc.) into plain everyday words.
- Write a single concise note about the medicine's usage and role.
- Extract any laboratory or diagnostic investigations mentioned with their clinical reasons and fasting instructions.
- Do not wrap the JSON in markdown code blocks. Return only valid raw JSON.`;

    const response = await model.generateContent([
      {
        fileData: {
          fileUri: uploadedFileUri,
          mimeType: uploadResult.file.mimeType
        }
      },
      prompt
    ]);

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error("Gemini returned an empty response. Please ensure the prescription image is clear and legible.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error("Failed to parse clinical JSON response from Gemini Vision.");
    }

    const medicines = (parsed.medicines || []).map((m: any, idx: number) => ({
      id: m.id || `med_${idx + 1}`,
      name: m.name || m.brandName || "Prescribed Medicine",
      brandName: m.brandName || m.name || "Brand",
      genericName: m.genericName || m.name || "Generic",
      chemicalComposition: m.chemicalComposition || "Active Pharmaceutical Ingredient",
      dosage: m.dosage || "1 Unit",
      frequencyOriginal: m.frequencyOriginal || "As directed",
      frequencyDecoded: m.frequencyDecoded || "As advised by doctor",
      duration: m.duration || "As advised by doctor",
      timingInstruction: m.timingInstruction || "Take with water as directed",
      primaryIndication: m.primaryIndication || "Treatment as evaluated by physician",
      guidelines: Array.isArray(m.guidelines) && m.guidelines.length > 0 ? m.guidelines : ["Follow prescribed dosage schedule"],
      shortNote: m.shortNote || "Prescription medication prescribed to manage diagnosed condition."
    }));

    const labTests = (parsed.labTests || []).map((t: any, idx: number) => ({
      id: t.id || `test_${idx + 1}`,
      testName: t.testName || "Diagnostic Test",
      clinicalReason: t.clinicalReason || "Clinical evaluation as advised by physician",
      instructions: t.instructions || "Follow laboratory instructions"
    }));

    const result: PrescriptionScanResult = {
      id: `scan_${Date.now()}`,
      timestamp: new Date().toISOString(),
      doctor: {
        name: parsed.doctor?.name || "Consulting Physician",
        degrees: parsed.doctor?.degrees || "Registered Medical Practitioner",
        registrationNumber: parsed.doctor?.registrationNumber || "Not stated",
        clinicOrHospital: parsed.doctor?.clinicOrHospital || "Medical Clinic",
        contactNumber: parsed.doctor?.contactNumber || "Not stated",
        consultationDate: parsed.doctor?.consultationDate || new Date().toLocaleDateString("en-GB")
      },
      patient: {
        name: parsed.patient?.name || "Patient",
        age: parsed.patient?.age || "Adult",
        gender: parsed.patient?.gender || "Not stated",
        weight: parsed.patient?.weight || undefined,
        diagnosis: parsed.patient?.diagnosis || "Clinical Consultation",
        chiefComplaints: Array.isArray(parsed.patient?.chiefComplaints)
          ? parsed.patient.chiefComplaints
          : [],
        vitals: parsed.patient?.vitals || undefined
      },
      medicines,
      labTests,
      generalAdvice: Array.isArray(parsed.generalAdvice) ? parsed.generalAdvice : [],
      followUp: parsed.followUp || "Follow up with physician as advised.",
      rawOcrText: responseText.slice(0, 500),
      modelUsed: "Clinical Intelligence Engine",
      processingTimeMs: Date.now() - startTime
    };

    return result;
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch { }

    if (uploadedFileName) {
      try {
        await fileManager.deleteFile(uploadedFileName);
      } catch { }
    }
  }
}
