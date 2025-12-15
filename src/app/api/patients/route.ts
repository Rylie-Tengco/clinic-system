import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/db";
import type { Patient } from "@/types/fhir";

const RESOURCE_TYPE = "patients";

// GET all patients or single patient by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const patient = await getResourceById<Patient>(RESOURCE_TYPE, id);
      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(patient);
    }

    const patients = await getAllResources<Patient>(RESOURCE_TYPE);
    return NextResponse.json(patients);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const patient: Patient = {
      resourceType: "Patient",
      ...body,
    };

    const created = await createResource<Patient>(RESOURCE_TYPE, patient);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}

// PUT update existing patient
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Patient>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update patient" },
      { status: 500 }
    );
  }
}

// DELETE patient
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Patient deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete patient" },
      { status: 500 }
    );
  }
}