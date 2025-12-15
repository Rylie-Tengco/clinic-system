import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  searchResources,
} from "@/lib/db";
import type { Observation } from "@/types/fhir";

const RESOURCE_TYPE = "observations";

// GET all observations or single observation by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patient");
    const encounterId = searchParams.get("encounter");

    if (id) {
      const observation = await getResourceById<Observation>(RESOURCE_TYPE, id);
      if (!observation) {
        return NextResponse.json(
          { error: "Observation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(observation);
    }

    // Filter by patient or encounter if provided
    if (patientId || encounterId) {
      const observations = await searchResources<Observation>(
        RESOURCE_TYPE,
        (obs) => {
          if (patientId && obs.subject?.reference !== `Patient/${patientId}`) {
            return false;
          }
          if (encounterId && obs.encounter?.reference !== `Encounter/${encounterId}`) {
            return false;
          }
          return true;
        }
      );
      return NextResponse.json(observations);
    }

    const observations = await getAllResources<Observation>(RESOURCE_TYPE);
    return NextResponse.json(observations);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch observations" },
      { status: 500 }
    );
  }
}

// POST create new observation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const observation: Observation = {
      resourceType: "Observation",
      status: body.status || "final",
      code: body.code,
      ...body,
    };

    const created = await createResource<Observation>(RESOURCE_TYPE, observation);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create observation" },
      { status: 500 }
    );
  }
}

// PUT update existing observation
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Observation ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Observation>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Observation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update observation" },
      { status: 500 }
    );
  }
}

// DELETE observation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Observation ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Observation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Observation deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete observation" },
      { status: 500 }
    );
  }
}