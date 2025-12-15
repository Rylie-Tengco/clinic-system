import type { ToolResult } from "@/types/ai";
import type { CreateEncounterParams, UpdateEncounterParams } from "../types";
import type { Patient, Practitioner } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName } from "@/lib/fhir-utils";

const classCodeMap: Record<string, { system: string; code: string; display: string }> = {
  ambulatory: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "AMB",
    display: "ambulatory",
  },
  emergency: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "EMER",
    display: "emergency",
  },
  inpatient: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "IMP",
    display: "inpatient encounter",
  },
  virtual: {
    system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    code: "VR",
    display: "virtual",
  },
};

export async function executeCreateEncounter(params: CreateEncounterParams): Promise<ToolResult> {
  try {
    if (!params.patientId) {
      return {
        success: false,
        error: "Patient ID is required",
      };
    }

    if (!params.practitionerId) {
      return {
        success: false,
        error: "Practitioner ID is required",
      };
    }

    // Fetch patient and practitioner to get their display names
    const [patientResponse, practitionerResponse] = await Promise.all([
      fetch(`/api/patients?id=${encodeURIComponent(params.patientId)}`),
      fetch(`/api/practitioners?id=${encodeURIComponent(params.practitionerId)}`),
    ]);

    let patientDisplayName = "Unknown";
    let practitionerDisplayName = "Unknown";

    if (patientResponse.ok) {
      const patient: Patient = await patientResponse.json();
      patientDisplayName = getPatientDisplayName(patient);
    }

    if (practitionerResponse.ok) {
      const practitioner: Practitioner = await practitionerResponse.json();
      practitionerDisplayName = getPractitionerDisplayName(practitioner);
    }

    const encounterResource = {
      resourceType: "Encounter",
      status: params.status || "in-progress",
      class: classCodeMap[params.encounterClass] || classCodeMap.ambulatory,
      type: params.type ? [{ text: params.type }] : undefined,
      subject: {
        reference: `Patient/${params.patientId}`,
        type: "Patient",
        display: patientDisplayName,
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/${params.practitionerId}`,
            type: "Practitioner",
            display: practitionerDisplayName,
          },
        },
      ],
      reasonCode: params.reasonCode ? [{ text: params.reasonCode }] : undefined,
      period: {
        start: new Date().toISOString(),
      },
    };

    const response = await fetch("/api/encounters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encounterResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create encounter",
      };
    }

    const createdEncounter = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully created ${params.encounterClass} encounter`,
        encounter: createdEncounter,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create encounter",
    };
  }
}

export async function executeUpdateEncounter(params: UpdateEncounterParams): Promise<ToolResult> {
  try {
    if (!params.id) {
      return {
        success: false,
        error: "Encounter ID is required",
      };
    }

    const updates: Record<string, unknown> = {};

    if (params.status) {
      updates.status = params.status;
    }
    if (params.endDate) {
      updates.period = { end: params.endDate };
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No update fields provided",
      };
    }

    const response = await fetch(`/api/encounters?id=${encodeURIComponent(params.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to update encounter",
      };
    }

    const updatedEncounter = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully updated encounter ${params.id}`,
        encounter: updatedEncounter,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update encounter",
    };
  }
}