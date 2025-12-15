import { NextRequest, NextResponse } from "next/server";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  searchResources,
} from "@/lib/db";
import type { Condition } from "@/types/fhir";

const RESOURCE_TYPE = "conditions";

// GET all conditions or single condition by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const patientId = searchParams.get("patient");

    if (id) {
      const condition = await getResourceById<Condition>(RESOURCE_TYPE, id);
      if (!condition) {
        return NextResponse.json(
          { error: "Condition not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(condition);
    }

    // Filter by patient if provided
    if (patientId) {
      const conditions = await searchResources<Condition>(
        RESOURCE_TYPE,
        (cond) => cond.subject?.reference === `Patient/${patientId}`
      );
      return NextResponse.json(conditions);
    }

    const conditions = await getAllResources<Condition>(RESOURCE_TYPE);
    return NextResponse.json(conditions);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch conditions" },
      { status: 500 }
    );
  }
}

// POST create new condition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const condition: Condition = {
      resourceType: "Condition",
      subject: body.subject,
      ...body,
    };

    const created = await createResource<Condition>(RESOURCE_TYPE, condition);
    return NextResponse.json(created, { status: 201 });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to create condition" },
      { status: 500 }
    );
  }
}

// PUT update existing condition
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Condition ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updated = await updateResource<Condition>(RESOURCE_TYPE, id, body);

    if (!updated) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update condition" },
      { status: 500 }
    );
  }
}

// DELETE condition
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Condition ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteResource(RESOURCE_TYPE, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Condition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Condition deleted successfully" });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to delete condition" },
      { status: 500 }
    );
  }
}