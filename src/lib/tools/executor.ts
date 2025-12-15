import type { ToolResult } from "@/types/ai";
import type {
  ToolName,
  CreatePatientParams,
  QueryFhirParams,
  CreatePractitionerParams,
  CreateAppointmentParams,
  UpdateAppointmentParams,
  CreateEncounterParams,
  UpdateEncounterParams,
  CreateObservationParams,
  CreateConditionParams,
  UpdateConditionParams,
  CreateMedicationRequestParams,
  UpdateMedicationRequestParams,
  DeleteResourceParams,
  ReadResourceParams,
  ListResourcesParams,
} from "./types";

import { executeCreatePatient } from "./executors/patient-executor";
import { executeQueryFhir } from "./executors/query-executor";
import { executeCreatePractitioner } from "./executors/practitioner-executor";
import { executeCreateAppointment, executeUpdateAppointment } from "./executors/appointment-executor";
import { executeCreateEncounter, executeUpdateEncounter } from "./executors/encounter-executor";
import { executeCreateObservation } from "./executors/observation-executor";
import { executeCreateCondition, executeUpdateCondition } from "./executors/condition-executor";
import { executeCreateMedicationRequest, executeUpdateMedicationRequest } from "./executors/medication-executor";
import { executeDeleteResource } from "./executors/delete-executor";
import { executeReadResource } from "./executors/read-executor";
import { executeListResources } from "./executors/list-executor";

/**
 * Execute a tool by name with given parameters
 */
export async function executeTool(params: Record<string, unknown>): Promise<ToolResult> {
  const toolName = params.tool as ToolName;

  switch (toolName) {
    case "create_patient":
      return executeCreatePatient(params as unknown as CreatePatientParams);
    case "query_fhir":
      return executeQueryFhir(params as unknown as QueryFhirParams);
    case "create_practitioner":
      return executeCreatePractitioner(params as unknown as CreatePractitionerParams);
    case "create_appointment":
      return executeCreateAppointment(params as unknown as CreateAppointmentParams);
    case "update_appointment":
      return executeUpdateAppointment(params as unknown as UpdateAppointmentParams);
    case "create_encounter":
      return executeCreateEncounter(params as unknown as CreateEncounterParams);
    case "update_encounter":
      return executeUpdateEncounter(params as unknown as UpdateEncounterParams);
    case "create_observation":
      return executeCreateObservation(params as unknown as CreateObservationParams);
    case "create_condition":
      return executeCreateCondition(params as unknown as CreateConditionParams);
    case "update_condition":
      return executeUpdateCondition(params as unknown as UpdateConditionParams);
    case "create_medication_request":
      return executeCreateMedicationRequest(params as unknown as CreateMedicationRequestParams);
    case "update_medication_request":
      return executeUpdateMedicationRequest(params as unknown as UpdateMedicationRequestParams);
    case "delete_resource":
      return executeDeleteResource(params as unknown as DeleteResourceParams);
    case "read_resource":
      return executeReadResource(params as unknown as ReadResourceParams);
    case "list_resources":
      return executeListResources(params as unknown as ListResourcesParams);
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
  }
}