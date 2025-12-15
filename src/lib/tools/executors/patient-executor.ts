import type { ToolResult } from "@/types/ai";
import type { CreatePatientParams } from "../types";

export async function executeCreatePatient(params: CreatePatientParams): Promise<ToolResult> {
  try {
    if (!params.firstName || !params.lastName) {
      return {
        success: false,
        error: "First name and last name are required",
      };
    }

    if (!params.birthDate) {
      return {
        success: false,
        error: "Birth date is required",
      };
    }

    if (!params.gender) {
      return {
        success: false,
        error: "Gender is required",
      };
    }

    const patientResource = {
      resourceType: "Patient",
      active: true,
      name: [
        {
          use: "official",
          family: params.lastName,
          given: [params.firstName],
        },
      ],
      gender: params.gender,
      birthDate: params.birthDate,
      telecom: [] as Array<{ system: string; value: string; use: string }>,
      address: [] as Array<{
        use: string;
        type: string;
        line?: string[];
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      }>,
    };

    if (params.phone) {
      patientResource.telecom.push({
        system: "phone",
        value: params.phone,
        use: "mobile",
      });
    }

    if (params.email) {
      patientResource.telecom.push({
        system: "email",
        value: params.email,
        use: "home",
      });
    }

    if (params.address) {
      const addressEntry: {
        use: string;
        type: string;
        line?: string[];
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      } = {
        use: "home",
        type: "physical",
      };

      if (params.address.line) {
        addressEntry.line = [params.address.line];
      }
      if (params.address.city) {
        addressEntry.city = params.address.city;
      }
      if (params.address.state) {
        addressEntry.state = params.address.state;
      }
      if (params.address.postalCode) {
        addressEntry.postalCode = params.address.postalCode;
      }
      if (params.address.country) {
        addressEntry.country = params.address.country;
      }

      patientResource.address.push(addressEntry);
    }

    const response = await fetch("/api/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create patient",
      };
    }

    const createdPatient = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully created patient record for ${params.firstName} ${params.lastName}`,
        patient: createdPatient,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create patient",
    };
  }
}