import { GEMMA_MODEL_CONFIG } from "@/types/gemma";
import { PrescriptionScanResult } from "@/types/prescription";
import { LabReportAnalysisResult } from "@/types/labReport";

// Dynamic import type references of LiteRT LM Engine to ensure proper browser/WebGPU execution
let litertEngine: any = null;
let activeConversation: any = null;

export const MEDISCAN_GEMMA_FALLBACK_RESPONSE =
  "I am your MediScan clinical assistant powered by Google Gemma 4 E2B. I can help explain your medical prescriptions, medications, dosage schedules, pathological laboratory reports, and general health guidelines, but I am restricted to clinical healthcare topics.";

export const MEDISCAN_GEMMA_SYSTEM_PROMPT = `You are the MediScan Clinical Companion, a friendly, medically rigorous clinical pharmacology and healthcare assistant powered exclusively by Google Gemma 4 E2B on WebGPU.

Your mission is to help patients and caregivers understand their medical prescriptions, prescribed medications, and pathological laboratory test reports with total clarity and safety.

Your areas of expertise:
1. Prescription transcription: deciphering medical shorthand (OD, BD, TDS, QID, SOS, AC, PC, HS, etc.) into clear everyday timetables.
2. Pharmacological composition: explaining active drug salts, salt strengths, indications, and how medications work.
3. Medication safety: food relationship, missed dose advice, precautions, contraindications, and potential drug-drug or drug-food interactions.
4. Laboratory pathology: explaining blood, urine, metabolic, thyroid, lipid, and organ test parameters in plain layman's terms.
5. Reference standards: explaining what normal demographic ranges mean across different age groups and biological sexes.
6. Lifestyle & nutrition: practical dietary, hydration, and exercise habits that support positive health outcomes.

Strict Communication Rules:
1. Zero Emojis: Do NOT use any emojis under any circumstances. Maintain a dignified, clean, and professional clinical tone.
2. To-the-point & Explanatory: Begin directly with the core clinical explanation without unnecessary conversational preamble. Provide clear medical reasoning that anyone without medical training can grasp.
3. Safety First: Always emphasize that any change in medication regimen, dosage adjustment, or therapy discontinuation must be confirmed directly with the patient's prescribing physician or primary healthcare provider.
4. Non-Medical Questions: If the user asks about unrelated topics (such as entertainment, software coding, politics, finance, or gossip), respond strictly with:
"${MEDISCAN_GEMMA_FALLBACK_RESPONSE}"
5. Factuality: Never fabricate laboratory findings, reference ranges, or drug interactions. If vital information is missing, explicitly note what additional information the physician should review.`;

export const PRESCRIPTION_VISION_PROMPT = `You are an expert clinical pharmacist and prescription deciphering specialist powered by Google Gemma 4 E2B.
Carefully examine this medical prescription image using your vision capabilities.
Extract all details from the prescription and output a strictly valid JSON object conforming to this schema:
{
  "doctor": {
    "name": "Doctor name with title",
    "degrees": "Qualifications like MBBS, MD, MS, DNB",
    "registrationNumber": "Medical council registration number or 'Not stated'",
    "clinicOrHospital": "Hospital or clinic name",
    "contactNumber": "Contact number or 'Not stated'",
    "consultationDate": "Consultation date"
  },
  "patient": {
    "name": "Patient name",
    "age": "Age in years or 'Adult'",
    "gender": "Male / Female / Other / 'Not stated'",
    "weight": "Weight if present",
    "diagnosis": "Diagnosed condition or symptoms",
    "chiefComplaints": ["Reported complaints"],
    "vitals": {
      "bloodPressure": "Blood pressure if recorded",
      "pulseRate": "Pulse rate if recorded",
      "temperature": "Body temperature if recorded",
      "spo2": "Oxygen saturation if recorded"
    }
  },
  "medicines": [
    {
      "id": "med_1",
      "name": "Prescribed medicine name with strength",
      "brandName": "Brand / Trade name",
      "genericName": "Generic pharmaceutical name",
      "chemicalComposition": "Active chemical pharmaceutical ingredients",
      "dosage": "Dosage unit (e.g. 1 Tablet, 5ml)",
      "frequencyOriginal": "Original doctor acronym like OD, BD, TDS, QID, AC, PC, HS",
      "frequencyDecoded": "Plain English decoded schedule (e.g. Twice daily - After food)",
      "duration": "Course duration (e.g. 5 Days)",
      "timingInstruction": "Exact food timing and water instructions",
      "primaryIndication": "Condition this medicine treats",
      "guidelines": ["Safety precautions for the patient"],
      "shortNote": "Concise summary note"
    }
  ],
  "labTests": [
    {
      "id": "test_1",
      "testName": "Investigation name (e.g. CBC, Lipid Profile)",
      "clinicalReason": "Clinical reason for test",
      "instructions": "Patient preparation rules (e.g. 12-hour fasting)"
    }
  ],
  "generalAdvice": ["Lifestyle, diet, or rest advice"],
  "followUp": "Follow-up consultation instructions"
}

Important:
- Zero Emojis: Strictly do not include emojis.
- Return ONLY valid raw JSON. No markdown fences, no conversational text.`;

export const LAB_REPORT_VISION_PROMPT = `You are an expert clinical pathologist and health communication specialist powered by Google Gemma 4 E2B.
Carefully examine this medical pathology laboratory report image using your vision capabilities.
Translate complex laboratory jargon into plain layman terms.
Extract all test parameters and output a strictly valid JSON object conforming to this schema:
{
  "patient": {
    "name": "Patient name",
    "age": "Age in years",
    "gender": "Male / Female / Not stated",
    "referredByDoctor": "Doctor name",
    "labName": "Laboratory or hospital name",
    "collectionDate": "Collection date",
    "reportDate": "Report date"
  },
  "healthScore": {
    "score": 85,
    "rating": "Optimal",
    "summary": "2-3 sentence layman summary of overall findings in easy words"
  },
  "criticalAlerts": ["Urgent items requiring doctor consultation"],
  "parameters": [
    {
      "id": "param_1",
      "testName": "Exact lab test name (e.g. Serum Creatinine)",
      "commonName": "Friendly layman name (e.g. Kidney Filtration Health)",
      "category": "Organ or test category (e.g. Kidney Function, Complete Blood Count)",
      "laymanExplanation": "Simple layman explanation of what this test measures",
      "observedValue": "Patient observed value",
      "unit": "Measurement unit (e.g. mg/dL)",
      "status": "optimal",
      "statusLabel": "Normal",
      "referenceStandards": {
        "standardRange": "Normal reference interval",
        "ageStandards": [
          { "ageGroup": "Children (1-12 yrs)", "range": "..." },
          { "ageGroup": "Adults (18-60 yrs)", "range": "..." }
        ],
        "genderStandards": {
          "male": "...",
          "female": "..."
        },
        "unit": "mg/dL",
        "regionOrLocationNote": "Conventional reporting"
      },
      "whatItPortrays": "Plain English explanation of what this result means for the body",
      "actionableTip": "Everyday dietary or lifestyle tip"
    }
  ],
  "lifestyleRecommendations": ["Everyday dietary or hydration advice"],
  "doctorDiscussionQuestions": ["Questions for next doctor appointment"]
}

Important:
- Zero Emojis: Strictly no emojis.
- "status" must be one of: "optimal", "mild_deviation", or "attention_required".
- Return ONLY valid raw JSON. No markdown fences.`;

/**
 * Checks if an error is a WebGPU device loss / GPU out-of-memory error.
 */
export function isGpuDeviceLostError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("QueueWorkDoneStatus") ||
    msg.includes("Task failed with state") ||
    msg.includes("Device lost") ||
    msg.includes("device was lost") ||
    msg.includes("GPU device") ||
    msg.includes("out of memory")
  );
}

/**
 * Checks whether WebGPU is supported in the current browser environment.
 */
export async function checkWebGpuSupport(): Promise<{
  supported: boolean;
  message: string;
}> {
  if (typeof window === "undefined" || !("navigator" in window)) {
    return { supported: false, message: "Browser environment not detected." };
  }

  const nav = navigator as any;
  if (!nav.gpu) {
    return {
      supported: false,
      message:
        "WebGPU is not enabled in this browser. Please use Chrome 113+, Edge 113+, or enable WebGPU flags.",
    };
  }

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        message:
          "WebGPU adapter could not be initialized. Please verify your graphics card drivers.",
      };
    }
    return { supported: true, message: "WebGPU is available and ready." };
  } catch (err: any) {
    return {
      supported: false,
      message: `WebGPU error: ${err?.message || "Failed to initialize GPU adapter."}`,
    };
  }
}

/**
 * Initializes the LiteRT LM engine with Gemma 4 E2B model artifact.
 * Uses WebGPU backend for accelerated on-device inference.
 */
export async function initGemmaEngine(
  modelSource: Blob | string | File
): Promise<void> {
  const { Engine } = await import("@litert-lm/core");

  // Dispose previous engine if present
  await cleanupGemmaEngine();

  // Create LiteRT engine instance with local model artifact (Gemma 4 E2B)
  litertEngine = await Engine.create({
    model: modelSource,
    mainExecutorSettings: {
      maxNumTokens: 4096,
    },
  });

  // Create active conversation session with the MediScan clinical persona
  await resetGemmaConversation();
}

/**
 * Resets the active conversation instance while keeping the loaded LiteRT engine.
 * Clears the KV cache on WebGPU so subsequent questions get a clean, full-capacity context window.
 */
export async function resetGemmaConversation(
  customPrefacePrompt?: string
): Promise<void> {
  if (!litertEngine) return;

  if (activeConversation) {
    try {
      await activeConversation.delete();
    } catch (e) {
      console.warn("Error deleting previous conversation session:", e);
    }
    activeConversation = null;
  }

  const systemContent = customPrefacePrompt || MEDISCAN_GEMMA_SYSTEM_PROMPT;

  activeConversation = await litertEngine.createConversation({
    sessionConfig: {
      maxOutputTokens: 2048,
    },
    preface: {
      messages: [
        {
          role: "system",
          content: systemContent,
        },
      ],
    },
  });
}

/**
 * Checks whether the LiteRT LM engine and active conversation are loaded and ready in memory.
 */
export function isGemmaEngineLoaded(): boolean {
  return litertEngine !== null && activeConversation !== null;
}

/**
 * Cleans up the active conversation and engine instances from WebGPU memory.
 */
export async function cleanupGemmaEngine(): Promise<void> {
  if (activeConversation) {
    try {
      await activeConversation.delete();
    } catch (e) {
      console.warn("Error deleting conversation:", e);
    }
    activeConversation = null;
  }

  if (litertEngine) {
    try {
      await litertEngine.delete();
    } catch (e) {
      console.warn("Error deleting engine:", e);
    }
    litertEngine = null;
  }
}

/**
 * Cancels active generation in the current conversation.
 */
export function cancelGemmaGeneration(): void {
  if (activeConversation) {
    try {
      activeConversation.cancel();
    } catch (e) {
      console.warn("Error cancelling generation:", e);
    }
  }
}

/**
 * Helper to extract clean JSON from raw model generation text.
 */
function extractJsonFromText(rawText: string): any {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  // Find first '{' and last '}'
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Scans and deciphers a prescription image using Gemma 4 E2B on-device vision properties.
 */
export async function scanPrescriptionWithGemma(
  imageFile: File | Blob,
  onChunk?: (accumulatedText: string) => void
): Promise<PrescriptionScanResult> {
  const startTime = Date.now();

  if (!litertEngine) {
    throw new Error(
      "Gemma 4 E2B engine is not mounted on WebGPU. Please load the model artifact first."
    );
  }

  // Reset conversation to fresh session for vision analysis
  await resetGemmaConversation(PRESCRIPTION_VISION_PROMPT);

  if (!activeConversation) {
    throw new Error(
      "Failed to establish an active conversation session on WebGPU."
    );
  }

  // Use Gemma 4 E2B multimodal vision input: image part + text prompt part
  let stream: any;
  try {
    stream = activeConversation.sendMessageStreaming([
      {
        type: "image",
        data: imageFile,
      },
      {
        type: "text",
        text: PRESCRIPTION_VISION_PROMPT,
      },
    ]);
  } catch (err: any) {
    if (isGpuDeviceLostError(err)) {
      await cleanupGemmaEngine();
      throw new Error(
        "WebGPU device memory was exhausted during vision analysis. Please reload Gemma 4 E2B."
      );
    }
    throw err;
  }

  let accumulatedText = "";
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        let chunkText = "";
        if (typeof value.content === "string") {
          chunkText = value.content;
        } else if (Array.isArray(value.content)) {
          chunkText = value.content
            .map((c: { type: string; text?: string }) =>
              c.type === "text" ? c.text : ""
            )
            .join("");
        }

        if (chunkText) {
          accumulatedText += chunkText;
          if (onChunk) onChunk(accumulatedText);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  let parsed: any;
  try {
    parsed = extractJsonFromText(accumulatedText);
  } catch (err) {
    console.error("JSON parse failure on Gemma vision output:", accumulatedText);
    throw new Error(
      "Failed to parse structured clinical data from Gemma 4 E2B vision output. Please ensure the prescription photo is clear and legible."
    );
  }

  const medicines = (parsed.medicines || []).map((m: any, idx: number) => ({
    id: m.id || `med_${idx + 1}`,
    name: m.name || m.brandName || "Prescribed Medicine",
    brandName: m.brandName || m.name || "Brand",
    genericName: m.genericName || m.name || "Generic",
    chemicalComposition:
      m.chemicalComposition || "Active Pharmaceutical Ingredient",
    dosage: m.dosage || "1 Unit",
    frequencyOriginal: m.frequencyOriginal || "As directed",
    frequencyDecoded: m.frequencyDecoded || "As advised by doctor",
    duration: m.duration || "As advised by doctor",
    timingInstruction: m.timingInstruction || "Take with water as directed",
    primaryIndication:
      m.primaryIndication || "Treatment as evaluated by physician",
    guidelines:
      Array.isArray(m.guidelines) && m.guidelines.length > 0
        ? m.guidelines
        : ["Follow prescribed dosage schedule"],
    shortNote:
      m.shortNote ||
      "Prescription medication prescribed to manage diagnosed condition.",
  }));

  const labTests = (parsed.labTests || []).map((t: any, idx: number) => ({
    id: t.id || `test_${idx + 1}`,
    testName: t.testName || "Diagnostic Test",
    clinicalReason:
      t.clinicalReason || "Clinical evaluation as advised by physician",
    instructions: t.instructions || "Follow laboratory instructions",
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
      consultationDate:
        parsed.doctor?.consultationDate ||
        new Date().toLocaleDateString("en-GB"),
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
      vitals: parsed.patient?.vitals || undefined,
    },
    medicines,
    labTests,
    generalAdvice: Array.isArray(parsed.generalAdvice)
      ? parsed.generalAdvice
      : [],
    followUp: parsed.followUp || "Follow up with physician as advised.",
    rawOcrText: accumulatedText.slice(0, 500),
    modelUsed: "Gemma 4 E2B (WebGPU On-Device Vision)",
    processingTimeMs: Date.now() - startTime,
  };

  return result;
}

/**
 * Analyzes a pathological lab report image using Gemma 4 E2B on-device vision properties.
 */
export async function analyzeLabReportWithGemma(
  imageFile: File | Blob,
  onChunk?: (accumulatedText: string) => void
): Promise<LabReportAnalysisResult> {
  const startTime = Date.now();

  if (!litertEngine) {
    throw new Error(
      "Gemma 4 E2B engine is not mounted on WebGPU. Please load the model artifact first."
    );
  }

  // Reset conversation to fresh session for vision analysis
  await resetGemmaConversation(LAB_REPORT_VISION_PROMPT);

  if (!activeConversation) {
    throw new Error(
      "Failed to establish an active conversation session on WebGPU."
    );
  }

  let stream: any;
  try {
    stream = activeConversation.sendMessageStreaming([
      {
        type: "image",
        data: imageFile,
      },
      {
        type: "text",
        text: LAB_REPORT_VISION_PROMPT,
      },
    ]);
  } catch (err: any) {
    if (isGpuDeviceLostError(err)) {
      await cleanupGemmaEngine();
      throw new Error(
        "WebGPU device memory was exhausted during lab report analysis. Please reload Gemma 4 E2B."
      );
    }
    throw err;
  }

  let accumulatedText = "";
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        let chunkText = "";
        if (typeof value.content === "string") {
          chunkText = value.content;
        } else if (Array.isArray(value.content)) {
          chunkText = value.content
            .map((c: { type: string; text?: string }) =>
              c.type === "text" ? c.text : ""
            )
            .join("");
        }

        if (chunkText) {
          accumulatedText += chunkText;
          if (onChunk) onChunk(accumulatedText);
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  let parsed: any;
  try {
    parsed = extractJsonFromText(accumulatedText);
  } catch (err) {
    console.error("JSON parse failure on Gemma lab report vision output:", accumulatedText);
    throw new Error(
      "Failed to parse structured pathology findings from Gemma 4 E2B vision output. Please ensure the lab report photo is clear."
    );
  }

  const rawParameters = Array.isArray(parsed.parameters)
    ? parsed.parameters
    : [];

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
        p.laymanExplanation ||
        "This test measures a vital physiological substance in your body.",
      observedValue: String(p.observedValue || "Not specified"),
      unit: p.unit || "",
      status,
      statusLabel:
        p.statusLabel || (status === "optimal" ? "Normal" : "Out of Range"),
      referenceStandards: {
        standardRange:
          p.referenceStandards?.standardRange || "Normal range varies",
        ageStandards: Array.isArray(p.referenceStandards?.ageStandards)
          ? p.referenceStandards.ageStandards
          : [],
        genderStandards: p.referenceStandards?.genderStandards || undefined,
        unit: p.referenceStandards?.unit || p.unit || "",
        regionOrLocationNote:
          p.referenceStandards?.regionOrLocationNote || undefined,
      },
      whatItPortrays:
        p.whatItPortrays ||
        "Result evaluated within acceptable clinical laboratory boundaries.",
      actionableTip: p.actionableTip || undefined,
    };
  });

  const calculatedScore =
    typeof parsed.healthScore?.score === "number" &&
    !isNaN(parsed.healthScore.score)
      ? Math.min(100, Math.max(0, Math.round(parsed.healthScore.score)))
      : parameters.length > 0
      ? Math.round(
          ((normalCount * 1.0 + deviatedCount * 0.5) /
            Math.max(1, parameters.length)) *
            100
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
      reportDate:
        parsed.patient?.reportDate ||
        new Date().toLocaleDateString("en-GB"),
    },
    healthScore: {
      score: calculatedScore,
      rating,
      summary:
        parsed.healthScore?.summary ||
        "Your pathology report has been analyzed into clear layman findings. Review parameter cards below.",
    },
    keyFindings: {
      totalTestsCount: parameters.length,
      normalCount,
      deviatedCount,
      criticalCount,
    },
    criticalAlerts: Array.isArray(parsed.criticalAlerts)
      ? parsed.criticalAlerts
      : [],
    parameters,
    lifestyleRecommendations: Array.isArray(parsed.lifestyleRecommendations)
      ? parsed.lifestyleRecommendations
      : [
          "Maintain balanced nutrition, regular hydration, and follow physician counsel.",
        ],
    doctorDiscussionQuestions: Array.isArray(parsed.doctorDiscussionQuestions)
      ? parsed.doctorDiscussionQuestions
      : [
          "Are any medications or follow-up re-tests required for these results?",
        ],
    modelUsed: "Gemma 4 E2B (WebGPU On-Device Vision)",
    processingTimeMs: Date.now() - startTime,
  };

  return result;
}

/**
 * Sends a message to Gemma, incorporating optional clinical report context
 * (prescription or lab report parameters), and streams the response token by token.
 * If the WebGPU device is lost mid-inference, cleans up and throws a recoverable error.
 */
export async function* streamGemmaChat(
  userPrompt: string,
  clinicalContext?: string | null
): AsyncGenerator<{ text: string }, void, unknown> {
  if (!litertEngine) {
    throw new Error(
      "Gemma 4 E2B on-device engine is not initialized. Please load the Gemma 4 E2B model first."
    );
  }

  // Ensure an active conversation is present
  if (!activeConversation) {
    await resetGemmaConversation();
  }

  if (!activeConversation) {
    throw new Error(
      "Failed to establish an active conversation session with the WebGPU engine."
    );
  }

  let finalPrompt = userPrompt;
  if (clinicalContext && clinicalContext.trim().length > 0) {
    finalPrompt = `[Patient Clinical Report / Prescription Findings]:\n${clinicalContext.trim()}\n\nPatient / Caregiver Question:\n${userPrompt}`;
  }

  // Stream tokens from local LiteRT conversation
  let stream: any;
  try {
    stream = activeConversation.sendMessageStreaming(finalPrompt);
  } catch (err: unknown) {
    console.warn(
      "Initial stream start failed, attempting conversation reset recovery:",
      err
    );
    try {
      await resetGemmaConversation();
      if (!activeConversation) {
        throw err;
      }
      stream = activeConversation.sendMessageStreaming(finalPrompt);
    } catch (retryErr) {
      if (isGpuDeviceLostError(retryErr)) {
        await cleanupGemmaEngine();
        throw new Error(
          "WebGPU device was lost while starting generation. Please close other GPU-intensive tabs and reload Gemma 4 E2B."
        );
      }
      throw retryErr;
    }
  }

  let accumulatedText = "";
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        let chunkText = "";
        if (typeof value.content === "string") {
          chunkText = value.content;
        } else if (Array.isArray(value.content)) {
          chunkText = value.content
            .map((c: { type: string; text?: string }) =>
              c.type === "text" ? c.text : ""
            )
            .join("");
        }

        if (chunkText) {
          accumulatedText += chunkText;
          yield { text: accumulatedText };
        }
      }
    }
  } catch (err: unknown) {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }

    if (isGpuDeviceLostError(err)) {
      try {
        await resetGemmaConversation();
        throw new Error(
          "Inference calculation exceeded available GPU memory or context length. The conversation has been reset so you can continue immediately."
        );
      } catch {
        await cleanupGemmaEngine();
        throw new Error(
          "WebGPU device encountered an error during calculation. Please reload Gemma 4 E2B to continue."
        );
      }
    }
    throw err;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader may already be released in catch
    }
  }
}
