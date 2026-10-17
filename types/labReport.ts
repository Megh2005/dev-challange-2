export type ParameterStatus = "optimal" | "mild_deviation" | "attention_required";

export interface AgeStandard {
  ageGroup: string; // e.g., "Children (1-12 yrs)", "Adults (18-50 yrs)", "Seniors (50+ yrs)"
  range: string;    // e.g., "11.5 - 13.5 g/dL"
}

export interface GenderStandard {
  male: string;   // e.g., "13.8 - 17.2 g/dL"
  female: string; // e.g., "12.1 - 15.1 g/dL"
}

export interface ReferenceStandards {
  standardRange: string;         // General standard range
  ageStandards?: AgeStandard[];  // Breakdown by age groups
  genderStandards?: GenderStandard; // Breakdown by male / female
  unit: string;                  // Measurement unit (e.g. mg/dL, g/dL, U/L)
  regionOrLocationNote?: string; // Regional standards or conventional vs SI units
}

export interface LabReportParameter {
  id: string;
  testName: string;              // Technical test name, e.g. "Serum Creatinine"
  commonName: string;            // Layman name, e.g. "Kidney Filtration Marker"
  category: string;              // e.g., "Complete Blood Count", "Kidney Function", "Lipid Profile"
  laymanExplanation: string;     // Simple everyday explanation of what this test measures
  observedValue: string;         // e.g., "1.4"
  unit: string;                  // e.g., "mg/dL"
  status: ParameterStatus;       // "optimal" | "mild_deviation" | "attention_required"
  statusLabel: string;           // "Normal", "Slightly Elevated", "High", "Low"
  referenceStandards: ReferenceStandards;
  whatItPortrays: string;        // Plain-English explanation of what this result means for the body
  actionableTip?: string;        // Simple dietary or lifestyle suggestion
}

export interface LabReportPatientInfo {
  name: string;
  age?: string;
  gender?: string;
  referredByDoctor?: string;
  labName?: string;
  collectionDate?: string;
  reportDate?: string;
}

export interface LabReportAnalysisResult {
  id: string;
  timestamp: string;
  patient: LabReportPatientInfo;
  healthScore: {
    score: number;               // 0 to 100 average health score
    rating: "Optimal" | "Good" | "Needs Attention" | "Critical Attention";
    summary: string;             // Layman overall health summary paragraph
  };
  keyFindings: {
    totalTestsCount: number;
    normalCount: number;
    deviatedCount: number;
    criticalCount: number;
  };
  criticalAlerts: string[];      // Urgent parameter alerts if any
  parameters: LabReportParameter[];
  lifestyleRecommendations: string[];
  doctorDiscussionQuestions: string[];
  modelUsed: string;
  processingTimeMs: number;
}
