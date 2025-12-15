export type ToolName =
  | "create_patient"
  | "query_fhir"
  | "create_practitioner"
  | "create_appointment"
  | "update_appointment"
  | "create_encounter"
  | "update_encounter"
  | "create_observation"
  | "create_condition"
  | "update_condition"
  | "create_medication_request"
  | "update_medication_request"
  | "delete_resource"
  | "read_resource"
  | "list_resources";

export type ResourceType =
  | "patients"
  | "practitioners"
  | "appointments"
  | "encounters"
  | "observations"
  | "conditions"
  | "medication-requests";

export interface CreatePatientParams {
  tool: "create_patient";
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "male" | "female" | "other" | "unknown";
  phone?: string;
  email?: string;
  address?: {
    line?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface QueryFhirParams {
  tool: "query_fhir";
  resource: "patients" | "practitioners" | "appointments" | "encounters" | "observations" | "conditions" | "medication-requests";
  id?: string;
}

export interface CreatePractitionerParams {
  tool: "create_practitioner";
  firstName: string;
  lastName: string;
  gender: "male" | "female" | "other" | "unknown";
  specialty?: string;
  phone?: string;
  email?: string;
}

export interface CreateAppointmentParams {
  tool: "create_appointment";
  patientId: string;
  practitionerId: string;
  start: string;
  end: string;
  description?: string;
  status?: "proposed" | "pending" | "booked" | "arrived" | "fulfilled" | "cancelled" | "noshow";
  serviceType?: string;
}

export interface UpdateAppointmentParams {
  tool: "update_appointment";
  id: string;
  status?: "proposed" | "pending" | "booked" | "arrived" | "fulfilled" | "cancelled" | "noshow";
  start?: string;
  end?: string;
  description?: string;
}

export interface CreateEncounterParams {
  tool: "create_encounter";
  patientId: string;
  practitionerId: string;
  encounterClass: "ambulatory" | "emergency" | "inpatient" | "virtual";
  type?: string;
  reasonCode?: string;
  status?: "planned" | "arrived" | "triaged" | "in-progress" | "onleave" | "finished" | "cancelled";
}

export interface UpdateEncounterParams {
  tool: "update_encounter";
  id: string;
  status?: "planned" | "arrived" | "triaged" | "in-progress" | "onleave" | "finished" | "cancelled";
  endDate?: string;
}

export interface CreateObservationParams {
  tool: "create_observation";
  patientId: string;
  encounterId?: string;
  code: string;
  codeDisplay: string;
  category: "vital-signs" | "laboratory" | "imaging" | "procedure" | "exam";
  valueQuantity?: {
    value: number;
    unit: string;
  };
  valueString?: string;
  component?: Array<{
    code: string;
    codeDisplay: string;
    value: number;
    unit: string;
  }>;
}

export interface CreateConditionParams {
  tool: "create_condition";
  patientId: string;
  code: string;
  codeDisplay: string;
  clinicalStatus: "active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved";
  verificationStatus?: "unconfirmed" | "provisional" | "differential" | "confirmed" | "refuted";
  severity?: "mild" | "moderate" | "severe";
  onsetDate?: string;
  note?: string;
}

export interface UpdateConditionParams {
  tool: "update_condition";
  id: string;
  clinicalStatus?: "active" | "recurrence" | "relapse" | "inactive" | "remission" | "resolved";
  abatementDate?: string;
  note?: string;
}

export interface CreateMedicationRequestParams {
  tool: "create_medication_request";
  patientId: string;
  practitionerId: string;
  medicationName: string;
  dosageInstruction: string;
  intent?: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order";
  priority?: "routine" | "urgent" | "asap" | "stat";
  status?: "active" | "on-hold" | "cancelled" | "completed" | "stopped" | "draft";
}

export interface UpdateMedicationRequestParams {
  tool: "update_medication_request";
  id: string;
  status?: "active" | "on-hold" | "cancelled" | "completed" | "stopped" | "draft";
}

export interface DeleteResourceParams {
  tool: "delete_resource";
  resourceType: ResourceType;
  id: string;
}

export interface ReadResourceParams {
  tool: "read_resource";
  resourceType: ResourceType;
  id: string;
}

export interface ListResourcesParams {
  tool: "list_resources";
  resourceType: ResourceType;
  limit?: number;
  patientId?: string;
  practitionerId?: string;
  status?: string;
}