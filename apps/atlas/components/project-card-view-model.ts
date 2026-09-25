/** Browser-safe, persisted-data projection for a production project card. */
export type ProjectCardViewModel = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly summary: string;
  readonly documentCount: number;
  readonly state: "waiting-for-extraction";
  readonly action: { readonly label: string; readonly unavailableReason: string };
};
