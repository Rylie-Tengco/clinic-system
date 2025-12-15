"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, ClipboardList, Play, Square } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import type { Encounter, Patient, Practitioner, EncounterStatus } from "@/types/fhir";
import { ENCOUNTER_CLASS } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName, getEncounterStatusColor, getEncounterStatusLabel } from "@/lib/fhir-utils";
import { formatDateTime } from "@/lib/utils";

export default function EncountersPage() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    practitionerId: "",
    classType: "AMBULATORY" as keyof typeof ENCOUNTER_CLASS,
    status: "in-progress" as EncounterStatus,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [encountersRes, patientsRes, practitionersRes] = await Promise.all([
        fetch("/api/encounters"),
        fetch("/api/patients"),
        fetch("/api/practitioners"),
      ]);
      const [encountersData, patientsData, practitionersData] = await Promise.all([
        encountersRes.json(),
        patientsRes.json(),
        practitionersRes.json(),
      ]);
      setEncounters(encountersData);
      setPatients(patientsData);
      setPractitioners(practitionersData);
    } catch (_error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const filteredEncounters = encounters.filter((encounter) => {
    const patientName = encounter.subject?.display?.toLowerCase() || "";
    const practitionerName = encounter.participant?.[0]?.individual?.display?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return patientName.includes(query) || practitionerName.includes(query);
  });

  function openCreateDialog() {
    setEditingEncounter(null);
    setFormData({
      patientId: "",
      practitionerId: "",
      classType: "AMBULATORY",
      status: "in-progress",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(encounter: Encounter) {
    setEditingEncounter(encounter);
    const patientRef = encounter.subject?.reference;
    const practitionerRef = encounter.participant?.[0]?.individual?.reference;
    
    let classType: keyof typeof ENCOUNTER_CLASS = "AMBULATORY";
    if (encounter.class?.code === "EMER") classType = "EMERGENCY";
    else if (encounter.class?.code === "IMP") classType = "INPATIENT";
    else if (encounter.class?.code === "VR") classType = "VIRTUAL";
    
    setFormData({
      patientId: patientRef?.split("/")[1] || "",
      practitionerId: practitionerRef?.split("/")[1] || "",
      classType,
      status: encounter.status,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const patient = patients.find(p => p.id === formData.patientId);
    const practitioner = practitioners.find(p => p.id === formData.practitionerId);
    
    if (!patient || !practitioner) return;

    const encounterData = {
      status: formData.status,
      class: ENCOUNTER_CLASS[formData.classType],
      subject: {
        reference: `Patient/${patient.id}`,
        display: getPatientDisplayName(patient),
      },
      participant: [{
        individual: {
          reference: `Practitioner/${practitioner.id}`,
          display: getPractitionerDisplayName(practitioner),
        },
      }],
      period: {
        start: new Date().toISOString(),
        ...(formData.status === "finished" ? { end: new Date().toISOString() } : {}),
      },
    };

    try {
      if (editingEncounter) {
        await fetch(`/api/encounters?id=${editingEncounter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encounterData),
        });
      } else {
        await fetch("/api/encounters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encounterData),
        });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (_error) {
      console.error("Failed to save encounter");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this encounter?")) return;
    try {
      await fetch(`/api/encounters?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (_error) {
      console.error("Failed to delete encounter");
    }
  }

  async function handleEndEncounter(encounter: Encounter) {
    try {
      await fetch(`/api/encounters?id=${encounter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "finished",
          period: {
            ...encounter.period,
            end: new Date().toISOString(),
          },
        }),
      });
      fetchData();
    } catch (_error) {
      console.error("Failed to end encounter");
    }
  }

  const statusOptions: { value: EncounterStatus; label: string }[] = [
    { value: "planned", label: "Planned" },
    { value: "arrived", label: "Arrived" },
    { value: "triaged", label: "Triaged" },
    { value: "in-progress", label: "In Progress" },
    { value: "onleave", label: "On Leave" },
    { value: "finished", label: "Finished" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const classOptions: { value: keyof typeof ENCOUNTER_CLASS; label: string }[] = [
    { value: "AMBULATORY", label: "Ambulatory (Outpatient)" },
    { value: "EMERGENCY", label: "Emergency" },
    { value: "INPATIENT", label: "Inpatient" },
    { value: "VIRTUAL", label: "Virtual/Telehealth" },
  ];

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encounters</h1>
          <p className="mt-1 text-sm text-gray-500">Manage patient visits (FHIR Encounter resources)</p>
        </div>
        <Button onClick={openCreateDialog} disabled={patients.length === 0 || practitioners.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" />
          Start Encounter
        </Button>
      </div>

      {(patients.length === 0 || practitioners.length === 0) && (
        <div className="flex items-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm text-yellow-800">
            Add patients and practitioners before starting encounters.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Patient Encounters</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search encounters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading encounters...</div>
          ) : filteredEncounters.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "No encounters match your search" : "No encounters yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden sm:table-cell">Provider</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEncounters.map((encounter) => (
                  <TableRow key={encounter.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{encounter.subject?.display || "Unknown"}</p>
                        <p className="text-xs text-gray-500 sm:hidden">
                          {encounter.participant?.[0]?.individual?.display || "Unknown"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Dr. {encounter.participant?.[0]?.individual?.display || "Unknown"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {encounter.class?.display || "Ambulatory"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEncounterStatusColor(encounter.status)}>
                        {getEncounterStatusLabel(encounter.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {encounter.period?.start && formatDateTime(encounter.period.start)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {encounter.status === "in-progress" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEndEncounter(encounter)}
                            title="End Encounter"
                          >
                            <Square className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(encounter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(encounter.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent onClose={() => setIsDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingEncounter ? "Edit Encounter" : "Start New Encounter"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Patient"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              options={patients.map(p => ({ value: p.id!, label: getPatientDisplayName(p) }))}
              placeholder="Select a patient"
              required
            />
            <Select
              label="Practitioner"
              value={formData.practitionerId}
              onChange={(e) => setFormData({ ...formData, practitionerId: e.target.value })}
              options={practitioners.map(p => ({ value: p.id!, label: `Dr. ${getPractitionerDisplayName(p)}` }))}
              placeholder="Select a practitioner"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Encounter Class"
                value={formData.classType}
                onChange={(e) => setFormData({ ...formData, classType: e.target.value as keyof typeof ENCOUNTER_CLASS })}
                options={classOptions}
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as EncounterStatus })}
                options={statusOptions}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Play className="mr-1.5 h-4 w-4" />
                {editingEncounter ? "Save Changes" : "Start Encounter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}