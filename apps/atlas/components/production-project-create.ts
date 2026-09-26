export const productionProjectLimits = { description: 280, files: 10, fileSize: 20 * 1024 * 1024, id: 48, name: 80 } as const;
export const productionProjectIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductionProjectField = "projectId" | "projectName" | "projectDescription" | "prdFiles" | "form";
export type ProductionProjectErrors = Partial<Record<ProductionProjectField, string>>;
export type ProductionProjectInput = { projectId: string; projectName: string; projectDescription: string; files: readonly File[] };
type ProjectRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type CreatedProject = { project: { projectId: string; name: string; documentCount: number } };

export class ProductionProjectSubmissionError extends Error {
  constructor(readonly errors: ProductionProjectErrors) { super(errors.form ?? Object.values(errors)[0] ?? "Unable to create the project. Please try again."); }
}

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

function errorForStatus(status: number): ProductionProjectErrors {
  if (status === 409) return { projectId: "That project ID is already in use." };
  if (status === 413) return { prdFiles: "The project upload is too large." };
  if (status === 415) return { prdFiles: "Only PDF files can be added." };
  if (status === 400) return { form: "Review the project details and try again." };
  if (status === 401) return { form: "Your session has expired. Sign in and try again." };
  if (status === 403) return { form: "This request cannot be submitted from this site." };
  return { form: "Unable to create the project. Please try again." };
}

function isCreatedProject(value: unknown): value is CreatedProject {
  if (typeof value !== "object" || value === null || !("project" in value)) return false;
  const project = value.project;
  return typeof project === "object" && project !== null && "projectId" in project && "name" in project && "documentCount" in project && typeof project.projectId === "string" && project.projectId.length > 0 && typeof project.name === "string" && project.name.length > 0 && typeof project.documentCount === "number" && Number.isSafeInteger(project.documentCount) && project.documentCount > 0;
}

export async function submitProductionProject(input: ProductionProjectInput, request: ProjectRequest = fetch): Promise<CreatedProject> {
  const form = new FormData(); form.set("projectId", input.projectId.trim()); form.set("projectName", input.projectName.trim()); if (input.projectDescription.trim()) form.set("projectDescription", input.projectDescription.trim()); input.files.forEach((file) => form.append("prdFiles[]", file));
  let response: Response;
  try { response = await request("/api/projects", { body: form, method: "POST" }); } catch { throw new ProductionProjectSubmissionError({ form: "Unable to create the project. Please try again." }); }
  if (!response.ok) throw new ProductionProjectSubmissionError(errorForStatus(response.status));
  let body: unknown;
  try { body = await response.json(); } catch { throw new ProductionProjectSubmissionError({ form: "The project response was incomplete. Please try again." }); }
  if (!isCreatedProject(body)) throw new ProductionProjectSubmissionError({ form: "The project response was incomplete. Please try again." });
  return body;
}

export function createProductionProjectSubmitter(request: ProjectRequest = fetch) {
  let inFlight: Promise<CreatedProject> | null = null;
  return (input: ProductionProjectInput) => {
    if (!inFlight) inFlight = submitProductionProject(input, request).finally(() => { inFlight = null; });
    return inFlight;
  };
}
