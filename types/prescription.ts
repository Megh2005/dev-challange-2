export interface DoctorInfo {
  name: string;
  degrees: string;
  registrationNumber: string;
  clinicOrHospital: string;
  contactNumber: string;
  consultationDate: string;
}

export interface PatientInfo {
  name: string;
  age: string;
  gender: string;
  weight?: string;
  diagnosis: string;
  chiefComplaints: string[];
  vitals?: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    spo2?: string;
  };
}

export interface PrescribedMedicine {
  id: string;
  name: string;
  brandName: string;
  genericName: string;
  chemicalComposition: string;
  dosage: string;
  frequencyOriginal: string;
  frequencyDecoded: string;
  duration: string;
  timingInstruction: string;
  primaryIndication: string;
  guidelines: string[];
  shortNote: string;
}

export interface LabTest {
  id: string;
  testName: string;
  clinicalReason: string;
  instructions: string;
}

export interface PrescriptionScanResult {
  id: string;
  timestamp: string;
  doctor: DoctorInfo;
  patient: PatientInfo;
  medicines: PrescribedMedicine[];
  labTests: LabTest[];
  generalAdvice: string[];
  followUp: string;
  rawOcrText: string;
  modelUsed: string;
  processingTimeMs: number;
}
