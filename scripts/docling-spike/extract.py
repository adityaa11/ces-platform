#!/usr/bin/env python3
"""Run the bounded, local-only Docling extraction and provider-shape mapping."""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import re
import sys
import time
from pathlib import Path
from typing import Any

from docling.document_converter import DocumentConverter
from docling.document_converter import PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
import docling


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def plain(value: Any) -> Any:
    """Serialize Pydantic Docling values without retaining implementation objects."""
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return value


def provenance(item: dict[str, Any]) -> dict[str, Any] | None:
    values = item.get("prov") or item.get("provenance") or []
    if not values:
        return None
    first = values[0]
    return first if isinstance(first, dict) else None


def page_number(item: dict[str, Any]) -> int | None:
    prov = provenance(item)
    value = prov.get("page_no") if prov else None
    return value if isinstance(value, int) and value > 0 else None


def bbox(item: dict[str, Any], dimensions: dict[int, tuple[float, float]]) -> dict[str, float] | None:
    prov = provenance(item)
    raw = prov.get("bbox") if prov else None
    page = page_number(item)
    if not isinstance(raw, dict) or page not in dimensions:
        return None
    left, top, right, bottom = (raw.get(key) for key in ("l", "t", "r", "b"))
    if not all(isinstance(v, (int, float)) for v in (left, top, right, bottom)) or right <= left:
        return None
    # Docling's serialized coordinate origin is explicit. Emit only a proven top-left box.
    origin = raw.get("coord_origin")
    width, height = dimensions[page]
    if origin == "BOTTOMLEFT":
        top = height - raw["t"]
        bottom = height - raw["b"]
    elif origin != "TOPLEFT":
        return None
    if left < 0 or top < 0 or right > width or bottom > height or bottom <= top:
        return None
    return {"x": float(left), "y": float(top), "width": float(right - left), "height": float(bottom - top)}


def text_kind(item: dict[str, Any]) -> str | None:
    label = item.get("label")
    if not isinstance(label, str):
        return None
    allowed = {"title", "section_header", "paragraph", "list_item", "code", "formula", "caption", "footnote"}
    return label if label in allowed else None


def stable_id(prefix: str, page: int, position: int, content: str) -> str:
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]
    return f"docling-p{page}-{prefix}-{position:04d}-{digest}"


def table_markdown(document: Any, table: Any, dumped: dict[str, Any]) -> str:
    try:
        return table.export_to_markdown(doc=document)
    except Exception:
        data = dumped.get("data")
        return json.dumps(data, ensure_ascii=False, sort_keys=True) if data is not None else ""


def map_provider(document: Any) -> tuple[dict[str, Any], dict[str, Any]]:
    raw_pages = {int(number): plain(page) for number, page in document.pages.items()}
    dimensions: dict[int, tuple[float, float]] = {}
    pages: list[dict[str, Any]] = []
    for number, raw in sorted(raw_pages.items()):
        size = raw.get("size") if isinstance(raw, dict) else None
        width = size.get("width") if isinstance(size, dict) else None
        height = size.get("height") if isinstance(size, dict) else None
        page: dict[str, Any] = {"page_number": number, "blocks": [], "tables": [], "images": []}
        if isinstance(width, (int, float)) and isinstance(height, (int, float)) and width > 0 and height > 0:
            dimensions[number] = (float(width), float(height))
            page["dimensions"] = {"width": float(width), "height": float(height)}
        pages.append(page)
    by_number = {page["page_number"]: page for page in pages}
    block_positions: dict[int, int] = {number: 0 for number in by_number}
    for item_object in document.texts:
        item = plain(item_object)
        if not isinstance(item, dict):
            continue
        page = page_number(item)
        text = item.get("text")
        if page not in by_number or not isinstance(text, str) or not text.strip():
            continue
        block_positions[page] += 1
        mapped: dict[str, Any] = {"id": stable_id("text", page, block_positions[page], text), "text": text}
        kind = text_kind(item)
        if kind:
            mapped["type"] = kind
        item_bbox = bbox(item, dimensions)
        if item_bbox:
            mapped["bbox"] = item_bbox
        by_number[page]["blocks"].append(mapped)
    table_positions: dict[int, int] = {number: 0 for number in by_number}
    for table_object in document.tables:
        item = plain(table_object)
        if not isinstance(item, dict):
            continue
        page = page_number(item)
        if page not in by_number:
            continue
        content = table_markdown(document, table_object, item)
        if not content.strip():
            continue
        table_positions[page] += 1
        mapped = {"id": stable_id("table", page, table_positions[page], content), "markdown": content}
        item_bbox = bbox(item, dimensions)
        if item_bbox:
            mapped["bbox"] = item_bbox
        by_number[page]["tables"].append(mapped)
    # Picture regions remain intentionally absent from the Atlas-facing mapper.
    # The normal Docling PDF pipeline represented them, but one region's geometry
    # varied across equivalent runs. Visual regions are optional in v1; emitting
    # a volatile box would violate the spike's determinism rule, while omission
    # makes no claim about a source-backed visual asset we do not preserve.
    diagnostic = {
        "pageCount": len(pages), "textItemCount": sum(len(page["blocks"]) for page in pages),
        "tableCount": sum(len(page["tables"]) for page in pages), "pictureCount": len(document.pictures), "mappedVisualRegionCount": 0,
        "headerLikeCount": sum(1 for page in pages for block in page["blocks"] if block.get("type") in {"title", "section_header"}),
        "provenanceTextCount": sum(1 for value in document.texts if provenance(plain(value)) is not None),
        "geometryTextCount": sum(1 for page in pages for block in page["blocks"] if "bbox" in block),
        "normalizedCharacterCount": len(re.sub(r"\s+", " ", " ".join(block["text"] for page in pages for block in page["blocks"])).strip()),
    }
    return {"pages": pages}, diagnostic


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--ocr", action="store_true", help="Enable Docling's local OCR backend; baseline digital PDFs keep it off.")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    started = time.perf_counter()
    # `process_time` is a portable, process-scoped CPU observation.  It does
    # not claim wall-clock CPU utilization or machine-wide resource use.
    cpu_started = time.process_time()
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = args.ocr
    converter = DocumentConverter(format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)})
    result = converter.convert(str(args.input))
    document = result.document
    elapsed_ms = round((time.perf_counter() - started) * 1000, 3)
    process_cpu_ms = round((time.process_time() - cpu_started) * 1000, 3)
    raw = plain(document)
    provider, metrics = map_provider(document)
    write_json(args.output / "docling.raw.json", raw)
    write_json(args.output / "docling.provider-result.json", provider)
    try:
        (args.output / "docling.md").write_text(document.export_to_markdown(), encoding="utf-8")
    except Exception as error:
        (args.output / "docling-markdown-error.txt").write_text(str(error), encoding="utf-8")
    metrics.update({"terminalExtractionStatus": "success", "latencyMs": elapsed_ms, "processCpuTimeMs": process_cpu_ms, "resourceMeasurement": {"method": "Python time.process_time() around converter.convert(...)", "scope": "current Docling extraction process", "limitation": "CPU time is not wall-clock utilization, peak memory, or machine-wide usage"}, "pythonVersion": platform.python_version(), "doclingVersion": getattr(docling, "__version__", "unknown"), "pipeline": {"ocr": args.ocr, "mode": "local PDF"}, "visualMapping": "omitted: Docling picture geometry was not stable across equivalent runs", "externalInferenceCalls": "none", "sourceSha256": hashlib.sha256(args.input.read_bytes()).hexdigest()})
    write_json(args.output / "metrics.json", metrics)
    print(json.dumps(metrics, sort_keys=True))


if __name__ == "__main__":
    main()
