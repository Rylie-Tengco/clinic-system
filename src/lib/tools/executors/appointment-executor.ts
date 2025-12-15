import type { ToolResult } from "@/types/ai";
import type { CreateAppointmentParams, UpdateAppointmentParams } from "../types";
import type { Patient, Practitioner } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName } from "@/lib/fhir-utils";

export async function executeCreateAppointment(params: CreateAppointmentParams): Promise<ToolResult> {
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

    if (!params.start || !params.end) {
      return {
        success: false,
        error: "Start and end times are required",
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

    const appointmentResource = {
      resourceType: "Appointment",
      status: params.status || "booked",
      description: params.description || "",
      start: params.start,
      end: params.end,
      serviceType: params.serviceType
        ? [{ text: params.serviceType }]
        : undefined,
      participant: [
        {
          actor: {
            reference: `Patient/${params.patientId}`,
            type: "Patient",
            display: patientDisplayName,
          },
          status: "accepted",
        },
        {
          actor: {
            reference: `Practitioner/${params.practitionerId}`,
            type: "Practitioner",
            display: practitionerDisplayName,
          },
          status: "accepted",
        },
      ],
    };

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(appointmentResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create appointment",
      };
    }

    const createdAppointment = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully created appointment for ${params.start}`,
        appointment: createdAppointment,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create appointment",
    };
  }
}

export async function executeUpdateAppointment(params: UpdateAppointmentParams): Promise<ToolResult> {
  try {
    if (!params.id) {
      return {
        success: false,
        error: "Appointment ID is required",
      };
    }

    const updates: Record<string, unknown> = {};

    if (params.status) {
      updates.status = params.status;
    }
    if (params.start) {
      updates.start = params.start;
    }
    if (params.end) {
      updates.end = params.end;
    }
    if (params.description !== undefined) {
      updates.description = params.description;
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: "No update fields provided",
      };
    }

    const response = await fetch(`/api/appointments?id=${encodeURIComponent(params.id)}`, {
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
        error: error.error || "Failed to update appointment",
      };
    }

    const updatedAppointment = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully updated appointment ${params.id}`,
        appointment: updatedAppointment,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update appointment",
    };
  }
}