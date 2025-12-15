import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/db";
import type { Encounter } from "@/types/fhir";
import { ENCOUNTER_CLASS } from "@/types/fhir";

const RESOURCE_TYPE = "encounters";

// GET all encounters or single encounter by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const encounter = await getResourceById<Encounter>(RESOURCE_TYPE, id);
      if (!encounter) {
        return NextResponse.json(
          { error: "Encounter not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(encounter);
    }

    const encounters = await getAllResources<Encounter>(RESOURCE_TYPE);
    return NextResponse.json(encounters);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch encounters" },
      { status: 500 }
    );
  }
}

// POST create new encounter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const encounter: Encounter = {
      resourceType: "Encounter",
      status: body.status || "in-progress",
      class: body.class || ENCOUNTER_CLASS.AMBULATORY,
      ...body,
    };

    const created = await createResource<Encounter>(RESOURCE_TYPE, encounter);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create encounter" },
      { status: 500 }
    );
  }
}

// PUT update existing encounter
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Encounter ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Encounter>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update encounter" },
      { status: 500 }
    );
  }
}

// DELETE encounter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Encounter ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Encounter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Encounter deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete encounter" },
      { status: 500 }
    );
  }
}