"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  Activity,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Patient, Practitioner, Appointment, Encounter } from "@/types/fhir";
import { getPatientDisplayName, getPractitionerDisplayName, getAppointmentStatusColor, getAppointmentStatusLabel } from "@/lib/fhir-utils";
import { formatDateTime } from "@/lib/utils";

interface DashboardStats {
  patients: number;
  practitioners: number;
  appointments: number;
  encounters: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    practitioners: 0,
    appointments: 0,
    encounters: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [activeEncounters, setActiveEncounters] = useState<Encounter[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [patientsRes, practitionersRes, appointmentsRes, encountersRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/practitioners"),
          fetch("/api/appointments"),
          fetch("/api/encounters"),
        ]);

        const patientsData = await patientsRes.json();
        const practitionersData = await practitionersRes.json();
        const appointmentsData = await appointmentsRes.json();
        const encountersData = await encountersRes.json();

        setPatients(patientsData);
        setPractitioners(practitionersData);
        
        setStats({
          patients: patientsData.length,
          practitioners: practitionersData.length,
          appointments: appointmentsData.length,
          encounters: encountersData.length,
        });

        // Get recent appointments (sorted by start date)
        const sortedAppointments = [...appointmentsData].sort((a: Appointment, b: Appointment) => {
          return new Date(b.start || 0).getTime() - new Date(a.start || 0).getTime();
        });
        setRecentAppointments(sortedAppointments.slice(0, 5));

        // Get active encounters
        const active = encountersData.filter((e: Encounter) => e.status === "in-progress");
        setActiveEncounters(active.slice(0, 5));
      } catch (_error) {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getParticipantName = (appointment: Appointment, type: "Patient" | "Practitioner") => {
    const participant = appointment.participant?.find(p => 
      p.actor?.reference?.startsWith(type)
    );
    return participant?.actor?.display || "Unknown";
  };

  const statCards = [
    {
      title: "Total Patients",
      value: stats.patients,
      icon: Users,
      href: "/patients",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Practitioners",
      value: stats.practitioners,
      icon: UserCog,
      href: "/practitioners",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Appointments",
      value: stats.appointments,
      icon: Calendar,
      href: "/appointments",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Encounters",
      value: stats.encounters,
      icon: ClipboardList,
      href: "/encounters",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-pulse text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your FHIR HL7 compliant clinic management system
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/patients">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Patient
            </Button>
          </Link>
          <Link href="/appointments">
            <Button variant="outline" size="sm">
              <Calendar className="mr-1.5 h-4 w-4" />
              Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="p-6 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-gray-900">{stat.value}</p>
                </div>
                <div className={`shrink-0 rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Appointments</CardTitle>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No appointments yet</p>
                <Link href="/appointments" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">
                    Schedule Appointment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {getParticipantName(appointment, "Patient")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dr. {getParticipantName(appointment, "Practitioner")}
                      </p>
                      {appointment.start && (
                        <p className="mt-1 text-xs text-gray-400">
                          {formatDateTime(appointment.start)}
                        </p>
                      )}
                    </div>
                    <Badge className={getAppointmentStatusColor(appointment.status)}>
                      {getAppointmentStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Encounters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Active Encounters</CardTitle>
            <Link href="/encounters">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeEncounters.length === 0 ? (
              <div className="py-8 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No active encounters</p>
                <Link href="/encounters" className="mt-2 inline-block">
                  <Button variant="outline" size="sm">
                    Start Encounter
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEncounters.map((encounter) => (
                  <div
                    key={encounter.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {encounter.subject?.display || "Unknown Patient"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {encounter.participant?.[0]?.individual?.display || "Unknown Provider"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {encounter.class?.display || "Ambulatory"}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">In Progress</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Recent Patients</p>
              <div className="mt-2 space-y-1">
                {patients.slice(0, 3).map((patient) => (
                  <p key={patient.id} className="truncate text-sm text-gray-700">
                    {getPatientDisplayName(patient)}
                  </p>
                ))}
                {patients.length === 0 && (
                  <p className="text-sm text-gray-400">No patients</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Staff on Duty</p>
              <div className="mt-2 space-y-1">
                {practitioners.slice(0, 3).map((practitioner) => (
                  <p key={practitioner.id} className="truncate text-sm text-gray-700">
                    Dr. {getPractitionerDisplayName(practitioner)}
                  </p>
                ))}
                {practitioners.length === 0 && (
                  <p className="text-sm text-gray-400">No practitioners</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Today's Schedule</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {recentAppointments.filter(a => {
                  if (!a.start) return false;
                  const today = new Date().toDateString();
                  return new Date(a.start).toDateString() === today;
                }).length}
              </p>
              <p className="text-xs text-gray-400">appointments today</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">FHIR Resources</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.patients + stats.practitioners + stats.appointments + stats.encounters}
              </p>
              <p className="text-xs text-gray-400">total resources</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}