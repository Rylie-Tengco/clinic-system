import type { ToolResult } from "@/types/ai";
import type { QueryFhirParams } from "../types";

export async function executeQueryFhir(params: QueryFhirParams): Promise<ToolResult> {
  try {
    const { resource, id } = params;

    const validResources = [
      "patients",
      "practitioners",
      "appointments",
      "encounters",
      "observations",
      "conditions",
      "medication-requests",
    ];

    if (!validResources.includes(resource)) {
      return {
        success: false,
        error: `Invalid resource type: ${resource}. Valid types are: ${validResources.join(", ")}`,
      };
    }

    let url = `/api/${resource}`;
    if (id) {
      url += `?id=${encodeURIComponent(id)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || `Failed to query ${resource}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: {
        resource,
        count: Array.isArray(data) ? data.length : 1,
        results: data,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to query resource",
    };
  }
}