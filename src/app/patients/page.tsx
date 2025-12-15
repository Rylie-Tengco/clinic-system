"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import type { Patient } from "@/types/fhir";
import { getPatientDisplayName, getPhoneNumber, getEmail, calculateAge, formatAddress, getPrimaryAddress } from "@/lib/fhir-utils";
import { formatDate } from "@/lib/utils";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    givenName: "",
    familyName: "",
    gender: "unknown" as Patient["gender"],
    birthDate: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      setPatients(data);
    } catch (_error) {
      console.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter((patient) => {
    const name = getPatientDisplayName(patient).toLowerCase();
    const phone = getPhoneNumber(patient.telecom);
    const email = getEmail(patient.telecom);
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  function openCreateDialog() {
    setEditingPatient(null);
    setFormData({
      givenName: "",
      familyName: "",
      gender: "unknown",
      birthDate: "",
      phone: "",
      email: "",
      addressLine: "",
      city: "",
      state: "",
      postalCode: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(patient: Patient) {
    setEditingPatient(patient);
    const primaryName = patient.name?.[0];
    const primaryAddress = getPrimaryAddress(patient.address);
    setFormData({
      givenName: primaryName?.given?.[0] || "",
      familyName: primaryName?.family || "",
      gender: patient.gender || "unknown",
      birthDate: patient.birthDate || "",
      phone: getPhoneNumber(patient.telecom),
      email: getEmail(patient.telecom),
      addressLine: primaryAddress?.line?.[0] || "",
      city: primaryAddress?.city || "",
      state: primaryAddress?.state || "",
      postalCode: primaryAddress?.postalCode || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const patientData = {
      active: true,
      name: [{ use: "official" as const, family: formData.familyName, given: [formData.givenName] }],
      gender: formData.gender,
      birthDate: formData.birthDate,
      telecom: [
        ...(formData.phone ? [{ system: "phone" as const, value: formData.phone, use: "mobile" as const }] : []),
        ...(formData.email ? [{ system: "email" as const, value: formData.email }] : []),
      ],
      address: formData.addressLine || formData.city ? [{
        use: "home" as const,
        line: formData.addressLine ? [formData.addressLine] : undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
      }] : undefined,
    };

    try {
      if (editingPatient) {
        await fetch(`/api/patients?id=${editingPatient.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientData),
        });
      } else {
        await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientData),
        });
      }
      setIsDialogOpen(false);
      fetchPatients();
    } catch (_error) {
      console.error("Failed to save patient");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this patient?")) return;
    
    try {
      await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
      fetchPatients();
    } catch (_error) {
      console.error("Failed to delete patient");
    }
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="mt-1 text-sm text-gray-500">Manage patient records (FHIR Patient resources)</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Patient Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "No patients match your search" : "No patients yet"}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" className="mt-2" onClick={openCreateDialog}>
                  Add your first patient
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead className="hidden md:table-cell">Age</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPatientDisplayName(patient)}</p>
                        <p className="text-xs text-gray-500 sm:hidden">
                          {patient.gender} • {calculateAge(patient.birthDate)} yrs
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {patient.gender || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {patient.birthDate ? (
                        <div>
                          <p>{calculateAge(patient.birthDate)} yrs</p>
                          <p className="text-xs text-gray-500">{formatDate(patient.birthDate)}</p>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <p>{getPhoneNumber(patient.telecom) || "-"}</p>
                        <p className="text-xs text-gray-500">{getEmail(patient.telecom)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <p className="max-w-[200px] truncate text-sm">
                        {formatAddress(getPrimaryAddress(patient.address)) || "-"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(patient)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(patient.id!)}>
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
            <DialogTitle>{editingPatient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={formData.givenName}
                onChange={(e) => setFormData({ ...formData, givenName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Patient["gender"] })}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <Input
              label="Address"
              value={formData.addressLine}
              onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
              placeholder="Street address"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="Postal Code"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPatient ? "Save Changes" : "Add Patient"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}