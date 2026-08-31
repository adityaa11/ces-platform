"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectFixture, ProjectWorkspaceFixture } from "@atlas/fixtures";
import { safaraSourceDocuments, type SafaraSourceDocument } from "../generated/safaraDocuments";
import { AppShell } from "./AppShell";
import type { WorkspaceLens } from "./WorkspaceLens";

type User = { name: string; email: string; role: "owner" | "editor" | "viewer" };
type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

const fileTitle = (fileName: string) => fileName.replace(/\.pdf$/i, "").replace(/^Safara_Incremental_/, "").replace(/[_-]+/g, " ").replace(/\bprd\b/i, "PRD");
const documentIncrement = (fileName: string) => {
  const match = fileName.match(/PRD[_-]?(\d+)/i);
  return match ? `PRD ${Number(match[1])}` : "PDF";
};
const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

function sourceTitle(document: SafaraSourceDocument, workspace: ProjectWorkspaceFixture) {
  const prd = workspace.prds.find((item) => item.increment === documentIncrement(document.fileName));
  return prd?.name ?? fileTitle(document.fileName);
}

export function SourcesWorkspace({ user, projects, workspace, scenario, initialLens }: { user: User; projects: ProjectFixture[]; workspace: ProjectWorkspaceFixture; scenario?: string; initialLens: WorkspaceLens }) {
  const documents = safaraSourceDocuments;
  const initialDocument = documents.find((document) => documentIncrement(document.fileName) === "PRD 2") ?? documents[0];
  const [selected, setSelected] = useState(initialDocument);
  const [pageNumber, setPageNumber] = useState(initialDocument && documentIncrement(initialDocument.fileName) === "PRD 2" ? 2 : 1);
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [renderedZoom, setRenderedZoom] = useState(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [renderState, setRenderState] = useState<"loading" | "ready" | "error">("loading");
  const [pageInput, setPageInput] = useState(String(pageNumber));
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const canvasRegion = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) => `${documentIncrement(document.fileName)} ${sourceTitle(document, workspace)} ${document.fileName}`.toLowerCase().includes(query));
  }, [documents, search, workspace]);

  useEffect(() => {
    const element = canvasRegion.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setCanvasWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!viewerOpen) return;
    const updateWidth = () => setCanvasWidth(canvasRegion.current?.getBoundingClientRect().width ?? 0);
    const frame = window.requestAnimationFrame(updateWidth);
    const timeout = window.setTimeout(updateWidth, 240);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [viewerOpen]);
  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === viewer.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => void } | undefined;
    let renderTask: { cancel: () => void } | undefined;
    const render = async () => {
      if (!selected || !canvas.current || !canvasWidth) return;
      setRenderState("loading");
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs") as PdfJsModule;
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("/pdfjs/pdf.worker.mjs", window.location.origin).href;
        loadingTask = pdfjs.getDocument({ url: selected.url, useWasm: false });
        const pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const effectiveZoom = fitWidth ? Math.min(1.35, Math.max(0.5, (canvasWidth - 96) / baseViewport.width)) : zoom;
        const viewport = page.getViewport({ scale: effectiveZoom });
        const element = canvas.current;
        const context = element.getContext("2d", { alpha: false });
        if (!context || cancelled) return;
        element.width = Math.floor(viewport.width);
        element.height = Math.floor(viewport.height);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) {
          setRenderedZoom(effectiveZoom);
          setRenderState("ready");
        }
      } catch (error) {
        if (!cancelled && !(error instanceof Error && /cancel/i.test(error.name))) {
          setRenderState("error");
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      loadingTask?.destroy();
    };
  }, [canvasWidth, fitWidth, pageNumber, selected, zoom]);

  if (!selected) return null;
  const title = sourceTitle(selected, workspace);
  const setCurrentPage = (requested: number) => {
    const bounded = Math.min(Math.max(requested, 1), selected.pageCount);
    setPageNumber(bounded);
    setPageInput(String(bounded));
  };
  const commitPage = () => {
    const requested = Number.parseInt(pageInput, 10);
    setCurrentPage(Number.isFinite(requested) ? requested : pageNumber);
  };
  const changeDocument = (document: SafaraSourceDocument) => {
    setSelected(document);
    const initialPage = documentIncrement(document.fileName) === "PRD 2" ? Math.min(2, document.pageCount) : 1;
    setPageNumber(initialPage);
    setPageInput(String(initialPage));
    setFitWidth(true);
    setViewerOpen(true);
  };
  const stepZoom = (amount: number) => {
    setFitWidth(false);
    setZoom(Math.min(2, Math.max(0.5, Number((renderedZoom + amount).toFixed(2)))));
  };
  const enterFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void viewer.current?.requestFullscreen();
  };

  return <AppShell active="sources" contentClassName="sources-content" fullWidthSearch projectNavigation projects={projects} routeContext={{ scenario, prd: initialLens.selectedPrdIds.length ? initialLens.selectedPrdIds.join(",") : undefined, lens: initialLens.mode === "isolate" ? "isolate" : undefined }} selectedProjectId={workspace.project.id} sidebarCollapsible={false} user={user} workspace={workspace}>
    <div className={`sources-page ${viewerOpen ? "mobile-viewer-open" : ""} ${libraryCollapsed ? "source-library-collapsed" : ""}`}>
      <aside aria-label="Source documents" className="source-library">
        <header className="source-library-header">
          <div className="source-library-title">
            <button aria-expanded={!libraryCollapsed} aria-label={libraryCollapsed ? "Expand Sources library" : "Collapse Sources library"} className="source-library-toggle" onClick={() => setLibraryCollapsed((collapsed) => !collapsed)} type="button"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect height="18" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="3" /><path d="M9 3v18" stroke="currentColor" strokeWidth="1.7" /><path d={libraryCollapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg></button>
            <div><span className="eyebrow">Workspace library</span><h1>Sources</h1></div>
            <b>{visibleDocuments.length} PDF{visibleDocuments.length === 1 ? "" : "s"}</b>
          </div>
          <label className="source-search"><svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="1.8" /><path d="m15.2 15.2 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg><input aria-label="Search PDFs" onChange={(event) => setSearch(event.target.value)} placeholder="Search PDFs..." type="search" value={search} /></label>
        </header>
        <div className="source-list"><section className="source-group"><p className="source-group-title">{workspace.project.name}</p>{visibleDocuments.map((document) => <button aria-pressed={selected.fileName === document.fileName} className={`source-row ${selected.fileName === document.fileName ? "is-active" : ""}`} key={document.fileName} onClick={() => changeDocument(document)} type="button"><span aria-hidden="true" className="source-file-icon">PDF</span><span className="source-row-copy"><span>{documentIncrement(document.fileName)}</span><strong>{sourceTitle(document, workspace)}</strong><small>{formatDate(document.lastModified)} · {document.pageCount} pages</small></span></button>)}{!visibleDocuments.length && <p className="no-results">No PDFs match your search.</p>}</section></div>
      </aside>
      <section aria-label="PDF viewer" className="viewer" ref={viewer}>
        <header className="viewer-doc-header"><div className="viewer-doc-copy"><button className="mobile-source-back" onClick={() => setViewerOpen(false)} type="button">← Sources</button><p className="eyebrow">{documentIncrement(selected.fileName)}</p><h2>{title}</h2><p>{workspace.project.name} · {formatDate(selected.lastModified)} · {selected.pageCount} pages</p></div><a className="open-external" href={selected.url} rel="noreferrer" target="_blank">↗ Open original</a></header>
        <div aria-label="PDF controls" className="viewer-toolbar" role="toolbar"><div className="tool-group"><button aria-label="Previous page" className="icon-tool" disabled={pageNumber === 1} onClick={() => setCurrentPage(pageNumber - 1)} type="button">‹</button><span className="page-counter"><input aria-label="Current page" inputMode="numeric" onBlur={commitPage} onChange={(event) => setPageInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") commitPage(); }} value={pageInput} /><span>/ {selected.pageCount}</span></span><button aria-label="Next page" className="icon-tool" disabled={pageNumber === selected.pageCount} onClick={() => setCurrentPage(pageNumber + 1)} type="button">›</button></div><div className="tool-group"><button aria-label="Zoom out" className="icon-tool" onClick={() => stepZoom(-0.1)} type="button">−</button><span className="zoom-label">{Math.round(renderedZoom * 100)}%</span><button aria-label="Zoom in" className="icon-tool" onClick={() => stepZoom(0.1)} type="button">+</button></div><div className="tool-group"><button className={`text-tool ${fitWidth ? "is-active" : ""}`} onClick={() => setFitWidth(true)} type="button">Fit width</button><button className={`text-tool ${!fitWidth && Math.abs(zoom - 1) < 0.01 ? "is-active" : ""}`} onClick={() => { setFitWidth(false); setZoom(1); }} type="button">100%</button></div><span className="tool-spacer" /><div className="tool-group"><button aria-label={isFullscreen ? "Exit fullscreen viewer" : "Fullscreen viewer"} className="icon-tool" onClick={enterFullscreen} type="button">⤢</button></div></div>
        <div className="viewer-canvas" ref={canvasRegion}>{renderState === "loading" && <p className="viewer-status" role="status">Rendering PDF…</p>}{renderState === "error" && <p className="viewer-status viewer-error" role="alert">Unable to render this PDF.</p>}<canvas aria-label={`Page ${pageNumber} of ${title}`} className={renderState === "ready" ? "pdf-page" : "pdf-page is-loading"} ref={canvas} /></div>
      </section>
    </div>
  </AppShell>;
}
