"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2, FileText, Activity, Pill, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Observation, Condition, MedicationRequest, Patient, Practitioner } from "@/types/fhir";
import { VITAL_SIGNS_CODES, CONDITION_CLINICAL_STATUS, CONDITION_VERIFICATION_STATUS } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName, getCodeableConceptDisplay, getObservationStatusColor } from "@/lib/fhir-utils";
import { formatDateTime } from "@/lib/utils";

type VitalType = keyof typeof VITAL_SIGNS_CODES;

// Helper function to format observation values, including blood pressure components
function formatObservationValue(obs: Observation): string {
  // Check for component values (e.g., blood pressure with systolic/diastolic)
  if (obs.component && obs.component.length > 0) {
    const parts = obs.component.map((comp) => {
      const value = comp.valueQuantity?.value;
      const unit = comp.valueQuantity?.unit || "";
      const display = comp.code?.coding?.[0]?.display || comp.code?.text || "";
      
      // For blood pressure, show abbreviated labels
      if (display.toLowerCase().includes("systolic")) {
        return `${value}`;
      }
      if (display.toLowerCase().includes("diastolic")) {
        return `${value}`;
      }
      return `${display}: ${value} ${unit}`;
    });
    
    // If it looks like blood pressure (2 numeric components), format as "systolic/diastolic mmHg"
    if (obs.component.length === 2) {
      const systolic = obs.component.find(c =>
        c.code?.coding?.[0]?.display?.toLowerCase().includes("systolic") ||
        c.code?.text?.toLowerCase().includes("systolic")
      );
      const diastolic = obs.component.find(c =>
        c.code?.coding?.[0]?.display?.toLowerCase().includes("diastolic") ||
        c.code?.text?.toLowerCase().includes("diastolic")
      );
      
      if (systolic && diastolic) {
        const unit = systolic.valueQuantity?.unit || diastolic.valueQuantity?.unit || "mmHg";
        return `${systolic.valueQuantity?.value}/${diastolic.valueQuantity?.value} ${unit}`;
      }
    }
    
    return parts.join(", ");
  }
  
  // Check for simple valueQuantity
  if (obs.valueQuantity?.value !== undefined) {
    return `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ""}`.trim();
  }
  
  // Check for valueString
  if (obs.valueString) {
    return obs.valueString;
  }
  
  // Check for valueCodeableConcept
  if (obs.valueCodeableConcept) {
    return getCodeableConceptDisplay(obs.valueCodeableConcept);
  }
  
  return "—";
}

export default function RecordsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [medications, setMedications] = useState<MedicationRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("vitals");
  
  // Dialog states
  const [isVitalDialogOpen, setIsVitalDialogOpen] = useState(false);
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false);
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);

  const [vitalForm, setVitalForm] = useState({
    patientId: "",
    practitionerId: "",
    vitalType: "HEART_RATE" as VitalType,
    value: "",
    unit: "bpm",
  });

  const [conditionForm, setConditionForm] = useState({
    patientId: "",
    name: "",
    clinicalStatus: "active",
  });

  const [medicationForm, setMedicationForm] = useState({
    patientId: "",
    practitionerId: "",
    name: "",
    dosage: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [obsRes, condRes, medRes, patRes, pracRes] = await Promise.all([
        fetch("/api/observations"),
        fetch("/api/conditions"),
        fetch("/api/medication-requests"),
        fetch("/api/patients"),
        fetch("/api/practitioners"),
      ]);
      const [obsData, condData, medData, patData, pracData] = await Promise.all([
        obsRes.json(),
        condRes.json(),
        medRes.json(),
        patRes.json(),
        pracRes.json(),
      ]);
      setObservations(obsData);
      setConditions(condData);
      setMedications(medData);
      setPatients(patData);
      setPractitioners(pracData);
    } catch (_error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const vitalUnits: Record<VitalType, string> = {
    HEART_RATE: "bpm",
    BLOOD_PRESSURE: "mmHg",
    SYSTOLIC_BP: "mmHg",
    DIASTOLIC_BP: "mmHg",
    BODY_TEMPERATURE: "°C",
    RESPIRATORY_RATE: "/min",
    OXYGEN_SATURATION: "%",
    BODY_HEIGHT: "cm",
    BODY_WEIGHT: "kg",
    BMI: "kg/m²",
  };

  const vitalOptions = Object.entries(VITAL_SIGNS_CODES).map(([key, val]) => ({
    value: key,
    label: val.display,
  }));

  async function handleAddVital(e: React.FormEvent) {
    e.preventDefault();
    const patient = patients.find(p => p.id === vitalForm.patientId);
    const practitioner = practitioners.find(p => p.id === vitalForm.practitionerId);
    if (!patient) return;

    const vitalCode = VITAL_SIGNS_CODES[vitalForm.vitalType];
    const observationData = {
      status: "final",
      code: { coding: [vitalCode], text: vitalCode.display },
      subject: { reference: `Patient/${patient.id}`, display: getPatientDisplayName(patient) },
      performer: practitioner ? [{ reference: `Practitioner/${practitioner.id}`, display: getPractitionerDisplayName(practitioner) }] : undefined,
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: { value: parseFloat(vitalForm.value), unit: vitalForm.unit, system: "http://unitsofmeasure.org" },
    };

    try {
      await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(observationData),
      });
      setIsVitalDialogOpen(false);
      setVitalForm({ patientId: "", practitionerId: "", vitalType: "HEART_RATE", value: "", unit: "bpm" });
      fetchData();
    } catch (_error) {
      console.error("Failed to add vital");
    }
  }

  async function handleAddCondition(e: React.FormEvent) {
    e.preventDefault();
    const patient = patients.find(p => p.id === conditionForm.patientId);
    if (!patient) return;

    const clinicalStatus = conditionForm.clinicalStatus === "active" 
      ? CONDITION_CLINICAL_STATUS.ACTIVE 
      : CONDITION_CLINICAL_STATUS.RESOLVED;

    const conditionData = {
      clinicalStatus,
      verificationStatus: CONDITION_VERIFICATION_STATUS.CONFIRMED,
      code: { text: conditionForm.name },
      subject: { reference: `Patient/${patient.id}`, display: getPatientDisplayName(patient) },
      recordedDate: new Date().toISOString(),
    };

    try {
      await fetch("/api/conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(conditionData),
      });
      setIsConditionDialogOpen(false);
      setConditionForm({ patientId: "", name: "", clinicalStatus: "active" });
      fetchData();
    } catch (_error) {
      console.error("Failed to add condition");
    }
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault();
    const patient = patients.find(p => p.id === medicationForm.patientId);
    const practitioner = practitioners.find(p => p.id === medicationForm.practitionerId);
    if (!patient || !practitioner) return;

    const medicationData = {
      status: "active",
      intent: "order",
      medicationCodeableConcept: { text: medicationForm.name },
      subject: { reference: `Patient/${patient.id}`, display: getPatientDisplayName(patient) },
      requester: { reference: `Practitioner/${practitioner.id}`, display: getPractitionerDisplayName(practitioner) },
      authoredOn: new Date().toISOString(),
      dosageInstruction: medicationForm.dosage ? [{ text: medicationForm.dosage }] : undefined,
    };

    try {
      await fetch("/api/medication-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(medicationData),
      });
      setIsMedicationDialogOpen(false);
      setMedicationForm({ patientId: "", practitionerId: "", name: "", dosage: "" });
      fetchData();
    } catch (_error) {
      console.error("Failed to add medication");
    }
  }

  async function handleDeleteObservation(id: string) {
    if (!confirm("Delete this observation?")) return;
    await fetch(`/api/observations?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleDeleteCondition(id: string) {
    if (!confirm("Delete this condition?")) return;
    await fetch(`/api/conditions?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function handleDeleteMedication(id: string) {
    if (!confirm("Delete this prescription?")) return;
    await fetch(`/api/medication-requests?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const filteredObservations = observations.filter(o => 
    o.subject?.display?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCodeableConceptDisplay(o.code).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConditions = conditions.filter(c =>
    c.subject?.display?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCodeableConceptDisplay(c.code).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedications = medications.filter(m =>
    m.subject?.display?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCodeableConceptDisplay(m.medicationCodeableConcept).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="mt-1 text-sm text-gray-500">Observations, conditions, and prescriptions (FHIR resources)</p>
        </div>
      </div>

      <Tabs defaultValue="vitals" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="vitals">
              <Activity className="mr-1.5 h-4 w-4" />
              Vitals
            </TabsTrigger>
            <TabsTrigger value="conditions">
              <Stethoscope className="mr-1.5 h-4 w-4" />
              Conditions
            </TabsTrigger>
            <TabsTrigger value="medications">
              <Pill className="mr-1.5 h-4 w-4" />
              Medications
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            {activeTab === "vitals" && (
              <Button size="sm" onClick={() => setIsVitalDialogOpen(true)} disabled={patients.length === 0}>
                <Plus className="mr-1 h-4 w-4" />Add Vital
              </Button>
            )}
            {activeTab === "conditions" && (
              <Button size="sm" onClick={() => setIsConditionDialogOpen(true)} disabled={patients.length === 0}>
                <Plus className="mr-1 h-4 w-4" />Add Condition
              </Button>
            )}
            {activeTab === "medications" && (
              <Button size="sm" onClick={() => setIsMedicationDialogOpen(true)} disabled={patients.length === 0 || practitioners.length === 0}>
                <Plus className="mr-1 h-4 w-4" />Add Prescription
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="vitals">
          <Card>
            <CardHeader><CardTitle className="text-base">Vital Signs (Observations)</CardTitle></CardHeader>
            <CardContent>
              {filteredObservations.length === 0 ? (
                <div className="py-8 text-center">
                  <Activity className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No vital signs recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">Value</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredObservations.map((obs) => (
                      <TableRow key={obs.id}>
                        <TableCell className="font-medium">{obs.subject?.display || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCodeableConceptDisplay(obs.code)}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {formatObservationValue(obs)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">
                          {obs.effectiveDateTime && formatDateTime(obs.effectiveDateTime)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteObservation(obs.id!)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conditions">
          <Card>
            <CardHeader><CardTitle className="text-base">Diagnoses (Conditions)</CardTitle></CardHeader>
            <CardContent>
              {filteredConditions.length === 0 ? (
                <div className="py-8 text-center">
                  <Stethoscope className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No conditions recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Recorded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConditions.map((cond) => (
                      <TableRow key={cond.id}>
                        <TableCell className="font-medium">{cond.subject?.display || "Unknown"}</TableCell>
                        <TableCell>{getCodeableConceptDisplay(cond.code) || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={cond.clinicalStatus?.coding?.[0]?.code === "active" ? "warning" : "success"}>
                            {cond.clinicalStatus?.coding?.[0]?.display || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">
                          {cond.recordedDate && formatDateTime(cond.recordedDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCondition(cond.id!)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader><CardTitle className="text-base">Prescriptions (Medication Requests)</CardTitle></CardHeader>
            <CardContent>
              {filteredMedications.length === 0 ? (
                <div className="py-8 text-center">
                  <Pill className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No prescriptions recorded</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead className="hidden sm:table-cell">Dosage</TableHead>
                      <TableHead className="hidden md:table-cell">Prescribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMedications.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">{med.subject?.display || "Unknown"}</TableCell>
                        <TableCell>{getCodeableConceptDisplay(med.medicationCodeableConcept) || "Unknown"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {med.dosageInstruction?.[0]?.text || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">
                          {med.authoredOn && formatDateTime(med.authoredOn)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMedication(med.id!)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vital Dialog */}
      <Dialog open={isVitalDialogOpen} onOpenChange={setIsVitalDialogOpen}>
        <DialogContent onClose={() => setIsVitalDialogOpen(false)}>
          <DialogHeader><DialogTitle>Record Vital Sign</DialogTitle></DialogHeader>
          <form onSubmit={handleAddVital} className="space-y-4">
            <Select label="Patient" value={vitalForm.patientId} onChange={(e) => setVitalForm({ ...vitalForm, patientId: e.target.value })} options={patients.map(p => ({ value: p.id!, label: getPatientDisplayName(p) }))} placeholder="Select patient" required />
            <Select label="Practitioner (optional)" value={vitalForm.practitionerId} onChange={(e) => setVitalForm({ ...vitalForm, practitionerId: e.target.value })} options={[{ value: "", label: "None" }, ...practitioners.map(p => ({ value: p.id!, label: `Dr. ${getPractitionerDisplayName(p)}` }))]} />
            <Select label="Vital Type" value={vitalForm.vitalType} onChange={(e) => { const t = e.target.value as VitalType; setVitalForm({ ...vitalForm, vitalType: t, unit: vitalUnits[t] }); }} options={vitalOptions} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Value" type="number" step="0.1" value={vitalForm.value} onChange={(e) => setVitalForm({ ...vitalForm, value: e.target.value })} required />
              <Input label="Unit" value={vitalForm.unit} onChange={(e) => setVitalForm({ ...vitalForm, unit: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVitalDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Condition Dialog */}
      <Dialog open={isConditionDialogOpen} onOpenChange={setIsConditionDialogOpen}>
        <DialogContent onClose={() => setIsConditionDialogOpen(false)}>
          <DialogHeader><DialogTitle>Add Condition/Diagnosis</DialogTitle></DialogHeader>
          <form onSubmit={handleAddCondition} className="space-y-4">
            <Select label="Patient" value={conditionForm.patientId} onChange={(e) => setConditionForm({ ...conditionForm, patientId: e.target.value })} options={patients.map(p => ({ value: p.id!, label: getPatientDisplayName(p) }))} placeholder="Select patient" required />
            <Input label="Condition Name" value={conditionForm.name} onChange={(e) => setConditionForm({ ...conditionForm, name: e.target.value })} placeholder="e.g., Hypertension, Diabetes" required />
            <Select label="Clinical Status" value={conditionForm.clinicalStatus} onChange={(e) => setConditionForm({ ...conditionForm, clinicalStatus: e.target.value })} options={[{ value: "active", label: "Active" }, { value: "resolved", label: "Resolved" }]} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConditionDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen}>
        <DialogContent onClose={() => setIsMedicationDialogOpen(false)}>
          <DialogHeader><DialogTitle>Add Prescription</DialogTitle></DialogHeader>
          <form onSubmit={handleAddMedication} className="space-y-4">
            <Select label="Patient" value={medicationForm.patientId} onChange={(e) => setMedicationForm({ ...medicationForm, patientId: e.target.value })} options={patients.map(p => ({ value: p.id!, label: getPatientDisplayName(p) }))} placeholder="Select patient" required />
            <Select label="Prescriber" value={medicationForm.practitionerId} onChange={(e) => setMedicationForm({ ...medicationForm, practitionerId: e.target.value })} options={practitioners.map(p => ({ value: p.id!, label: `Dr. ${getPractitionerDisplayName(p)}` }))} placeholder="Select practitioner" required />
            <Input label="Medication Name" value={medicationForm.name} onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })} placeholder="e.g., Amoxicillin 500mg" required />
            <Input label="Dosage Instructions" value={medicationForm.dosage} onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })} placeholder="e.g., Take 1 tablet 3 times daily" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMedicationDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}