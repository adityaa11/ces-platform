/** Browser-safe, persisted-data projection for a production project card. */
export type ProjectCardViewModel = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly summary: string;
  readonly documentCount: number;
  readonly state: "waiting-for-extraction";
  readonly master: { readonly label: "No published work" };
  readonly initialDraft: { readonly processedLabel: string; readonly progressPercent: 0 };
  readonly metrics: { readonly publishedFacts: 0; readonly uploadedPrds: number };
  readonly action: { readonly label: string; readonly unavailableReason: string };
};
