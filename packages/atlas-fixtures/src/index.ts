export type ProjectStatus = "ready" | "processing" | "needs-attention";

export type ProjectFixture = {
  id: string;
  name: string;
  status: ProjectStatus;
  prdCount: number;
  collaborators: number;
  lastActivity: string;
};

export const atlasWorkspaceFixture = {
  user: {
    name: "Nadia Hartono",
    email: "nadia@example.com",
  },
  projects: [
    {
      id: "safara",
      name: "Safara operations platform",
      status: "ready",
      prdCount: 3,
      collaborators: 4,
      lastActivity: "Atlas understanding is ready to review",
    },
    {
      id: "member-portal",
      name: "Member portal refresh",
      status: "processing",
      prdCount: 2,
      collaborators: 2,
      lastActivity: "Extracting project facts",
    },
  ] satisfies ProjectFixture[],
} as const;
