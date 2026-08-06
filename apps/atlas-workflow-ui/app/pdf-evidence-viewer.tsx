"use client";
import { useEffect, useRef, useState } from "react";
import { moveEvidence, regionsForEvidence, selectEvidence,
  type BrowserEvidence } from "../lib/evidence-browser";

export function PdfEvidenceViewer({ evidence, documentUrl }: {
  evidence: BrowserEvidence[]; documentUrl: (item: BrowserEvidence) => string;
}) {
  const [activeId, setActiveId] = useState<string>();
  const [zoom, setZoom] = useState(1); const [error, setError] = useState<string>();
  const canvas = useRef<HTMLCanvasElement>(null); const active = selectEvidence(evidence, activeId);
  useEffect(() => { setActiveId(evidence[0]?.evidence_id); }, [evidence]);
  useEffect(() => {
    if (!active || !canvas.current) return;
    let cancelled = false; let task: { destroy(): Promise<void> } | undefined;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const response = await fetch(documentUrl(active), { credentials: "same-origin" });
        if (!response.ok) throw new Error("The cited PDF is unavailable");
        const loading = pdfjs.getDocument({ data: await response.arrayBuffer() }); task = loading;
        const page = await (await loading.promise).getPage(active.location.page_number);
        const viewport = page.getViewport({ scale: zoom });
        if (cancelled || !canvas.current) return;
        const context = canvas.current.getContext("2d"); if (!context) return;
        canvas.current.width = viewport.width; canvas.current.height = viewport.height;
        await page.render({ canvas: canvas.current, canvasContext: context, viewport }).promise;
        if (!cancelled) setError(undefined);
      } catch (caught) { if (!cancelled) setError(caught instanceof Error
        ? caught.message : "The cited PDF is unavailable"); }
    })();
    return () => { cancelled = true; void task?.destroy(); };
  }, [active?.evidence_id, active?.location.page_number, documentUrl, zoom]);
  if (!active) return <p className="notice">Select knowledge to view its cited PDF evidence.</p>;
  const regions = regionsForEvidence(active);
  return <><div className="pdf-toolbar"><button aria-label="Previous evidence" onClick={() =>
    setActiveId(moveEvidence(evidence, activeId, -1)?.evidence_id)}>Previous</button>
    <span>Page {active.location.page_number}</span><button aria-label="Next evidence" onClick={() =>
      setActiveId(moveEvidence(evidence, activeId, 1)?.evidence_id)}>Next</button>
    <button aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.5, value - .25))}>−</button>
    <output aria-label="PDF zoom">{Math.round(zoom * 100)}%</output>
    <button aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(3, value + .25))}>+</button></div>
    <div className="pdf-frame"><div className="pdf-page"><canvas ref={canvas}
      aria-label={`PDF page ${active.location.page_number}`} />{regions.map((box, index) =>
      <button key={index} aria-label={`Evidence region ${index + 1}`} className="pdf-highlight"
        onClick={() => setActiveId(active.evidence_id)} style={{ left: `${box.x * 100}%`,
          top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%` }} />)}</div></div>
    {error && <p className="notice">{error}</p>}
    {!regions.length && <p className="notice">Page is available; precise highlighting is unavailable for this evidence.</p>}
    <div className="evidence-cards">{evidence.map((item) => <button key={item.evidence_id}
      className={item.evidence_id === active.evidence_id ? "active" : ""}
      onClick={() => setActiveId(item.evidence_id)}><strong>Page {item.location.page_number}</strong>
      <blockquote>{item.exact_text}</blockquote><small>{item.language} · {item.extraction_method}
        {item.extraction_method === "ocr" ? " OCR" : ""} · confidence {item.extraction_confidence.toFixed(2)}
        {item.review_status ? ` · ${item.review_status}` : ""}</small></button>)}</div></>;
}
