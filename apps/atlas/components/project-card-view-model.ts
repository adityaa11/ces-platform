/** Browser-safe, persisted-data projection for a production project card. */
export type ProjectCardLifecycleState = "waiting-for-extraction" | "extracting" | "needs-attention" | "ready-for-review";

export type ProjectCardViewModel = {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly summary: string;
  readonly documentCount: number;
  readonly state: ProjectCardLifecycleState;
  /** Required browser-safe semantic signal; source records stay server-side. */
  readonly hasSemanticUncertainty: boolean;
  /** Present only for the bounded technical-failure projection. */
  readonly attentionReason?: "Processing needs attention.";
  readonly master: { readonly label: "No published work" };
  readonly initialDraft: { readonly processedLabel: string; readonly progressPercent: number };
  readonly metrics: { readonly publishedFacts: 0; readonly uploadedPrds: number };
  readonly action: { readonly label: string; readonly unavailableReason: string };
};
