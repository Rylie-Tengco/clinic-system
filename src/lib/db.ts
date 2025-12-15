import { promises as fs } from "fs";
import path from "path";
import type { Bundle, FHIRResource, Meta } from "@/types/fhir";

const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generate FHIR-compliant meta
export function createMeta(versionId = "1"): Meta {
  return {
    versionId,
    lastUpdated: new Date().toISOString(),
  };
}

// Generate unique ID
export function generateFHIRId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

// Read a FHIR Bundle from JSON file
export async function readBundle<T extends FHIRResource>(
  resourceType: string
): Promise<Bundle<T>> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${resourceType.toLowerCase()}.json`);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Bundle<T>;
  } catch {
    // Return empty bundle if file doesn't exist
    const emptyBundle: Bundle<T> = {
      resourceType: "Bundle",
      type: "collection",
      total: 0,
      entry: [],
    };
    await writeBundle(resourceType, emptyBundle);
    return emptyBundle;
  }
}

// Write a FHIR Bundle to JSON file
export async function writeBundle<T extends FHIRResource>(
  resourceType: string,
  bundle: Bundle<T>
): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${resourceType.toLowerCase()}.json`);
  bundle.total = bundle.entry?.length ?? 0;
  await fs.writeFile(filePath, JSON.stringify(bundle, null, 2), "utf-8");
}

// Get all resources of a type
export async function getAllResources<T extends FHIRResource>(
  resourceType: string
): Promise<T[]> {
  const bundle = await readBundle<T>(resourceType);
  return (bundle.entry?.map((e) => e.resource).filter(Boolean) as T[]) ?? [];
}

// Get a single resource by ID
export async function getResourceById<T extends FHIRResource>(
  resourceType: string,
  id: string
): Promise<T | null> {
  const resources = await getAllResources<T>(resourceType);
  return resources.find((r) => r.id === id) ?? null;
}

// Create a new resource
export async function createResource<T extends FHIRResource>(
  resourceType: string,
  resource: T
): Promise<T> {
  const bundle = await readBundle<T>(resourceType);

  // Assign ID and meta if not present
  if (!resource.id) {
    resource.id = generateFHIRId(resourceType.toLowerCase().substring(0, 3));
  }
  resource.meta = createMeta();

  bundle.entry = bundle.entry ?? [];
  bundle.entry.push({
    fullUrl: `urn:uuid:${resource.id}`,
    resource,
  });

  await writeBundle(resourceType, bundle);
  return resource;
}

// Update an existing resource
export async function updateResource<T extends FHIRResource>(
  resourceType: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const bundle = await readBundle<T>(resourceType);

  const entryIndex = bundle.entry?.findIndex((e) => e.resource?.id === id) ?? -1;
  if (entryIndex === -1 || !bundle.entry) {
    return null;
  }

  const existingResource = bundle.entry[entryIndex].resource as T;
  const currentVersion = parseInt(existingResource.meta?.versionId ?? "1", 10);

  const updatedResource: T = {
    ...existingResource,
    ...updates,
    id, // Preserve ID
    resourceType: existingResource.resourceType, // Preserve resourceType
    meta: createMeta((currentVersion + 1).toString()),
  };

  bundle.entry[entryIndex].resource = updatedResource;
  await writeBundle(resourceType, bundle);

  return updatedResource;
}

// Delete a resource
export async function deleteResource<T extends FHIRResource>(
  resourceType: string,
  id: string
): Promise<boolean> {
  const bundle = await readBundle<T>(resourceType);

  const initialLength = bundle.entry?.length ?? 0;
  bundle.entry = bundle.entry?.filter((e) => e.resource?.id !== id) ?? [];

  if (bundle.entry.length === initialLength) {
    return false;
  }

  await writeBundle(resourceType, bundle);
  return true;
}

// Search resources by a field value
export async function searchResources<T extends FHIRResource>(
  resourceType: string,
  predicate: (resource: T) => boolean
): Promise<T[]> {
  const resources = await getAllResources<T>(resourceType);
  return resources.filter(predicate);
}

// Batch create resources
export async function batchCreateResources<T extends FHIRResource>(
  resourceType: string,
  resources: T[]
): Promise<T[]> {
  const bundle = await readBundle<T>(resourceType);
  bundle.entry = bundle.entry ?? [];

  const createdResources: T[] = [];

  for (const resource of resources) {
    if (!resource.id) {
      resource.id = generateFHIRId(resourceType.toLowerCase().substring(0, 3));
    }
    resource.meta = createMeta();

    bundle.entry.push({
      fullUrl: `urn:uuid:${resource.id}`,
      resource,
    });

    createdResources.push(resource);
  }

  await writeBundle(resourceType, bundle);
  return createdResources;
}

// Get resource count
export async function getResourceCount(resourceType: string): Promise<number> {
  const bundle = await readBundle(resourceType);
  return bundle.entry?.length ?? 0;
}