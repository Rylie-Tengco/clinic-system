import type { ToolResult } from "@/types/ai";
import type { CreateObservationParams } from "../types";
import type { Patient } from "@/types/fhir";
import { getPatientDisplayName } from "@/lib/fhir-utils";

const categoryCodeMap: Record<string, { system: string; code: string; display: string }> = {
  "vital-signs": {
    system: "http://terminology.hl7.org/CodeSystem/observation-category",
    code: "vital-signs",
    display: "Vital Signs",
  },
  laboratory: {
    system: "http://terminology.hl7.org/CodeSystem/observation-category",
    code: "laboratory",
    display: "Laboratory",
  },
  imaging: {
    system: "http://terminology.hl7.org/CodeSystem/observation-category",
    code: "imaging",
    display: "Imaging",
  },
  procedure: {
    system: "http://terminology.hl7.org/CodeSystem/observation-category",
    code: "procedure",
    display: "Procedure",
  },
  exam: {
    system: "http://terminology.hl7.org/CodeSystem/observation-category",
    code: "exam",
    display: "Exam",
  },
};

export async function executeCreateObservation(params: CreateObservationParams): Promise<ToolResult> {
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
        error: "Observation code and display name are required",
      };
    }

    if (!params.category) {
      return {
        success: false,
        error: "Observation category is required",
      };
    }

    // Fetch patient to get display name
    const patientResponse = await fetch(`/api/patients?id=${encodeURIComponent(params.patientId)}`);
    let patientDisplayName = "Unknown";

    if (patientResponse.ok) {
      const patient: Patient = await patientResponse.json();
      patientDisplayName = getPatientDisplayName(patient);
    }

    const observationResource: Record<string, unknown> = {
      resourceType: "Observation",
      status: "final",
      category: [
        {
          coding: [categoryCodeMap[params.category]],
        },
      ],
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
      effectiveDateTime: new Date().toISOString(),
    };

    if (params.encounterId) {
      observationResource.encounter = {
        reference: `Encounter/${params.encounterId}`,
        type: "Encounter",
      };
    }

    if (params.valueQuantity) {
      observationResource.valueQuantity = {
        value: params.valueQuantity.value,
        unit: params.valueQuantity.unit,
      };
    } else if (params.valueString) {
      observationResource.valueString = params.valueString;
    }

    if (params.component && params.component.length > 0) {
      observationResource.component = params.component.map((comp) => ({
        code: {
          coding: [
            {
              code: comp.code,
              display: comp.codeDisplay,
            },
          ],
          text: comp.codeDisplay,
        },
        valueQuantity: {
          value: comp.value,
          unit: comp.unit,
        },
      }));
    }

    const response = await fetch("/api/observations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(observationResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create observation",
      };
    }

    const createdObservation = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully recorded ${params.codeDisplay} observation`,
        observation: createdObservation,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create observation",
    };
  }
}