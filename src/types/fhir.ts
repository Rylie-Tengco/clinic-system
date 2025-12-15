// FHIR R4 Type Definitions for Clinic System

// Base FHIR Resource interface
export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: Meta;
}

export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
}

// FHIR Bundle for collections
export interface Bundle<T extends FHIRResource = FHIRResource> {
  resourceType: "Bundle";
  type: "collection" | "searchset" | "document" | "message" | "transaction" | "transaction-response" | "batch" | "batch-response" | "history";
  total?: number;
  entry?: BundleEntry<T>[];
}

export interface BundleEntry<T extends FHIRResource = FHIRResource> {
  fullUrl?: string;
  resource?: T;
}

// Common FHIR Data Types
export interface HumanName {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface ContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
}

export interface Address {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Identifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: CodeableConcept;
  system?: string;
  value?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Quantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

// FHIR Patient Resource
export interface Patient extends FHIRResource {
  resourceType: "Patient";
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: "male" | "female" | "other" | "unknown";
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

// FHIR Practitioner Resource
export interface Practitioner extends FHIRResource {
  resourceType: "Practitioner";
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: Address[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  qualification?: PractitionerQualification[];
}

export interface PractitionerQualification {
  identifier?: Identifier[];
  code: CodeableConcept;
  period?: Period;
  issuer?: Reference;
}

// FHIR Appointment Resource
export interface Appointment extends FHIRResource {
  resourceType: "Appointment";
  identifier?: Identifier[];
  status: AppointmentStatus;
  serviceCategory?: CodeableConcept[];
  serviceType?: CodeableConcept[];
  specialty?: CodeableConcept[];
  appointmentType?: CodeableConcept;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  priority?: number;
  description?: string;
  start?: string;
  end?: string;
  minutesDuration?: number;
  created?: string;
  comment?: string;
  patientInstruction?: string;
  participant: AppointmentParticipant[];
}

export type AppointmentStatus =
  | "proposed"
  | "pending"
  | "booked"
  | "arrived"
  | "fulfilled"
  | "cancelled"
  | "noshow"
  | "entered-in-error"
  | "checked-in"
  | "waitlist";

export interface AppointmentParticipant {
  type?: CodeableConcept[];
  actor?: Reference;
  required?: "required" | "optional" | "information-only";
  status: "accepted" | "declined" | "tentative" | "needs-action";
}

// FHIR Encounter Resource
export interface Encounter extends FHIRResource {
  resourceType: "Encounter";
  identifier?: Identifier[];
  status: EncounterStatus;
  class: Coding;
  type?: CodeableConcept[];
  serviceType?: CodeableConcept;
  priority?: CodeableConcept;
  subject?: Reference;
  participant?: EncounterParticipant[];
  appointment?: Reference[];
  period?: Period;
  length?: Duration;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  diagnosis?: EncounterDiagnosis[];
  hospitalization?: EncounterHospitalization;
  location?: EncounterLocation[];
}

export type EncounterStatus =
  | "planned"
  | "arrived"
  | "triaged"
  | "in-progress"
  | "onleave"
  | "finished"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export interface EncounterParticipant {
  type?: CodeableConcept[];
  period?: Period;
  individual?: Reference;
}

export interface EncounterDiagnosis {
  condition: Reference;
  use?: CodeableConcept;
  rank?: number;
}

export interface EncounterHospitalization {
  preAdmissionIdentifier?: Identifier;
  origin?: Reference;
  admitSource?: CodeableConcept;
  reAdmission?: CodeableConcept;
  dietPreference?: CodeableConcept[];
  specialCourtesy?: CodeableConcept[];
  specialArrangement?: CodeableConcept[];
  destination?: Reference;
  dischargeDisposition?: CodeableConcept;
}

export interface EncounterLocation {
  location: Reference;
  status?: "planned" | "active" | "reserved" | "completed";
  physicalType?: CodeableConcept;
  period?: Period;
}

export interface Duration {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

// FHIR Observation Resource
export interface Observation extends FHIRResource {
  resourceType: "Observation";
  identifier?: Identifier[];
  status: ObservationStatus;
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  referenceRange?: ObservationReferenceRange[];
  component?: ObservationComponent[];
}

export type ObservationStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export interface ObservationReferenceRange {
  low?: Quantity;
  high?: Quantity;
  type?: CodeableConcept;
  appliesTo?: CodeableConcept[];
  age?: Range;
  text?: string;
}

export interface Range {
  low?: Quantity;
  high?: Quantity;
}

export interface ObservationComponent {
  code: CodeableConcept;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: ObservationReferenceRange[];
}

// FHIR Condition Resource
export interface Condition extends FHIRResource {
  resourceType: "Condition";
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetAge?: Quantity;
  onsetPeriod?: Period;
  onsetRange?: Range;
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: Quantity;
  abatementPeriod?: Period;
  abatementRange?: Range;
  abatementString?: string;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: ConditionStage[];
  evidence?: ConditionEvidence[];
  note?: Annotation[];
}

export interface ConditionStage {
  summary?: CodeableConcept;
  assessment?: Reference[];
  type?: CodeableConcept;
}

export interface ConditionEvidence {
  code?: CodeableConcept[];
  detail?: Reference[];
}

// FHIR MedicationRequest Resource
export interface MedicationRequest extends FHIRResource {
  resourceType: "MedicationRequest";
  identifier?: Identifier[];
  status: MedicationRequestStatus;
  statusReason?: CodeableConcept;
  intent: MedicationRequestIntent;
  category?: CodeableConcept[];
  priority?: "routine" | "urgent" | "asap" | "stat";
  doNotPerform?: boolean;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject: Reference;
  encounter?: Reference;
  authoredOn?: string;
  requester?: Reference;
  performer?: Reference;
  performerType?: CodeableConcept;
  recorder?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: Reference[];
  courseOfTherapyType?: CodeableConcept;
  insurance?: Reference[];
  note?: Annotation[];
  dosageInstruction?: Dosage[];
  dispenseRequest?: MedicationRequestDispenseRequest;
  substitution?: MedicationRequestSubstitution;
}

export type MedicationRequestStatus =
  | "active"
  | "on-hold"
  | "cancelled"
  | "completed"
  | "entered-in-error"
  | "stopped"
  | "draft"
  | "unknown";

export type MedicationRequestIntent =
  | "proposal"
  | "plan"
  | "order"
  | "original-order"
  | "reflex-order"
  | "filler-order"
  | "instance-order"
  | "option";

export interface Dosage {
  sequence?: number;
  text?: string;
  additionalInstruction?: CodeableConcept[];
  patientInstruction?: string;
  timing?: Timing;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: CodeableConcept;
  site?: CodeableConcept;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: DoseAndRate[];
  maxDosePerPeriod?: Ratio;
  maxDosePerAdministration?: Quantity;
  maxDosePerLifetime?: Quantity;
}

export interface Timing {
  event?: string[];
  repeat?: TimingRepeat;
  code?: CodeableConcept;
}

export interface TimingRepeat {
  boundsDuration?: Duration;
  boundsPeriod?: Period;
  boundsRange?: Range;
  count?: number;
  countMax?: number;
  duration?: number;
  durationMax?: number;
  durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
  dayOfWeek?: string[];
  timeOfDay?: string[];
  when?: string[];
  offset?: number;
}

export interface DoseAndRate {
  type?: CodeableConcept;
  doseRange?: Range;
  doseQuantity?: Quantity;
  rateRatio?: Ratio;
  rateRange?: Range;
  rateQuantity?: Quantity;
}

export interface Ratio {
  numerator?: Quantity;
  denominator?: Quantity;
}

export interface MedicationRequestDispenseRequest {
  initialFill?: {
    quantity?: Quantity;
    duration?: Duration;
  };
  dispenseInterval?: Duration;
  validityPeriod?: Period;
  numberOfRepeatsAllowed?: number;
  quantity?: Quantity;
  expectedSupplyDuration?: Duration;
  performer?: Reference;
}

export interface MedicationRequestSubstitution {
  allowedBoolean?: boolean;
  allowedCodeableConcept?: CodeableConcept;
  reason?: CodeableConcept;
}

// FHIR Organization Resource
export interface Organization extends FHIRResource {
  resourceType: "Organization";
  identifier?: Identifier[];
  active?: boolean;
  type?: CodeableConcept[];
  name?: string;
  alias?: string[];
  telecom?: ContactPoint[];
  address?: Address[];
  partOf?: Reference;
  contact?: OrganizationContact[];
}

export interface OrganizationContact {
  purpose?: CodeableConcept;
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
}

// Common LOINC/SNOMED codes for observations
export const VITAL_SIGNS_CODES = {
  BLOOD_PRESSURE: {
    system: "http://loinc.org",
    code: "85354-9",
    display: "Blood pressure panel",
  },
  SYSTOLIC_BP: {
    system: "http://loinc.org",
    code: "8480-6",
    display: "Systolic blood pressure",
  },
  DIASTOLIC_BP: {
    system: "http://loinc.org",
    code: "8462-4",
    display: "Diastolic blood pressure",
  },
  HEART_RATE: {
    system: "http://loinc.org",
    code: "8867-4",
    display: "Heart rate",
  },
  BODY_TEMPERATURE: {
    system: "http://loinc.org",
    code: "8310-5",
    display: "Body temperature",
  },
  RESPIRATORY_RATE: {
    system: "http://loinc.org",
    code: "9279-1",
    display: "Respiratory rate",
  },
  OXYGEN_SATURATION: {
    system: "http://loinc.org",
    code: "2708-6",
    display: "Oxygen saturation",
  },
  BODY_HEIGHT: {
    system: "http://loinc.org",
    code: "8302-2",
    display: "Body height",
  },
  BODY_WEIGHT: {
    system: "http://loinc.org",
    code: "29463-7",
    display: "Body weight",
  },
  BMI: {
    system: "http://loinc.org",
    code: "39156-5",
    display: "Body mass index",
  },
} as const;

// Encounter class codes
export const ENCOUNTER_CLASS = {
  AMBULATORY: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "AMB",
    display: "ambulatory",
  },
  EMERGENCY: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "EMER",
    display: "emergency",
  },
  INPATIENT: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "IMP",
    display: "inpatient encounter",
  },
  VIRTUAL: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "VR",
    display: "virtual",
  },
} as const;

// Condition clinical status
export const CONDITION_CLINICAL_STATUS = {
  ACTIVE: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "active",
        display: "Active",
      },
    ],
  },
  RECURRENCE: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "recurrence",
        display: "Recurrence",
      },
    ],
  },
  RELAPSE: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "relapse",
        display: "Relapse",
      },
    ],
  },
  INACTIVE: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "inactive",
        display: "Inactive",
      },
    ],
  },
  REMISSION: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "remission",
        display: "Remission",
      },
    ],
  },
  RESOLVED: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
        code: "resolved",
        display: "Resolved",
      },
    ],
  },
} as const;

// Condition verification status
export const CONDITION_VERIFICATION_STATUS = {
  UNCONFIRMED: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "unconfirmed",
        display: "Unconfirmed",
      },
    ],
  },
  PROVISIONAL: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "provisional",
        display: "Provisional",
      },
    ],
  },
  DIFFERENTIAL: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "differential",
        display: "Differential",
      },
    ],
  },
  CONFIRMED: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "confirmed",
        display: "Confirmed",
      },
    ],
  },
  REFUTED: {
    coding: [
      {
        system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
        code: "refuted",
        display: "Refuted",
      },
    ],
  },
} as const;