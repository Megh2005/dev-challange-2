import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LabReportAnalysisResult } from "@/types/labReport";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function analyzeLabReportFile(file: File): Promise<LabReportAnalysisResult> {
  const startTime = Date.now();

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in environment variables. Please add your Gemini API key to .env."
    );
  }

  const tempDir = os.tmpdir();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "lab_report.jpg";
  const tempFilePath = path.join(tempDir, `lab_${Date.now()}_${safeFileName}`);

  let uploadedFileName = "";
  const fileManager = new GoogleAIFileManager(apiKey);

  try {
    const bytes = await file.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(bytes));

    const mimeType = file.type || "image/jpeg";
    const uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType,
      displayName: file.name || "Pathological Lab Report"
    });

    uploadedFileName = uploadResult.file.name;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const prompt = `You are a compassionate, expert clinical pathologist and health communication specialist.
Analyze this medical pathology / laboratory test report image thoroughly.
Translate complex laboratory jargon into plain, crystal-clear layman's terms so that any everyday patient or caregiver can immediately understand what is happening inside their body.

CRITICAL REQUIREMENTS:
1. Extract ALL test parameters present in the report (e.g. Hemoglobin, RBC, WBC, Platelets, Glucose, HbA1c, Creatinine, Urea, SGOT/AST, SGPT/ALT, Bilirubin, Cholesterol, Triglycerides, HDL, LDL, TSH, Vitamin D, Vitamin B12, Urine parameters, etc.).
2. For EVERY test parameter:
   - "testName": Exact laboratory test name (e.g. "Serum Creatinine", "Hemoglobin").
   - "commonName": Friendly layman title (e.g. "Kidney Filtration Health", "Blood Oxygen Carrier").
   - "category": Organ or test group (e.g. "Complete Blood Count", "Kidney Function", "Liver Function", "Lipid Profile", "Diabetes Check", "Thyroid Profile").
   - "laymanExplanation": Simple explanation of what this test actually measures in everyday language without heavy medical jargon.
   - "observedValue": The patient's exact value from the report (e.g. "1.4", "13.2", "110").
   - "unit": Measurement unit (e.g. "mg/dL", "g/dL", "U/L", "x10^3/uL").
   - "status": One of "optimal" (normal), "mild_deviation" (slightly outside normal), or "attention_required" (concerning or significantly outside normal).
   - "statusLabel": Human-readable badge (e.g. "Normal", "Slightly Elevated", "Low", "High").
   - "referenceStandards":
     - "standardRange": Standard normal reference interval.
     - "ageStandards": Array of standards across age groups if applicable (e.g. Children, Adults, Elderly), so the reader can tally with their age.
     - "genderStandards": If standard reference ranges differ for Male vs Female (e.g. for Hemoglobin, Creatinine, Ferritin, Uric Acid), provide {"male": "...", "female": "..."}.
     - "unit": Measurement unit.
     - "regionOrLocationNote": Note on standard units or regional conventions if relevant (e.g. "Standard conventional unit mg/dL in India & US; mmol/L used in UK/Europe").
   - "whatItPortrays": In-depth, compassionate explanation in plain English describing what this specific result portrays about the patient's health and daily physical state.
   - "actionableTip": Practical dietary, hydration, or lifestyle guidance.
3. Compute an "Average Health Score" from 0 to 100 based on the proportion of optimal vs deviated/abnormal parameters, and provide an encouraging, plain-English summary.
4. Highlight any "criticalAlerts" that require prompt physician follow-up.
5. Provide practical "lifestyleRecommendations" and 3-4 specific "doctorDiscussionQuestions" that empower the patient during their next doctor appointment.

Return STRICTLY valid JSON matching this schema:
{
  "patient": {
    "name": "Patient Name or 'Patient'",
    "age": "Patient age if visible",
    "gender": "Male / Female / Not stated",
    "referredByDoctor": "Doctor name if visible",
    "labName": "Diagnostic laboratory or hospital name",
    "collectionDate": "Sample collection date if visible",
    "reportDate": "Report date if visible"
  },
  "healthScore": {
    "score": 85,
    "rating": "Optimal" | "Good" | "Needs Attention" | "Critical Attention",
    "summary": "2-3 sentence layman summary of overall findings in easy words"
  },
  "criticalAlerts": [
    "Urgent items requiring doctor consultation"
  ],
  "parameters": [
    {
      "id": "param-1",
      "testName": "Hemoglobin (Hb)",
      "commonName": "Oxygen Carrier in Blood",
      "category": "Complete Blood Count",
      "laymanExplanation": "Measures the protein in your red blood cells that carries oxygen from your lungs to the rest of your body.",
      "observedValue": "11.2",
      "unit": "g/dL",
      "status": "mild_deviation",
      "statusLabel": "Mildly Low",
      "referenceStandards": {
        "standardRange": "12.0 - 16.0 g/dL",
        "ageStandards": [
          { "ageGroup": "Children (1-12 yrs)", "range": "11.5 - 13.5 g/dL" },
          { "ageGroup": "Adults (18-60 yrs)", "range": "12.0 - 16.5 g/dL" },
          { "ageGroup": "Seniors (60+ yrs)", "range": "11.5 - 15.5 g/dL" }
        ],
        "genderStandards": {
          "male": "13.8 - 17.2 g/dL",
          "female": "12.1 - 15.1 g/dL"
        },
        "unit": "g/dL",
        "regionOrLocationNote": "Standard conventional reporting in g/dL"
      },
      "whatItPortrays": "Your hemoglobin is slightly below the expected threshold for adult females, which indicates mild anemia. This may explain mild daytime tiredness or low stamina.",
      "actionableTip": "Include iron-rich foods such as spinach, lentils, beetroot, and vitamin C to enhance iron absorption."
    }
  ],
  "lifestyleRecommendations": [
    "Practical daily health guidance"
  ],
  "doctorDiscussionQuestions": [
    "Questions patient can ask their physician"
  ]
}`;

    const response = await model.generateContent([
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType
        }
      },
      prompt
    ]);

    const responseText = response.response.text();
    if (!responseText) {
      throw new Error("Gemini returned an empty response. Please verify that the report image is clear and legible.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    const rawParameters = Array.isArray(parsed.parameters) ? parsed.parameters : [];

    let normalCount = 0;
    let deviatedCount = 0;
    let criticalCount = 0;

    const parameters = rawParameters.map((p: any, idx: number) => {
      const status =
        p.status === "attention_required"
          ? "attention_required"
          : p.status === "mild_deviation"
          ? "mild_deviation"
          : "optimal";

      if (status === "optimal") normalCount++;
      else if (status === "mild_deviation") deviatedCount++;
      else criticalCount++;

      return {
        id: p.id || `param_${idx + 1}`,
        testName: p.testName || "Laboratory Test",
        commonName: p.commonName || p.testName || "Health Marker",
        category: p.category || "General Pathology",
        laymanExplanation:
          p.laymanExplanation || "This test measures a vital physiological substance in your body.",
        observedValue: String(p.observedValue || "Not specified"),
        unit: p.unit || "",
        status,
        statusLabel: p.statusLabel || (status === "optimal" ? "Normal" : "Out of Range"),
        referenceStandards: {
          standardRange: p.referenceStandards?.standardRange || "Normal range varies",
          ageStandards: Array.isArray(p.referenceStandards?.ageStandards)
            ? p.referenceStandards.ageStandards
            : [],
          genderStandards: p.referenceStandards?.genderStandards || undefined,
          unit: p.referenceStandards?.unit || p.unit || "",
          regionOrLocationNote: p.referenceStandards?.regionOrLocationNote || undefined
        },
        whatItPortrays:
          p.whatItPortrays || "Result evaluated within acceptable clinical laboratory boundaries.",
        actionableTip: p.actionableTip || undefined
      };
    });

    const calculatedScore =
      typeof parsed.healthScore?.score === "number" && !isNaN(parsed.healthScore.score)
        ? Math.min(100, Math.max(0, Math.round(parsed.healthScore.score)))
        : parameters.length > 0
        ? Math.round(
            ((normalCount * 1.0 + deviatedCount * 0.5) / Math.max(1, parameters.length)) * 100
          )
        : 80;

    const rating: "Optimal" | "Good" | "Needs Attention" | "Critical Attention" =
      calculatedScore >= 88
        ? "Optimal"
        : calculatedScore >= 72
        ? "Good"
        : calculatedScore >= 55
        ? "Needs Attention"
        : "Critical Attention";

    const result: LabReportAnalysisResult = {
      id: `report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      patient: {
        name: parsed.patient?.name || "Patient",
        age: parsed.patient?.age || undefined,
        gender: parsed.patient?.gender || undefined,
        referredByDoctor: parsed.patient?.referredByDoctor || undefined,
        labName: parsed.patient?.labName || "Diagnostic Centre",
        collectionDate: parsed.patient?.collectionDate || undefined,
        reportDate: parsed.patient?.reportDate || new Date().toLocaleDateString("en-GB")
      },
      healthScore: {
        score: calculatedScore,
        rating,
        summary:
          parsed.healthScore?.summary ||
          "Your pathology report has been analyzed into clear layman findings. Review parameter cards below."
      },
      keyFindings: {
        totalTestsCount: parameters.length,
        normalCount,
        deviatedCount,
        criticalCount
      },
      criticalAlerts: Array.isArray(parsed.criticalAlerts) ? parsed.criticalAlerts : [],
      parameters,
      lifestyleRecommendations: Array.isArray(parsed.lifestyleRecommendations)
        ? parsed.lifestyleRecommendations
        : ["Maintain balanced nutrition, regular hydration, and follow physician counsel."],
      doctorDiscussionQuestions: Array.isArray(parsed.doctorDiscussionQuestions)
        ? parsed.doctorDiscussionQuestions
        : ["Are any medications or follow-up re-tests required for these results?"],
      modelUsed: "Clinical Pathology Intelligence Engine",
      processingTimeMs: Date.now() - startTime
    };

    return result;
  } finally {
    try {
      await fs.unlink(tempFilePath);
    } catch {}

    if (uploadedFileName) {
      try {
        await fileManager.deleteFile(uploadedFileName);
      } catch {}
    }
  }
}
