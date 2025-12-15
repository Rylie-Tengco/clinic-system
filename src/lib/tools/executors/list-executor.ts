import type { ToolResult } from "@/types/ai";
import type { ListResourcesParams, ResourceType } from "../types";

const VALID_RESOURCES: ResourceType[] = [
  "patients",
  "practitioners",
  "appointments",
  "encounters",
  "observations",
  "conditions",
  "medication-requests",
];

interface FilterableResource {
  id?: string;
  subject?: { reference?: string };
  patient?: { reference?: string };
  participant?: Array<{ actor?: { reference?: string } }>;
  status?: string;
  clinicalStatus?: { coding?: Array<{ code?: string }> };
}

function extractPatientId(resource: FilterableResource): string | null {
  // Check subject.reference (used by observations, conditions)
  if (resource.subject?.reference) {
    const ref = resource.subject.reference;
    if (ref.startsWith("Patient/")) {
      return ref.replace("Patient/", "");
    }
    return ref;
  }
  // Check patient.reference (used by encounters)
  if (resource.patient?.reference) {
    const ref = resource.patient.reference;
    if (ref.startsWith("Patient/")) {
      return ref.replace("Patient/", "");
    }
    return ref;
  }
  // Check participant array (used by appointments)
  if (resource.participant) {
    for (const p of resource.participant) {
      if (p.actor?.reference?.includes("patient") || p.actor?.reference?.startsWith("Patient/")) {
        const ref = p.actor.reference;
        if (ref.startsWith("Patient/")) {
          return ref.replace("Patient/", "");
        }
        return ref;
      }
    }
  }
  return null;
}

function extractPractitionerId(resource: FilterableResource): string | null {
  // Check participant array (used by appointments, encounters)
  if (resource.participant) {
    for (const p of resource.participant) {
      if (p.actor?.reference?.includes("practitioner") || p.actor?.reference?.startsWith("Practitioner/")) {
        const ref = p.actor.reference;
        if (ref.startsWith("Practitioner/")) {
          return ref.replace("Practitioner/", "");
        }
        return ref;
      }
    }
  }
  return null;
}

function extractStatus(resource: FilterableResource): string | null {
  // Direct status field (appointments, encounters, medication-requests)
  if (resource.status) {
    return resource.status;
  }
  // Clinical status for conditions
  if (resource.clinicalStatus?.coding?.[0]?.code) {
    return resource.clinicalStatus.coding[0].code;
  }
  return null;
}

function applyFilters(
  resources: FilterableResource[],
  resourceType: ResourceType,
  params: ListResourcesParams
): FilterableResource[] {
  let filtered = [...resources];

  const { patientId, practitionerId, status } = params;

  // Apply patientId filter for applicable resources
  if (patientId && ["appointments", "encounters", "observations", "conditions", "medication-requests"].includes(resourceType)) {
    filtered = filtered.filter((r) => {
      const resourcePatientId = extractPatientId(r);
      return resourcePatientId === patientId || resourcePatientId === `Patient/${patientId}`;
    });
  }

  // Apply practitionerId filter for applicable resources
  if (practitionerId && ["appointments", "encounters", "medication-requests"].includes(resourceType)) {
    filtered = filtered.filter((r) => {
      const resourcePractitionerId = extractPractitionerId(r);
      return resourcePractitionerId === practitionerId || resourcePractitionerId === `Practitioner/${practitionerId}`;
    });
  }

  // Apply status filter for applicable resources
  if (status && ["appointments", "encounters", "conditions", "medication-requests"].includes(resourceType)) {
    filtered = filtered.filter((r) => {
      const resourceStatus = extractStatus(r);
      return resourceStatus === status;
    });
  }

  return filtered;
}

export async function executeListResources(params: ListResourcesParams): Promise<ToolResult> {
  try {
    const { resourceType, limit } = params;

    if (!resourceType) {
      return {
        success: false,
        error: "resourceType is required",
      };
    }

    if (!VALID_RESOURCES.includes(resourceType)) {
      return {
        success: false,
        error: `Invalid resource type: ${resourceType}. Valid types are: ${VALID_RESOURCES.join(", ")}`,
      };
    }

    const url = `/api/${resourceType}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || `Failed to list ${resourceType}`,
      };
    }

    let data = await response.json();

    if (!Array.isArray(data)) {
      data = [data];
    }

    // Apply filters
    let filtered = applyFilters(data, resourceType, params);

    // Apply limit
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return {
      success: true,
      data: {
        resourceType,
        totalCount: data.length,
        filteredCount: filtered.length,
        resources: filtered,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list resources",
    };
  }
}