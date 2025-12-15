"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import type { Appointment, Patient, Practitioner, AppointmentStatus } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName, getAppointmentStatusColor, getAppointmentStatusLabel } from "@/lib/fhir-utils";
import { formatDateTime } from "@/lib/utils";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    practitionerId: "",
    date: "",
    time: "",
    duration: "30",
    status: "booked" as AppointmentStatus,
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [appointmentsRes, patientsRes, practitionersRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/patients"),
        fetch("/api/practitioners"),
      ]);
      const [appointmentsData, patientsData, practitionersData] = await Promise.all([
        appointmentsRes.json(),
        patientsRes.json(),
        practitionersRes.json(),
      ]);
      setAppointments(appointmentsData);
      setPatients(patientsData);
      setPractitioners(practitionersData);
    } catch (_error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const getParticipantName = (appointment: Appointment, type: "Patient" | "Practitioner") => {
    const participant = appointment.participant?.find(p => p.actor?.reference?.startsWith(type));
    return participant?.actor?.display || "Unknown";
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const patientName = getParticipantName(appointment, "Patient").toLowerCase();
    const practitionerName = getParticipantName(appointment, "Practitioner").toLowerCase();
    const query = searchQuery.toLowerCase();
    return patientName.includes(query) || practitionerName.includes(query);
  });

  function openCreateDialog() {
    setEditingAppointment(null);
    setFormData({
      patientId: "",
      practitionerId: "",
      date: "",
      time: "",
      duration: "30",
      status: "booked",
      description: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(appointment: Appointment) {
    setEditingAppointment(appointment);
    const patientRef = appointment.participant?.find(p => p.actor?.reference?.startsWith("Patient"))?.actor?.reference;
    const practitionerRef = appointment.participant?.find(p => p.actor?.reference?.startsWith("Practitioner"))?.actor?.reference;
    const startDate = appointment.start ? new Date(appointment.start) : null;
    
    setFormData({
      patientId: patientRef?.split("/")[1] || "",
      practitionerId: practitionerRef?.split("/")[1] || "",
      date: startDate ? startDate.toISOString().split("T")[0] : "",
      time: startDate ? startDate.toTimeString().slice(0, 5) : "",
      duration: appointment.minutesDuration?.toString() || "30",
      status: appointment.status,
      description: appointment.description || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const patient = patients.find(p => p.id === formData.patientId);
    const practitioner = practitioners.find(p => p.id === formData.practitionerId);
    
    if (!patient || !practitioner) return;

    const startDateTime = new Date(`${formData.date}T${formData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

    const appointmentData = {
      status: formData.status,
      description: formData.description || undefined,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      minutesDuration: parseInt(formData.duration),
      participant: [
        {
          actor: {
            reference: `Patient/${patient.id}`,
            display: getPatientDisplayName(patient),
          },
          status: "accepted" as const,
        },
        {
          actor: {
            reference: `Practitioner/${practitioner.id}`,
            display: getPractitionerDisplayName(practitioner),
          },
          status: "accepted" as const,
        },
      ],
    };

    try {
      if (editingAppointment) {
        await fetch(`/api/appointments?id=${editingAppointment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        });
      } else {
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appointmentData),
        });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (_error) {
      console.error("Failed to save appointment");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await fetch(`/api/appointments?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (_error) {
      console.error("Failed to delete appointment");
    }
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    try {
      await fetch(`/api/appointments?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (_error) {
      console.error("Failed to update status");
    }
  }

  const statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: "proposed", label: "Proposed" },
    { value: "pending", label: "Pending" },
    { value: "booked", label: "Booked" },
    { value: "arrived", label: "Arrived" },
    { value: "fulfilled", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "noshow", label: "No Show" },
  ];

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage appointments (FHIR Appointment resources)</p>
        </div>
        <Button onClick={openCreateDialog} disabled={patients.length === 0 || practitioners.length === 0}>
          <Plus className="mr-1.5 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      {(patients.length === 0 || practitioners.length === 0) && (
        <div className="flex items-center rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm text-yellow-800">
            {patients.length === 0 && practitioners.length === 0
              ? "Add patients and practitioners before scheduling appointments."
              : patients.length === 0
              ? "Add patients before scheduling appointments."
              : "Add practitioners before scheduling appointments."}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Appointment Schedule</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading appointments...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "No appointments match your search" : "No appointments scheduled"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden sm:table-cell">Practitioner</TableHead>
                  <TableHead className="hidden md:table-cell">Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getParticipantName(appointment, "Patient")}</p>
                        <p className="text-xs text-gray-500 sm:hidden">
                          Dr. {getParticipantName(appointment, "Practitioner")}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {appointment.start && formatDateTime(appointment.start)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      Dr. {getParticipantName(appointment, "Practitioner")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p>{appointment.start && formatDateTime(appointment.start)}</p>
                          {appointment.minutesDuration && (
                            <p className="text-xs text-gray-500">{appointment.minutesDuration} min</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id!, e.target.value as AppointmentStatus)}
                        options={statusOptions}
                        className={`h-8 w-28 text-xs ${getAppointmentStatusColor(appointment.status)}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(appointment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(appointment.id!)}>
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
            <DialogTitle>{editingAppointment ? "Edit Appointment" : "Schedule Appointment"}</DialogTitle>
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
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                options={[
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "45", label: "45 minutes" },
                  { value: "60", label: "1 hour" },
                ]}
              />
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                options={statusOptions}
              />
            </div>
            <Input
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Reason for visit"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingAppointment ? "Save Changes" : "Schedule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}