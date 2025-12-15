import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/db";
import type { Practitioner } from "@/types/fhir";

const RESOURCE_TYPE = "practitioners";

// GET all practitioners or single practitioner by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const practitioner = await getResourceById<Practitioner>(RESOURCE_TYPE, id);
      if (!practitioner) {
        return NextResponse.json(
          { error: "Practitioner not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(practitioner);
    }

    const practitioners = await getAllResources<Practitioner>(RESOURCE_TYPE);
    return NextResponse.json(practitioners);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch practitioners" },
      { status: 500 }
    );
  }
}

// POST create new practitioner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const practitioner: Practitioner = {
      resourceType: "Practitioner",
      ...body,
    };

    const created = await createResource<Practitioner>(RESOURCE_TYPE, practitioner);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create practitioner" },
      { status: 500 }
    );
  }
}

// PUT update existing practitioner
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Practitioner ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Practitioner>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Practitioner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update practitioner" },
      { status: 500 }
    );
  }
}

// DELETE practitioner
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Practitioner ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Practitioner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Practitioner deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete practitioner" },
      { status: 500 }
    );
  }
}