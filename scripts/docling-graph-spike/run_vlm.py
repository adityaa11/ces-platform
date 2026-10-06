"""Local-only Docling Graph VLM runner for DOCGRAPH-001.

This runner never configures an LLM client or provider endpoint.  It renders
the already-authorized semantic source into a disposable PDF transport and
uses Docling Graph's installed VLM backend with NuExtract-2.0-2B only.
"""
import argparse
import hashlib
import json
import os
import time
from pathlib import Path

import docling
import docling_graph
import torch
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.document_extractor import DocumentExtractor, ExtractionFormatOption
from docling_graph.core.extractors.backends.vlm_backend import VlmBackend
from huggingface_hub import snapshot_download
from docling.pipeline.extraction_vlm_pipeline import ExtractionVlmPipeline

MODEL = "numind/NuExtract-2.0-2B"

# Docling 2.132 compiles NuExtract unconditionally on Python < 3.14.  On this
# CPU-only spike host that turns a bounded smoke into a multi-minute compiler
# workload before any model token is produced.  Preserve the installed model
# and backend, but make compilation an explicit opt-in for the experiment.
if os.environ.get("DOCGRAPH_ENABLE_TORCH_COMPILE") != "1":
    torch.compile = lambda model, *args, **kwargs: model


class LocalCacheVlmBackend(VlmBackend):
    """Docling Graph VLM backend with an explicit, verified local artifacts path."""

    def __init__(self, model_name: str, artifacts_path: str) -> None:
        self.artifacts_path = artifacts_path
        super().__init__(model_name)

    def _initialize_extractor(self) -> None:
        pipeline_options = ExtractionVlmPipeline.get_default_options()
        pipeline_options.artifacts_path = Path(self.artifacts_path)
        pipeline_options.vlm_options.repo_id = self.model_name
        pipeline_options.vlm_options.max_new_tokens = 128
        custom_format_options = {
            InputFormat.PDF: ExtractionFormatOption(pipeline_cls=ExtractionVlmPipeline, backend=PyPdfiumDocumentBackend, pipeline_options=pipeline_options),
            InputFormat.IMAGE: ExtractionFormatOption(pipeline_cls=ExtractionVlmPipeline, backend=PyPdfiumDocumentBackend, pipeline_options=pipeline_options),
        }
        self.doc_extractor = DocumentExtractor(allowed_formats=[InputFormat.IMAGE, InputFormat.PDF], extraction_format_options=custom_format_options)


def pdf_escape(value: str) -> str:
    return value.encode("latin-1", "replace").decode("latin-1").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def write_transport_pdf(text: str, destination: Path) -> None:
    """Write a minimal, deterministic ASCII-safe PDF transport without a new dependency."""
    lines = []
    for raw in text.splitlines():
        raw = raw.strip()
        if not raw:
            continue
        while len(raw) > 100:
            split = raw.rfind(" ", 0, 100)
            split = split if split > 20 else 100
            lines.append(raw[:split])
            raw = raw[split:].lstrip()
        lines.append(raw)
    pages = [lines[i:i + 45] for i in range(0, len(lines), 45)] or [["empty"]]
    objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [" + " ".join(f"{3 + i * 2} 0 R" for i in range(len(pages))) + f"] /Count {len(pages)} >>"]
    for index, page in enumerate(pages):
        page_object = 3 + index * 2
        content_object = page_object + 1
        stream = "BT /F1 9 Tf 45 800 Td 11 TL " + " ".join(f"({pdf_escape(line)}) Tj T*" for line in page) + " ET"
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 {3 + len(pages) * 2} 0 R >> >> /Contents {content_object} 0 R >>")
        objects.append(f"<< /Length {len(stream.encode('latin-1'))} >>\nstream\n{stream}\nendstream")
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    payload = "%PDF-1.4\n"
    offsets = [0]
    for index, object_body in enumerate(objects, 1):
        offsets.append(len(payload.encode("latin-1")))
        payload += f"{index} 0 obj\n{object_body}\nendobj\n"
    xref = len(payload.encode("latin-1"))
    payload += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n" + "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    payload += f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(payload.encode("latin-1"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="serialized semantic-source JSON")
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--require-cuda",
        action="store_true",
        help="fail before model loading unless this local run can use CUDA",
    )
    args = parser.parse_args()
    if args.require_cuda and not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA was required for this DOCGRAPH-001 run, but this Python "
            "environment has no CUDA-capable Torch runtime. CPU fallback is forbidden."
        )
    source = json.loads(Path(args.source).read_text(encoding="utf-8"))
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    transport = output / "vlm-transport.pdf"
    write_transport_pdf(source["source"], transport)
    # Import after environment inspection so a run artifact always states exactly what ran.
    from templates.atlas_extraction import AtlasExtractionProposal
    started = time.monotonic()
    # The installed Docling pipeline accepts an artifacts path. Resolve the
    # frozen model from the verified standard HF cache, while preserving its
    # actual repository ID for the Docling Graph backend and evidence.
    model_path = snapshot_download(MODEL, local_files_only=True)
    backend = LocalCacheVlmBackend(MODEL, model_path)
    initialized = time.monotonic()
    models = backend.extract_from_document(str(transport), AtlasExtractionProposal)
    completed = time.monotonic()
    proposal = {"candidates": [], "source_dispositions": [], "questions": []}
    for model in models:
        value = model.model_dump(mode="json")
        proposal["candidates"].extend(value.get("candidates", []))
        proposal["source_dispositions"].extend(value.get("source_dispositions", []))
        proposal["questions"].extend(value.get("questions", []))
    result = {
        "model": MODEL,
        "model_cache_path": str(model_path),
        "provider": "docling-graph-vlm-local",
        "external_inference_calls": "none",
        "docling": docling.__version__,
        "docling_graph": docling_graph.__version__,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "transport_sha256": hashlib.sha256(transport.read_bytes()).hexdigest(),
        "raw_models_sha256": hashlib.sha256(json.dumps([m.model_dump(mode="json") for m in models], sort_keys=True).encode()).hexdigest(),
        "proposal_sha256": hashlib.sha256(json.dumps(proposal, sort_keys=True).encode()).hexdigest(),
        "model_load_seconds": initialized - started,
        "inference_seconds": completed - initialized,
        "total_seconds": completed - started,
        "page_models": len(models),
        "proposal": proposal,
    }
    (output / "proposal.json").write_text(json.dumps(proposal, indent=2) + "\n", encoding="utf-8")
    (output / "metrics.json").write_text(json.dumps({k: v for k, v in result.items() if k != "proposal"}, indent=2) + "\n", encoding="utf-8")
    backend.cleanup()
    print(json.dumps({k: v for k, v in result.items() if k not in {"proposal"}}))


if __name__ == "__main__":
    main()
