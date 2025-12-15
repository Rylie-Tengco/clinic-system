import type { ToolResult } from "@/types/ai";
import type { ReadResourceParams, ResourceType } from "../types";

const VALID_RESOURCES: ResourceType[] = [
  "patients",
  "practitioners",
  "appointments",
  "encounters",
  "observations",
  "conditions",
  "medication-requests",
];

export async function executeReadResource(params: ReadResourceParams): Promise<ToolResult> {
  try {
    const { resourceType, id } = params;

    if (!resourceType) {
      return {
        success: false,
        error: "resourceType is required",
      };
    }

    if (!id) {
      return {
        success: false,
        error: "id is required",
      };
    }

    if (!VALID_RESOURCES.includes(resourceType)) {
      return {
        success: false,
        error: `Invalid resource type: ${resourceType}. Valid types are: ${VALID_RESOURCES.join(", ")}`,
      };
    }

    const url = `/api/${resourceType}?id=${encodeURIComponent(id)}`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: `Resource not found: ${resourceType} with id "${id}"`,
        };
      }
      const error = await response.json();
      return {
        success: false,
        error: error.error || `Failed to read ${resourceType}`,
      };
    }

    const data = await response.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return {
        success: false,
        error: `Resource not found: ${resourceType} with id "${id}"`,
      };
    }

    return {
      success: true,
      data: {
        resourceType,
        resource: Array.isArray(data) ? data[0] : data,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to read resource",
    };
  }
}