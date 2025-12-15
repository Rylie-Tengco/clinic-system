import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  searchResources,
} from "@/lib/db";
import type { MedicationRequest } from "@/types/fhir";

const RESOURCE_TYPE = "medication-requests";

// GET all medication requests or single by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patient");

    if (id) {
      const medicationRequest = await getResourceById<MedicationRequest>(RESOURCE_TYPE, id);
      if (!medicationRequest) {
        return NextResponse.json(
          { error: "MedicationRequest not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(medicationRequest);
    }

    // Filter by patient if provided
    if (patientId) {
      const medicationRequests = await searchResources<MedicationRequest>(
        RESOURCE_TYPE,
        (req) => req.subject?.reference === `Patient/${patientId}`
      );
      return NextResponse.json(medicationRequests);
    }

    const medicationRequests = await getAllResources<MedicationRequest>(RESOURCE_TYPE);
    return NextResponse.json(medicationRequests);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch medication requests" },
      { status: 500 }
    );
  }
}

// POST create new medication request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const medicationRequest: MedicationRequest = {
      resourceType: "MedicationRequest",
      status: body.status || "active",
      intent: body.intent || "order",
      subject: body.subject,
      ...body,
    };

    const created = await createResource<MedicationRequest>(RESOURCE_TYPE, medicationRequest);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create medication request" },
      { status: 500 }
    );
  }
}

// PUT update existing medication request
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "MedicationRequest ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<MedicationRequest>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "MedicationRequest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update medication request" },
      { status: 500 }
    );
  }
}

// DELETE medication request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "MedicationRequest ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "MedicationRequest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "MedicationRequest deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete medication request" },
      { status: 500 }
    );
  }
}