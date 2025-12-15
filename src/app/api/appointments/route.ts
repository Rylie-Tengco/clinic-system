import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/db";
import type { Appointment } from "@/types/fhir";

const RESOURCE_TYPE = "appointments";

// GET all appointments or single appointment by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const appointment = await getResourceById<Appointment>(RESOURCE_TYPE, id);
      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(appointment);
    }

    const appointments = await getAllResources<Appointment>(RESOURCE_TYPE);
    return NextResponse.json(appointments);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

// POST create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const appointment: Appointment = {
      resourceType: "Appointment",
      status: body.status || "booked",
      participant: body.participant || [],
      ...body,
    };

    const created = await createResource<Appointment>(RESOURCE_TYPE, appointment);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 }
    );
  }
}

// PUT update existing appointment
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Appointment>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

// DELETE appointment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}