import type { ToolResult } from "@/types/ai";
import type { CreateConditionParams, UpdateConditionParams } from "../types";
import type { Patient } from "@/types/fhir";
import { getPatientDisplayName } from "@/lib/fhir-utils";

export async function executeCreateCondition(params: CreateConditionParams): Promise<ToolResult> {
  try {
    if (!params.patientId) {
      return {
        success: false,
        error: "Patient ID is required",
      };
    }

    if (!params.code || !params.codeDisplay) {
      return {
        success: false,
        error: "Condition code and display name are required",
      };
    }

    if (!params.clinicalStatus) {
      return {
        success: false,
        error: "Clinical status is required",
      };
    }

    // Fetch patient to get display name
    const patientResponse = await fetch(`/api/patients?id=${encodeURIComponent(params.patientId)}`);
    let patientDisplayName = "Unknown";

    if (patientResponse.ok) {
      const patient: Patient = await patientResponse.json();
      patientDisplayName = getPatientDisplayName(patient);
    }

    // Map clinical status codes to display names
    const clinicalStatusDisplayMap: Record<string, string> = {
      active: "Active",
      recurrence: "Recurrence",
      relapse: "Relapse",
      inactive: "Inactive",
      remission: "Remission",
      resolved: "Resolved",
    };

    // Map verification status codes to display names
    const verificationStatusDisplayMap: Record<string, string> = {
      unconfirmed: "Unconfirmed",
      provisional: "Provisional",
      differential: "Differential",
      confirmed: "Confirmed",
      refuted: "Refuted",
      "entered-in-error": "Entered in Error",
    };

    const verificationStatus = params.verificationStatus || "confirmed";

    const conditionResource: Record<string, unknown> = {
      resourceType: "Condition",
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: params.clinicalStatus,
            display: clinicalStatusDisplayMap[params.clinicalStatus] || params.clinicalStatus,
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: verificationStatus,
            display: verificationStatusDisplayMap[verificationStatus] || verificationStatus,
          },
        ],
      },
      code: {
        coding: [
          {
            code: params.code,
            display: params.codeDisplay,
          },
        ],
        text: params.codeDisplay,
      },
      subject: {
        reference: `Patient/${params.patientId}`,
        type: "Patient",
        display: patientDisplayName,
      },
      recordedDate: new Date().toISOString(),
    };

    if (params.severity) {
      conditionResource.severity = {
        coding: [
          {
            system: "http://snomed.info/sct",
            code: params.severity,
            display: params.severity,
          },
        ],
      };
    }

    if (params.onsetDate) {
      conditionResource.onsetDateTime = params.onsetDate;
    }

    if (params.note) {
      conditionResource.note = [{ text: params.note }];
    }

    const response = await fetch("/api/conditions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(conditionResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create condition",
      };
    }

    const createdCondition = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully recorded condition: ${params.codeDisplay}`,
        condition: createdCondition,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create condition",
    };
  }
}

export async function executeUpdateCondition(params: UpdateConditionParams): Promise<ToolResult> {
  try {
    if (!params.id) {
      return {
        success: false,
        error: "Condition ID is required",
      };
    }

    const updates: Record<string, unknown> = {};

    if (params.clinicalStatus) {
      updates.clinicalStatus = {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: params.clinicalStatus,
          },
        ],
      };
    }

    if (params.abatementDate) {
      updates.abatementDateTime = params.abatementDate;
    }

    if (params.note) {
      updates.note = [{ text: params.note }];
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No update fields provided",
      };
    }

    const response = await fetch(`/api/conditions?id=${encodeURIComponent(params.id)}`, {
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
        error: error.error || "Failed to update condition",
      };
    }

    const updatedCondition = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully updated condition ${params.id}`,
        condition: updatedCondition,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update condition",
    };
  }
}