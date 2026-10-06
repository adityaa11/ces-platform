"""Local-only Docling Graph LLM runner for DOCGRAPH-002.

This runner deliberately reuses the existing serialized semantic-source input
and Atlas Pydantic proposal schema. It permits only Docling Graph's local
Ollama client and the frozen qwen3:4b model; it never configures a hosted
provider or fills omitted semantic output.
"""
import argparse
import hashlib
import json
import os
import subprocess
import time
from pathlib import Path

import docling
import docling_graph
from docling_graph.core.extractors.backends.llm_backend import LlmBackend
from docling_graph.llm_clients import get_client
from docling_graph.llm_clients.config import LlmRuntimeOverrides, resolve_effective_model_config

MODEL = "qwen3:4b"
PROVIDER = "ollama"
LOCAL_OLLAMA_URL = "http://127.0.0.1:11434"


def run(command: list[str]) -> str:
    return subprocess.run(command, check=True, capture_output=True, text=True).stdout.strip()


def ollama_ps(executable: str) -> str:
    return run([executable, "ps"])


def gpu_snapshot() -> str:
    return run([
        "nvidia-smi",
        "--query-compute-apps=pid,process_name,used_memory",
        "--format=csv,noheader",
    ])


def require_gpu_runtime(ps: str, gpu: str) -> None:
    if MODEL not in ps or "100% GPU" not in ps or "llama-server.exe" not in gpu.lower():
        raise RuntimeError(
            "DOCGRAPH-002 requires demonstrable RTX 4050 Ollama inference; "
            f"ollama ps={ps!r}; nvidia-smi={gpu!r}. CPU-only fallback is forbidden."
        )


def safe_diagnostics(value: object) -> dict:
    if not isinstance(value, dict):
        return {}
    permitted = {
        "provider",
        "model",
        "structured_attempted",
        "structured_failed",
        "fallback_used",
        "fallback_error_class",
        "truncated",
        "finish_reason",
    }
    return {key: value[key] for key in permitted if key in value}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="existing serialized semantic-source JSON")
    parser.add_argument("--output", required=True)
    parser.add_argument("--ollama-executable", required=True)
    args = parser.parse_args()

    source_path = Path(args.source)
    source = json.loads(source_path.read_text(encoding="utf-8"))
    if source.get("source_unit_count") != len(source.get("units", [])):
        raise RuntimeError("Serialized source-unit count is internally inconsistent.")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    # Override the provider endpoint explicitly so the process cannot select a
    # user-configured remote endpoint. The supported client transport keeps any
    # Qwen reasoning metadata separate from its JSON response content.
    os.environ["OLLAMA_BASE_URL"] = LOCAL_OLLAMA_URL
    overrides = LlmRuntimeOverrides.model_validate({
        "connection": {"base_url": LOCAL_OLLAMA_URL},
        "generation": {"temperature": 0.0, "max_tokens": 8192},
        "reliability": {"timeout_s": 300, "max_retries": 0},
    })
    effective = resolve_effective_model_config(PROVIDER, MODEL, overrides)
    client = get_client(PROVIDER)(model_config=effective)
    backend = LlmBackend(llm_client=client, extraction_contract="direct", structured_output=True)

    from templates.atlas_extraction import AtlasExtractionProposal

    started = time.monotonic()
    model = backend.extract_from_markdown(
        markdown=source["source"],
        template=AtlasExtractionProposal,
        context="DOCGRAPH-002 controlled 11-source-unit semantic fixture",
    )
    completed = time.monotonic()
    ps = ollama_ps(args.ollama_executable)
    gpu = gpu_snapshot()
    require_gpu_runtime(ps, gpu)
    if model is None:
        raise RuntimeError("Docling Graph LLM returned no Pydantic proposal.")

    proposal = model.model_dump(mode="json")
    metrics = {
        "model": MODEL,
        "provider": "docling-graph-llm-local-ollama",
        "ollama_base_url": LOCAL_OLLAMA_URL,
        "external_inference_calls": "none",
        "docling": docling.__version__,
        "docling_graph": docling_graph.__version__,
        "configuration": {
            "backend": "llm",
            "inference": "local",
            "provider_override": PROVIDER,
            "model_override": MODEL,
            "structured_output": True,
        },
        "source_sha256": source.get("source_sha256"),
        "source_unit_count": source.get("source_unit_count"),
        "proposal_sha256": hashlib.sha256(json.dumps(proposal, sort_keys=True).encode()).hexdigest(),
        "inference_seconds": completed - started,
        "ollama_ps": ps,
        "nvidia_compute_apps": gpu,
        "llm_diagnostics": safe_diagnostics(getattr(backend, "last_call_diagnostics", {})),
    }
    (output / "proposal.json").write_text(json.dumps(proposal, indent=2) + "\n", encoding="utf-8")
    (output / "metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    backend.cleanup()
    print(json.dumps({key: metrics[key] for key in ("model", "provider", "source_unit_count", "inference_seconds", "ollama_ps", "llm_diagnostics")}))


if __name__ == "__main__":
    main()
