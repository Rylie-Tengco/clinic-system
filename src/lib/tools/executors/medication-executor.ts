import type { ToolResult } from "@/types/ai";
import type { CreateMedicationRequestParams, UpdateMedicationRequestParams } from "../types";
import type { Patient, Practitioner } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName } from "@/lib/fhir-utils";

export async function executeCreateMedicationRequest(params: CreateMedicationRequestParams): Promise<ToolResult> {
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

    if (!params.medicationName) {
      return {
        success: false,
        error: "Medication name is required",
      };
    }

    if (!params.dosageInstruction) {
      return {
        success: false,
        error: "Dosage instruction is required",
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

    const medicationRequestResource = {
      resourceType: "MedicationRequest",
      status: params.status || "active",
      intent: params.intent || "order",
      priority: params.priority || "routine",
      medicationCodeableConcept: {
        text: params.medicationName,
      },
      subject: {
        reference: `Patient/${params.patientId}`,
        type: "Patient",
        display: patientDisplayName,
      },
      requester: {
        reference: `Practitioner/${params.practitionerId}`,
        type: "Practitioner",
        display: practitionerDisplayName,
      },
      dosageInstruction: [
        {
          text: params.dosageInstruction,
        },
      ],
      authoredOn: new Date().toISOString(),
    };

    const response = await fetch("/api/medication-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(medicationRequestResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create medication request",
      };
    }

    const createdMedicationRequest = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully prescribed ${params.medicationName}`,
        medicationRequest: createdMedicationRequest,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create medication request",
    };
  }
}

export async function executeUpdateMedicationRequest(params: UpdateMedicationRequestParams): Promise<ToolResult> {
  try {
    if (!params.id) {
      return {
        success: false,
        error: "Medication request ID is required",
      };
    }

    const updates: Record<string, unknown> = {};

    if (params.status) {
      updates.status = params.status;
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No update fields provided",
      };
    }

    const response = await fetch(`/api/medication-requests?id=${encodeURIComponent(params.id)}`, {
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
        error: error.error || "Failed to update medication request",
      };
    }

    const updatedMedicationRequest = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully updated medication request ${params.id}`,
        medicationRequest: updatedMedicationRequest,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update medication request",
    };
  }
}