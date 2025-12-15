/**
 * Get tool definitions for system prompt
 */
export function getToolDefinitions(): string {
  return `
## Available Tools

You have access to tools to interact with the clinic database. When you need to use a tool, output a tool_block with the parameters.

### create_patient
Create a new patient record in the system.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_patient",
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "1990-05-15",
  "gender": "male",
  "phone": "555-123-4567",
  "email": "john.doe@email.com",
  "address": {
    "line": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "postalCode": "62701",
    "country": "USA"
  }
}
</params>
</tool_block>

**Required parameters:**
- firstName: Patient's first name
- lastName: Patient's last name
- birthDate: Date of birth in YYYY-MM-DD format
- gender: One of "male", "female", "other", "unknown"

**Optional parameters:**
- phone: Phone number
- email: Email address
- address: Object with line, city, state, postalCode, country

### query_fhir
Query FHIR resources from the database.

**Usage:**
<tool_block>
<params>
{
  "tool": "query_fhir",
  "resource": "patients",
  "id": "optional-specific-id"
}
</params>
</tool_block>

**Parameters:**
- resource (required): One of "patients", "practitioners", "appointments", "encounters", "observations", "conditions", "medication-requests"
- id (optional): Specific resource ID to fetch

### create_practitioner
Create a new practitioner/doctor record in the system.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_practitioner",
  "firstName": "Jane",
  "lastName": "Smith",
  "gender": "female",
  "specialty": "General Practice",
  "phone": "555-987-6543",
  "email": "dr.smith@clinic.com"
}
</params>
</tool_block>

**Required parameters:**
- firstName: Practitioner's first name
- lastName: Practitioner's last name
- gender: One of "male", "female", "other", "unknown"

**Optional parameters:**
- specialty: Medical specialty (e.g., "Cardiology", "General Practice")
- phone: Work phone number
- email: Work email address

### create_appointment
Create a new appointment between a patient and practitioner.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_appointment",
  "patientId": "patient-123",
  "practitionerId": "practitioner-456",
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T09:30:00Z",
  "description": "Annual checkup",
  "status": "booked",
  "serviceType": "General Consultation"
}
</params>
</tool_block>

**Required parameters:**
- patientId: The patient's ID
- practitionerId: The practitioner's ID
- start: Start datetime in ISO 8601 format
- end: End datetime in ISO 8601 format

**Optional parameters:**
- description: Description of the appointment
- status: One of "proposed", "pending", "booked", "arrived", "fulfilled", "cancelled", "noshow" (default: "booked")
- serviceType: Type of service

### update_appointment
Update an existing appointment's status or details.

**Usage:**
<tool_block>
<params>
{
  "tool": "update_appointment",
  "id": "appointment-123",
  "status": "fulfilled",
  "description": "Completed annual checkup"
}
</params>
</tool_block>

**Required parameters:**
- id: The appointment ID to update

**Optional parameters (at least one required):**
- status: One of "proposed", "pending", "booked", "arrived", "fulfilled", "cancelled", "noshow"
- start: New start datetime in ISO 8601 format
- end: New end datetime in ISO 8601 format
- description: Updated description

### create_encounter
Create a new clinical encounter/visit.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_encounter",
  "patientId": "patient-123",
  "practitionerId": "practitioner-456",
  "encounterClass": "ambulatory",
  "type": "consultation",
  "reasonCode": "Annual wellness visit",
  "status": "in-progress"
}
</params>
</tool_block>

**Required parameters:**
- patientId: The patient's ID
- practitionerId: The practitioner's ID
- encounterClass: One of "ambulatory", "emergency", "inpatient", "virtual"

**Optional parameters:**
- type: Type of encounter
- reasonCode: Reason for the encounter
- status: One of "planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled" (default: "in-progress")

### update_encounter
Update an existing encounter's status.

**Usage:**
<tool_block>
<params>
{
  "tool": "update_encounter",
  "id": "encounter-123",
  "status": "finished",
  "endDate": "2024-01-15T10:30:00Z"
}
</params>
</tool_block>

**Required parameters:**
- id: The encounter ID to update

**Optional parameters (at least one required):**
- status: One of "planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled"
- endDate: End datetime in ISO 8601 format

### create_observation
Record a clinical observation (vital signs, lab results, etc.).

**Usage:**
<tool_block>
<params>
{
  "tool": "create_observation",
  "patientId": "patient-123",
  "encounterId": "encounter-456",
  "code": "85354-9",
  "codeDisplay": "Blood Pressure",
  "category": "vital-signs",
  "component": [
    {"code": "8480-6", "codeDisplay": "Systolic", "value": 120, "unit": "mmHg"},
    {"code": "8462-4", "codeDisplay": "Diastolic", "value": 80, "unit": "mmHg"}
  ]
}
</params>
</tool_block>

**Required parameters:**
- patientId: The patient's ID
- code: LOINC or other standard code for the observation
- codeDisplay: Human-readable name for the observation
- category: One of "vital-signs", "laboratory", "imaging", "procedure", "exam"

**Optional parameters:**
- encounterId: Associated encounter ID
- valueQuantity: Object with value (number) and unit (string) for single measurements
- valueString: String value for text-based observations
- component: Array of component measurements (for things like blood pressure with systolic/diastolic)

### create_condition
Record a patient condition/diagnosis.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_condition",
  "patientId": "patient-123",
  "code": "I10",
  "codeDisplay": "Essential Hypertension",
  "clinicalStatus": "active",
  "verificationStatus": "confirmed",
  "severity": "moderate",
  "onsetDate": "2024-01-01",
  "note": "Diagnosed during routine checkup"
}
</params>
</tool_block>

**Required parameters:**
- patientId: The patient's ID
- code: ICD-10 or SNOMED code for the condition
- codeDisplay: Human-readable name for the condition
- clinicalStatus: One of "active", "recurrence", "relapse", "inactive", "remission", "resolved"

**Optional parameters:**
- verificationStatus: One of "unconfirmed", "provisional", "differential", "confirmed", "refuted" (default: "confirmed")
- severity: One of "mild", "moderate", "severe"
- onsetDate: When the condition started (YYYY-MM-DD)
- note: Additional notes about the condition

### update_condition
Update an existing condition's status.

**Usage:**
<tool_block>
<params>
{
  "tool": "update_condition",
  "id": "condition-123",
  "clinicalStatus": "resolved",
  "abatementDate": "2024-06-15",
  "note": "Condition resolved with treatment"
}
</params>
</tool_block>

**Required parameters:**
- id: The condition ID to update

**Optional parameters (at least one required):**
- clinicalStatus: One of "active", "recurrence", "relapse", "inactive", "remission", "resolved"
- abatementDate: When the condition ended/resolved (YYYY-MM-DD)
- note: Additional notes

### create_medication_request
Create a new medication prescription.

**Usage:**
<tool_block>
<params>
{
  "tool": "create_medication_request",
  "patientId": "patient-123",
  "practitionerId": "practitioner-456",
  "medicationName": "Lisinopril 10mg",
  "dosageInstruction": "Take 1 tablet daily in the morning",
  "intent": "order",
  "priority": "routine",
  "status": "active"
}
</params>
</tool_block>

**Required parameters:**
- patientId: The patient's ID
- practitionerId: The prescribing practitioner's ID
- medicationName: Name and strength of the medication
- dosageInstruction: How to take the medication

**Optional parameters:**
- intent: One of "proposal", "plan", "order", "original-order", "reflex-order", "filler-order", "instance-order" (default: "order")
- priority: One of "routine", "urgent", "asap", "stat" (default: "routine")
- status: One of "active", "on-hold", "cancelled", "completed", "stopped", "draft" (default: "active")

### update_medication_request
Update an existing medication request's status.

**Usage:**
<tool_block>
<params>
{
  "tool": "update_medication_request",
  "id": "medication-request-123",
  "status": "completed"
}
</params>
</tool_block>

**Required parameters:**
- id: The medication request ID to update

**Optional parameters (at least one required):**
- status: One of "active", "on-hold", "cancelled", "completed", "stopped", "draft"

### delete_resource
Delete a resource from the database.

**Usage:**
<tool_block>
<params>
{
  "tool": "delete_resource",
  "resourceType": "appointments",
  "id": "appointment-123"
}
</params>
</tool_block>

**Required parameters:**
- resourceType: One of "patients", "practitioners", "appointments", "encounters", "observations", "conditions", "medication-requests"
- id: The resource ID to delete

### read_resource
Read a specific resource by its ID. Use this to get detailed information about a single record.

**Usage:**
<tool_block>
<params>
{
  "tool": "read_resource",
  "resourceType": "patients",
  "id": "patient-123"
}
</params>
</tool_block>

**Required parameters:**
- resourceType: One of "patients", "practitioners", "appointments", "encounters", "observations", "conditions", "medication-requests"
- id: The resource ID to read

**Examples:**
- Read a patient: { "tool": "read_resource", "resourceType": "patients", "id": "patient-123" }
- Read a practitioner: { "tool": "read_resource", "resourceType": "practitioners", "id": "practitioner-456" }
- Read an appointment: { "tool": "read_resource", "resourceType": "appointments", "id": "appointment-789" }

### list_resources
List resources of a specific type with optional filtering. Use this to browse records or find specific subsets.

**Usage:**
<tool_block>
<params>
{
  "tool": "list_resources",
  "resourceType": "patients",
  "limit": 10
}
</params>
</tool_block>

**Required parameters:**
- resourceType: One of "patients", "practitioners", "appointments", "encounters", "observations", "conditions", "medication-requests"

**Optional parameters:**
- limit: Maximum number of results to return
- patientId: Filter by patient ID (works for appointments, encounters, observations, conditions, medication-requests)
- practitionerId: Filter by practitioner ID (works for appointments, encounters, medication-requests)
- status: Filter by status (works for appointments, encounters, conditions, medication-requests)

**Examples:**

List all patients:
{ "tool": "list_resources", "resourceType": "patients" }

List all practitioners:
{ "tool": "list_resources", "resourceType": "practitioners" }

List appointments for a specific patient:
{ "tool": "list_resources", "resourceType": "appointments", "patientId": "patient-123" }

List a practitioner's appointments:
{ "tool": "list_resources", "resourceType": "appointments", "practitionerId": "practitioner-456" }

List booked appointments:
{ "tool": "list_resources", "resourceType": "appointments", "status": "booked" }

List a patient's observations:
{ "tool": "list_resources", "resourceType": "observations", "patientId": "patient-123" }

List a patient's active conditions:
{ "tool": "list_resources", "resourceType": "conditions", "patientId": "patient-123", "status": "active" }

List a patient's medication requests:
{ "tool": "list_resources", "resourceType": "medication-requests", "patientId": "patient-123" }

List first 5 encounters:
{ "tool": "list_resources", "resourceType": "encounters", "limit": 5 }

## Tool Usage Rules

1. When you need to use a tool, output the tool_block and STOP. Do not continue your response after the tool_block.
2. Wait for the tool result which will be provided in the next message as [Tool Result: tool_name].
3. After receiving the result, continue your response using the data.
4. Always confirm successful actions with the user.
5. If a tool returns an error, explain the issue and ask for clarification if needed.
`;
}