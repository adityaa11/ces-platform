export const productionProjectLimits = {
  description: 280,
  files: 10,
  fileSize: 20 * 1024 * 1024,
  id: 48,
  name: 80,
} as const;

export const productionProjectIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductionProjectField = "projectId" | "projectName" | "projectDescription" | "prdFiles";
export type ProductionProjectErrors = Partial<Record<ProductionProjectField, string>>;
export type ProductionProjectInput = { projectId: string; projectName: string; projectDescription: string; files: readonly File[] };

export function validateProductionProject(input: ProductionProjectInput): ProductionProjectErrors {
  const errors: ProductionProjectErrors = {};
  if (!input.projectId.trim()) errors.projectId = "Enter a project ID.";
  else if (input.projectId.length < 3 || input.projectId.length > productionProjectLimits.id || !productionProjectIdPattern.test(input.projectId)) errors.projectId = "Use 3–48 lowercase letters, numbers, and hyphens, for example customer-portal-v2.";
  if (!input.projectName.trim()) errors.projectName = "Enter a project name.";
  else if (input.projectName.length > productionProjectLimits.name) errors.projectName = "Project name must be 80 characters or fewer.";
  if (input.projectDescription.length > productionProjectLimits.description) errors.projectDescription = "Project description must be 280 characters or fewer.";
  if (!input.files.length) errors.prdFiles = "Select at least one PRD PDF.";
  else if (input.files.length > productionProjectLimits.files) errors.prdFiles = "Select no more than 10 PRD PDFs.";
  else if (input.files.some((file) => file.type !== "application/pdf")) errors.prdFiles = "Only PDF files can be added.";
  else if (input.files.some((file) => file.size > productionProjectLimits.fileSize)) errors.prdFiles = "Each PDF must be 20 MiB or smaller.";
  return errors;
}

export async function submitProductionProject(input: ProductionProjectInput, request: typeof fetch = fetch) {
  const form = new FormData();
  form.set("projectId", input.projectId.trim());
  form.set("projectName", input.projectName.trim());
  if (input.projectDescription.trim()) form.set("projectDescription", input.projectDescription.trim());
  input.files.forEach((file) => form.append("prdFiles[]", file));
  const response = await request("/api/projects", { body: form, method: "POST" });
  if (!response.ok) {
    let error = "Unable to create the project. Please try again.";
    try { const body = await response.json(); if (typeof body?.error === "string") error = body.error; } catch { /* use bounded fallback */ }
    throw new Error(error);
  }
  return response.json() as Promise<{ project: { projectId: string; name: string; documentCount: number } }>;
}
