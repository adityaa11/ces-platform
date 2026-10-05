import type { NormalizedDocument } from "@atlas/contracts";

export type SourceSlot = { readonly slot: string; readonly text: string; readonly pageNumber: number; readonly locatorId: string };

export function prepareSourceSlots(document: NormalizedDocument): SourceSlot[] {
  const slots = document.pages.flatMap((page) => page.textBlocks.map((block) => ({
    slot: block.id.replace("anm2-", "").toUpperCase(), text: block.text, pageNumber: page.number, locatorId: block.id,
  })));
  if (slots.length !== 4 || slots.map(({ slot }) => slot).join(",") !== "S1,S2,S3,S4") throw new Error("Fixture source slots differ from frozen S1-S4");
  return slots;
}

export function makeUserPayload(slots: readonly SourceSlot[]): string {
  return slots.map(({ slot, text }) => `${slot}:\n${text}`).join("\n\n");
}
