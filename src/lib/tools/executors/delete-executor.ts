import type { ToolResult } from "@/types/ai";
import type { DeleteResourceParams } from "../types";

export async function executeDeleteResource(params: DeleteResourceParams): Promise<ToolResult> {
  try {
    if (!params.resourceType) {
      return {
        success: false,
        error: "Resource type is required",
      };
    }

    if (!params.id) {
      return {
        success: false,
        error: "Resource ID is required",
      };
    }

    const validResources = [
      "patients",
      "practitioners",
      "appointments",
      "encounters",
      "observations",
      "conditions",
      "medication-requests",
    ];

    if (!validResources.includes(params.resourceType)) {
      return {
        success: false,
        error: `Invalid resource type: ${params.resourceType}. Valid types are: ${validResources.join(", ")}`,
      };
    }

    const response = await fetch(`/api/${params.resourceType}?id=${encodeURIComponent(params.id)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || `Failed to delete ${params.resourceType}`,
      };
    }

    return {
      success: true,
      data: {
        message: `Successfully deleted ${params.resourceType} with ID ${params.id}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete resource",
    };
  }
}