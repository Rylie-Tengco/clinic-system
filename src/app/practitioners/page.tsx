"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import type { Practitioner } from "@/types/fhir";
import { getPractitionerDisplayName, getPhoneNumber, getEmail, getCodeableConceptDisplay } from "@/lib/fhir-utils";

export default function PractitionersPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [formData, setFormData] = useState({
    givenName: "",
    familyName: "",
    gender: "unknown" as Practitioner["gender"],
    phone: "",
    email: "",
    specialty: "",
  });

  useEffect(() => {
    fetchPractitioners();
  }, []);

  async function fetchPractitioners() {
    try {
      const res = await fetch("/api/practitioners");
      const data = await res.json();
      setPractitioners(data);
    } catch (_error) {
      console.error("Failed to fetch practitioners");
    } finally {
      setLoading(false);
    }
  }

  const filteredPractitioners = practitioners.filter((practitioner) => {
    const name = getPractitionerDisplayName(practitioner).toLowerCase();
    const phone = getPhoneNumber(practitioner.telecom);
    const email = getEmail(practitioner.telecom);
    const specialty = practitioner.qualification?.[0]?.code?.text?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query) || specialty.includes(query);
  });

  function openCreateDialog() {
    setEditingPractitioner(null);
    setFormData({
      givenName: "",
      familyName: "",
      gender: "unknown",
      phone: "",
      email: "",
      specialty: "",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(practitioner: Practitioner) {
    setEditingPractitioner(practitioner);
    const primaryName = practitioner.name?.[0];
    setFormData({
      givenName: primaryName?.given?.[0] || "",
      familyName: primaryName?.family || "",
      gender: practitioner.gender || "unknown",
      phone: getPhoneNumber(practitioner.telecom),
      email: getEmail(practitioner.telecom),
      specialty: getCodeableConceptDisplay(practitioner.qualification?.[0]?.code),
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const practitionerData = {
      active: true,
      name: [{ use: "official" as const, family: formData.familyName, given: [formData.givenName] }],
      gender: formData.gender,
      telecom: [
        ...(formData.phone ? [{ system: "phone" as const, value: formData.phone, use: "work" as const }] : []),
        ...(formData.email ? [{ system: "email" as const, value: formData.email, use: "work" as const }] : []),
      ],
      qualification: formData.specialty ? [{
        code: {
          coding: [{ code: formData.specialty.toLowerCase().replace(/\s+/g, "-"), display: formData.specialty }],
          text: formData.specialty,
        },
      }] : undefined,
    };

    try {
      if (editingPractitioner) {
        await fetch(`/api/practitioners?id=${editingPractitioner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(practitionerData),
        });
      } else {
        await fetch("/api/practitioners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(practitionerData),
        });
      }
      setIsDialogOpen(false);
      fetchPractitioners();
    } catch (_error) {
      console.error("Failed to save practitioner");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this practitioner?")) return;
    
    try {
      await fetch(`/api/practitioners?id=${id}`, { method: "DELETE" });
      fetchPractitioners();
    } catch (_error) {
      console.error("Failed to delete practitioner");
    }
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practitioners</h1>
          <p className="mt-1 text-sm text-gray-500">Manage healthcare providers (FHIR Practitioner resources)</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Practitioner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Practitioner Directory</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search practitioners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">Loading practitioners...</div>
          ) : filteredPractitioners.length === 0 ? (
            <div className="py-8 text-center">
              <UserCog className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? "No practitioners match your search" : "No practitioners yet"}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" className="mt-2" onClick={openCreateDialog}>
                  Add your first practitioner
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Specialty</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead className="hidden lg:table-cell">Contact</TableHead>
                  <TableHead className="hidden xl:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPractitioners.map((practitioner) => (
                  <TableRow key={practitioner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">Dr. {getPractitionerDisplayName(practitioner)}</p>
                        <p className="text-xs text-gray-500 sm:hidden">
                          {getCodeableConceptDisplay(practitioner.qualification?.[0]?.code) || "General"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">
                        {getCodeableConceptDisplay(practitioner.qualification?.[0]?.code) || "General Practice"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {practitioner.gender || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <p>{getPhoneNumber(practitioner.telecom) || "-"}</p>
                        <p className="text-xs text-gray-500">{getEmail(practitioner.telecom)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant={practitioner.active !== false ? "success" : "secondary"}>
                        {practitioner.active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(practitioner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(practitioner.id!)}>
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
            <DialogTitle>{editingPractitioner ? "Edit Practitioner" : "Add New Practitioner"}</DialogTitle>
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
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Practitioner["gender"] })}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "unknown", label: "Unknown" },
                ]}
              />
              <Input
                label="Specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g., Cardiology, Pediatrics"
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingPractitioner ? "Save Changes" : "Add Practitioner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}