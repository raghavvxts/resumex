import React, { useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  RenderTask,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export const PDFPreview = ({ url }: { url: string }) => {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(400);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(true);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(100, Math.floor(entry.contentRect.width))),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    setDocument(null);
    setPage(1);
    setError("");
    setRendering(true);
    void import("pdfjs-dist")
      .then((pdfjs) => {
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        task = pdfjs.getDocument({
          url,
          useSystemFonts: true,
          disableWorkerRendering: true,
        });
        return task.promise.then((pdf) => {
          if (active) setDocument(pdf);
        });
      })
      .catch(() => {
        if (active) {
          setError(
            "PDF preview could not be opened. You can still download the file.",
          );
          setRendering(false);
        }
      });
    return () => {
      active = false;
      void task?.destroy().catch(() => {});
    };
  }, [url]);
  useEffect(() => {
    if (!document || !canvas.current) return;
    let active = true;
    let task: RenderTask | undefined;
    setRendering(true);
    setError("");
    void document
      .getPage(page)
      .then((pdfPage) => {
        if (!active || !canvas.current) return;
        const viewport = pdfPage.getViewport({
          scale: (width * zoom) / pdfPage.getViewport({ scale: 1 }).width,
        });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.current.width = Math.floor(viewport.width * ratio);
        canvas.current.height = Math.floor(viewport.height * ratio);
        task = pdfPage.render({
          canvas: canvas.current,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        return task.promise;
      })
      .then(() => {
        if (active) setRendering(false);
      })
      .catch(() => {
        if (active) {
          setError(
            "This PDF page could not be rendered. Download the PDF to view it.",
          );
          setRendering(false);
        }
      });
    return () => {
      active = false;
      task?.cancel();
    };
  }, [document, page, width, zoom]);
  return (
    <div className="space-y-3">
      {document && (
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm">
          <button
            className="btn-secondary px-3 py-2"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous page
          </button>
          <span>
            Page {page} of {document.numPages}
          </span>
          <button
            className="btn-secondary px-3 py-2"
            disabled={page === document.numPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next page
          </button>
        </div>
      )}
      {document && (
        <label className="flex items-center gap-3 text-sm">
          Zoom
          <select
            aria-label="Preview zoom"
            className="glass-input px-3 py-2"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            <option value={1}>Fit width</option>
            <option value={1.5}>150%</option>
            <option value={2}>200%</option>
            <option value={3}>300%</option>
          </select>
        </label>
      )}
      {rendering && (
        <p role="status" className="text-sm text-text-secondary">
          Rendering PDF page…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-amber-200">
          {error}
        </p>
      )}
      <div
        ref={container}
        className="max-h-[50dvh] overflow-auto rounded-lg bg-white"
      >
        <canvas
          ref={canvas}
          role="img"
          aria-label={`PDF preview, page ${page}${document ? ` of ${document.numPages}` : ""}. Download the PDF for its text content.`}
          style={{
            width: Math.floor(width * zoom),
            maxWidth: "none",
            height: "auto",
          }}
          className={error || !document ? "hidden" : "block"}
        />
      </div>
    </div>
  );
};
