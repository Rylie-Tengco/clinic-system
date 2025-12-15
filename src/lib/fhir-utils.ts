import type {
  Patient,
  Practitioner,
  Appointment,
  Encounter,
  Observation,
  Condition,
  MedicationRequest,
  HumanName,
  ContactPoint,
  Address,
  Reference,
  CodeableConcept,
  AppointmentStatus,
  EncounterStatus,
  ObservationStatus,
  Coding,
} from "@/types/fhir";
import { ENCOUNTER_CLASS, VITAL_SIGNS_CODES } from "@/types/fhir";

// Format FHIR HumanName to display string
export function formatHumanName(name?: HumanName): string {
  if (!name) return "Unknown";
  
  const parts: string[] = [];
  
  if (name.prefix?.length) {
    parts.push(name.prefix.join(" "));
  }
  
  if (name.given?.length) {
    parts.push(name.given.join(" "));
  }
  
  if (name.family) {
    parts.push(name.family);
  }
  
  if (name.suffix?.length) {
    parts.push(name.suffix.join(" "));
  }
  
  return parts.length > 0 ? parts.join(" ") : name.text ?? "Unknown";
}

// Get primary name from Patient/Practitioner
export function getPrimaryName(names?: HumanName[]): HumanName | undefined {
  if (!names?.length) return undefined;
  return names.find((n) => n.use === "official") ?? names[0];
}

// Format patient display name
export function getPatientDisplayName(patient: Patient): string {
  const primaryName = getPrimaryName(patient.name);
  return formatHumanName(primaryName);
}

// Format practitioner display name
export function getPractitionerDisplayName(practitioner: Practitioner): string {
  const primaryName = getPrimaryName(practitioner.name);
  return formatHumanName(primaryName);
}

// Get primary contact (phone/email)
export function getPrimaryContact(
  telecoms?: ContactPoint[],
  system?: ContactPoint["system"]
): ContactPoint | undefined {
  if (!telecoms?.length) return undefined;
  if (system) {
    return telecoms.find((t) => t.system === system);
  }
  return telecoms[0];
}

// Format phone number
export function getPhoneNumber(telecoms?: ContactPoint[]): string {
  const phone = getPrimaryContact(telecoms, "phone");
  return phone?.value ?? "";
}

// Format email
export function getEmail(telecoms?: ContactPoint[]): string {
  const email = getPrimaryContact(telecoms, "email");
  return email?.value ?? "";
}

// Get primary address
export function getPrimaryAddress(addresses?: Address[]): Address | undefined {
  if (!addresses?.length) return undefined;
  return addresses.find((a) => a.use === "home") ?? addresses[0];
}

// Format address to display string
export function formatAddress(address?: Address): string {
  if (!address) return "";
  
  const parts: string[] = [];
  
  if (address.line?.length) {
    parts.push(address.line.join(", "));
  }
  
  if (address.city) {
    parts.push(address.city);
  }
  
  if (address.state) {
    parts.push(address.state);
  }
  
  if (address.postalCode) {
    parts.push(address.postalCode);
  }
  
  if (address.country) {
    parts.push(address.country);
  }
  
  return parts.join(", ");
}

// Calculate age from birthDate
export function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Create a FHIR Reference
export function createReference(
  resourceType: string,
  id: string,
  display?: string
): Reference {
  return {
    reference: `${resourceType}/${id}`,
    type: resourceType,
    display,
  };
}

// Parse a FHIR Reference to get resource type and ID
export function parseReference(reference?: Reference): { type: string; id: string } | null {
  if (!reference?.reference) return null;
  
  const parts = reference.reference.split("/");
  if (parts.length !== 2) return null;
  
  return {
    type: parts[0],
    id: parts[1],
  };
}

// Create a CodeableConcept
export function createCodeableConcept(
  code: string,
  display: string,
  system?: string
): CodeableConcept {
  return {
    coding: [
      {
        system,
        code,
        display,
      },
    ],
    text: display,
  };
}

// Get display text from CodeableConcept
export function getCodeableConceptDisplay(concept?: CodeableConcept): string {
  if (!concept) return "";
  return concept.text ?? concept.coding?.[0]?.display ?? concept.coding?.[0]?.code ?? "";
}

// Appointment status helpers
export function getAppointmentStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    proposed: "bg-yellow-100 text-yellow-800",
    pending: "bg-orange-100 text-orange-800",
    booked: "bg-blue-100 text-blue-800",
    arrived: "bg-purple-100 text-purple-800",
    fulfilled: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    noshow: "bg-gray-100 text-gray-800",
    "entered-in-error": "bg-red-100 text-red-800",
    "checked-in": "bg-indigo-100 text-indigo-800",
    waitlist: "bg-cyan-100 text-cyan-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    proposed: "Proposed",
    pending: "Pending",
    booked: "Booked",
    arrived: "Arrived",
    fulfilled: "Completed",
    cancelled: "Cancelled",
    noshow: "No Show",
    "entered-in-error": "Error",
    "checked-in": "Checked In",
    waitlist: "Waitlist",
  };
  return labels[status] ?? status;
}

// Encounter status helpers
export function getEncounterStatusColor(status: EncounterStatus): string {
  const colors: Record<EncounterStatus, string> = {
    planned: "bg-blue-100 text-blue-800",
    arrived: "bg-purple-100 text-purple-800",
    triaged: "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-green-100 text-green-800",
    onleave: "bg-orange-100 text-orange-800",
    finished: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    "entered-in-error": "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function getEncounterStatusLabel(status: EncounterStatus): string {
  const labels: Record<EncounterStatus, string> = {
    planned: "Planned",
    arrived: "Arrived",
    triaged: "Triaged",
    "in-progress": "In Progress",
    onleave: "On Leave",
    finished: "Finished",
    cancelled: "Cancelled",
    "entered-in-error": "Error",
    unknown: "Unknown",
  };
  return labels[status] ?? status;
}

// Observation status helpers
export function getObservationStatusColor(status: ObservationStatus): string {
  const colors: Record<ObservationStatus, string> = {
    registered: "bg-blue-100 text-blue-800",
    preliminary: "bg-yellow-100 text-yellow-800",
    final: "bg-green-100 text-green-800",
    amended: "bg-orange-100 text-orange-800",
    corrected: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
    "entered-in-error": "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

// Get encounter class coding
export function getEncounterClassCoding(type: keyof typeof ENCOUNTER_CLASS): Coding {
  return ENCOUNTER_CLASS[type];
}

// Get vital sign code
export function getVitalSignCode(type: keyof typeof VITAL_SIGNS_CODES): Coding {
  return VITAL_SIGNS_CODES[type];
}

// Create a new Patient resource
export function createPatientResource(data: {
  givenName: string;
  familyName: string;
  gender: Patient["gender"];
  birthDate: string;
  phone?: string;
  email?: string;
  address?: {
    line?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}): Omit<Patient, "id" | "meta"> {
  const telecom: ContactPoint[] = [];
  
  if (data.phone) {
    telecom.push({ system: "phone", value: data.phone, use: "mobile" });
  }
  
  if (data.email) {
    telecom.push({ system: "email", value: data.email });
  }
  
  const address: Address[] = [];
  if (data.address) {
    address.push({
      use: "home",
      line: data.address.line ? [data.address.line] : undefined,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postalCode,
    });
  }
  
  return {
    resourceType: "Patient",
    active: true,
    name: [
      {
        use: "official",
        family: data.familyName,
        given: [data.givenName],
      },
    ],
    gender: data.gender,
    birthDate: data.birthDate,
    telecom: telecom.length > 0 ? telecom : undefined,
    address: address.length > 0 ? address : undefined,
  };
}

// Create a new Practitioner resource
export function createPractitionerResource(data: {
  givenName: string;
  familyName: string;
  gender?: Practitioner["gender"];
  phone?: string;
  email?: string;
  specialty?: string;
}): Omit<Practitioner, "id" | "meta"> {
  const telecom: ContactPoint[] = [];
  
  if (data.phone) {
    telecom.push({ system: "phone", value: data.phone, use: "work" });
  }
  
  if (data.email) {
    telecom.push({ system: "email", value: data.email, use: "work" });
  }
  
  return {
    resourceType: "Practitioner",
    active: true,
    name: [
      {
        use: "official",
        family: data.familyName,
        given: [data.givenName],
      },
    ],
    gender: data.gender,
    telecom: telecom.length > 0 ? telecom : undefined,
    qualification: data.specialty
      ? [
          {
            code: createCodeableConcept(
              data.specialty.toLowerCase().replace(/\s+/g, "-"),
              data.specialty
            ),
          },
        ]
      : undefined,
  };
}

// Create a new Appointment resource
export function createAppointmentResource(data: {
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  start: string;
  end: string;
  description?: string;
  status?: AppointmentStatus;
}): Omit<Appointment, "id" | "meta"> {
  return {
    resourceType: "Appointment",
    status: data.status ?? "booked",
    description: data.description,
    start: data.start,
    end: data.end,
    created: new Date().toISOString(),
    participant: [
      {
        actor: createReference("Patient", data.patientId, data.patientName),
        status: "accepted",
      },
      {
        actor: createReference("Practitioner", data.practitionerId, data.practitionerName),
        status: "accepted",
      },
    ],
  };
}

// Create a new Encounter resource
export function createEncounterResource(data: {
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  appointmentId?: string;
  status?: EncounterStatus;
  classType?: keyof typeof ENCOUNTER_CLASS;
}): Omit<Encounter, "id" | "meta"> {
  return {
    resourceType: "Encounter",
    status: data.status ?? "in-progress",
    class: getEncounterClassCoding(data.classType ?? "AMBULATORY"),
    subject: createReference("Patient", data.patientId, data.patientName),
    participant: [
      {
        individual: createReference("Practitioner", data.practitionerId, data.practitionerName),
      },
    ],
    appointment: data.appointmentId
      ? [createReference("Appointment", data.appointmentId)]
      : undefined,
    period: {
      start: new Date().toISOString(),
    },
  };
}

// Create a new Observation resource
export function createObservationResource(data: {
  patientId: string;
  patientName: string;
  encounterId?: string;
  practitionerId?: string;
  practitionerName?: string;
  code: CodeableConcept;
  value: number;
  unit: string;
  status?: ObservationStatus;
}): Omit<Observation, "id" | "meta"> {
  return {
    resourceType: "Observation",
    status: data.status ?? "final",
    code: data.code,
    subject: createReference("Patient", data.patientId, data.patientName),
    encounter: data.encounterId
      ? createReference("Encounter", data.encounterId)
      : undefined,
    performer: data.practitionerId && data.practitionerName
      ? [createReference("Practitioner", data.practitionerId, data.practitionerName)]
      : undefined,
    effectiveDateTime: new Date().toISOString(),
    valueQuantity: {
      value: data.value,
      unit: data.unit,
      system: "http://unitsofmeasure.org",
    },
  };
}

// Create a new Condition resource
export function createConditionResource(data: {
  patientId: string;
  patientName: string;
  encounterId?: string;
  code: CodeableConcept;
  clinicalStatus: CodeableConcept;
  verificationStatus?: CodeableConcept;
}): Omit<Condition, "id" | "meta"> {
  return {
    resourceType: "Condition",
    clinicalStatus: data.clinicalStatus,
    verificationStatus: data.verificationStatus,
    code: data.code,
    subject: createReference("Patient", data.patientId, data.patientName),
    encounter: data.encounterId
      ? createReference("Encounter", data.encounterId)
      : undefined,
    recordedDate: new Date().toISOString(),
  };
}

// Create a new MedicationRequest resource
export function createMedicationRequestResource(data: {
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  encounterId?: string;
  medication: CodeableConcept;
  dosageText?: string;
}): Omit<MedicationRequest, "id" | "meta"> {
  return {
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    medicationCodeableConcept: data.medication,
    subject: createReference("Patient", data.patientId, data.patientName),
    encounter: data.encounterId
      ? createReference("Encounter", data.encounterId)
      : undefined,
    requester: createReference("Practitioner", data.practitionerId, data.practitionerName),
    authoredOn: new Date().toISOString(),
    dosageInstruction: data.dosageText
      ? [{ text: data.dosageText }]
      : undefined,
  };
}