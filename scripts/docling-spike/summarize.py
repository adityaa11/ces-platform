#!/usr/bin/env python3
"""Summarize local-only spike artifacts without copying raw source content into Git."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

HEADINGS = [
    "Paket dan Jadwal Keberangkatan", "Data Jemaah", "Pendaftaran Jemaah",
    "Tagihan dan Pembayaran", "Dokumen Jemaah", "Status Perjalanan dan Kesiapan",
    "Manifest Keberangkatan", "Dashboard dan Laporan", "Riwayat Aktivitas",
]

def canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))

def load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))

def digest(path: Path) -> str:
    return hashlib.sha256(canonical(load(path)).encode("utf-8")).hexdigest()

def normalized_text(path: Path) -> str:
    value = load(path)
    pages = value["pages"] if isinstance(value, dict) else []
    return "\n".join(block.get("text", "") for page in pages for block in page.get("textBlocks", []))

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    documents = {"safara-full": "Safara Full", "safara-finance": "Finance PRD", "safara-readiness": "Readiness PRD"}
    summary: dict[str, object] = {"documents": {}, "externalInferenceCalls": "none"}
    for key, label in documents.items():
        run = args.root / key / "run-1"
        metrics = load(run / "metrics.json")
        normalized = run / "atlas.normalized-document.json"
        summary["documents"][key] = {"label": label, "metrics": metrics, "normalizedStructuralSha256": digest(normalized)}
    first = args.root / "safara-full" / "run-1"
    second = args.root / "safara-full" / "run-2"
    first_provider, second_provider = digest(first / "docling.provider-result.json"), digest(second / "docling.provider-result.json")
    first_normalized, second_normalized = digest(first / "atlas.normalized-document.json"), digest(second / "atlas.normalized-document.json")
    text = normalized_text(first / "atlas.normalized-document.json")
    normalized = re.sub(r"\s+", " ", text).casefold()
    summary["primaryDeterminism"] = {"providerCanonicalSha256Run1": first_provider, "providerCanonicalSha256Run2": second_provider, "normalizedStructuralSha256Run1": first_normalized, "normalizedStructuralSha256Run2": second_normalized, "identical": first_provider == second_provider and first_normalized == second_normalized}
    summary["primaryHeadings"] = {heading: re.sub(r"\s+", " ", heading).casefold() in normalized for heading in HEADINGS}
    output = args.root / "summary.json"
    output.write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))

if __name__ == "__main__":
    main()
