import type { ToolResult } from "@/types/ai";
import type { CreatePractitionerParams } from "../types";

export async function executeCreatePractitioner(params: CreatePractitionerParams): Promise<ToolResult> {
  try {
    if (!params.firstName || !params.lastName) {
      return {
        success: false,
        error: "First name and last name are required",
      };
    }

    if (!params.gender) {
      return {
        success: false,
        error: "Gender is required",
      };
    }

    const practitionerResource = {
      resourceType: "Practitioner",
      active: true,
      name: [
        {
          use: "official",
          family: params.lastName,
          given: [params.firstName],
        },
      ],
      gender: params.gender,
      telecom: [] as Array<{ system: string; value: string; use: string }>,
      qualification: [] as Array<{ code: { text: string } }>,
    };

    if (params.phone) {
      practitionerResource.telecom.push({
        system: "phone",
        value: params.phone,
        use: "work",
      });
    }

    if (params.email) {
      practitionerResource.telecom.push({
        system: "email",
        value: params.email,
        use: "work",
      });
    }

    if (params.specialty) {
      practitionerResource.qualification.push({
        code: { text: params.specialty },
      });
    }

    const response = await fetch("/api/practitioners", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(practitionerResource),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || "Failed to create practitioner",
      };
    }

    const createdPractitioner = await response.json();

    return {
      success: true,
      data: {
        message: `Successfully created practitioner record for Dr. ${params.firstName} ${params.lastName}`,
        practitioner: createdPractitioner,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create practitioner",
    };
  }
}