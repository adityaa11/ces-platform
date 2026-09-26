import { useEffect, useRef } from "react";

const minimumCardWidth = 304;
const maximumCardWidth = 400;
const cardGap = 16;

/** Keeps every Project Library route on the established responsive card-grid contract. */
export function useProjectCardGrid(projectCount: number) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const container = grid.parentElement ?? grid;
    let previousFormula = "";
    let frame = 0;
    const updateGridFormula = () => {
      const availableWidth = grid.clientWidth;
      const candidateColumns = Math.floor((availableWidth + cardGap) / (minimumCardWidth + cardGap));
      const columns = Math.max(1, Math.min(projectCount || 1, candidateColumns));
      const fluidWidth = (availableWidth - cardGap * (columns - 1)) / columns;
      const cardWidth = Math.min(maximumCardWidth, Math.max(0, fluidWidth));
      const formula = `${columns}:${cardWidth}`;
      if (formula === previousFormula) return;
      previousFormula = formula;
      grid.style.setProperty("--project-column-count", String(columns));
      grid.style.setProperty("--project-card-width", `${cardWidth}px`);
    };
    const scheduleFormula = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateGridFormula);
    };
    const observer = new ResizeObserver(scheduleFormula);
    observer.observe(container);
    scheduleFormula();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [projectCount]);

  return gridRef;
}
