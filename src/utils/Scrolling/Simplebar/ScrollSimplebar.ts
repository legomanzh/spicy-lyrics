import SimpleBar from "npm:simplebar";
import { IntervalManager } from "../../IntervalManager.ts";
import {
  IsMouseInLyricsPage,
  LyricsPageMouseEnter,
  LyricsPageMouseLeave,
  SetIsMouseInLyricsPage,
} from "../Page/IsHovering.ts";

export let ScrollSimplebar: any | null = null;

const ElementEventQuery = "#SpicyLyricsPage .ContentBox .LyricsContainer";

export function MountScrollSimplebar() {
  const LyricsContainer = document.querySelector<HTMLElement>(
    "#SpicyLyricsPage .LyricsContainer .LyricsContent"
  );

  if (!LyricsContainer) {
    console.warn("Cannot mount ScrollSimplebar: LyricsContainer not found");
    return;
  }

  // @ts-expect-error abc
  ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });

  document
    .querySelector<HTMLElement>(ElementEventQuery)
    ?.addEventListener("mouseenter", LyricsPageMouseEnter);
  document
    .querySelector<HTMLElement>(ElementEventQuery)
    ?.addEventListener("mouseleave", LyricsPageMouseLeave);
}

export function ClearScrollSimplebar() {
  ScrollSimplebar?.unMount();
  ScrollSimplebar = null;
  SetIsMouseInLyricsPage(false);
  document
    .querySelector<HTMLElement>(ElementEventQuery)
    ?.removeEventListener("mouseenter", LyricsPageMouseEnter);
  document
    .querySelector<HTMLElement>(ElementEventQuery)
    ?.removeEventListener("mouseleave", LyricsPageMouseLeave);
}

export function RecalculateScrollSimplebar() {
  ScrollSimplebar?.recalculate();
}

new IntervalManager(Infinity, () => {
  const LyricsContainer = document.querySelector<HTMLElement>(
    "#SpicyLyricsPage .LyricsContainer .LyricsContent"
  );
  if (!LyricsContainer || !ScrollSimplebar) return;
  if (IsMouseInLyricsPage) {
    LyricsContainer.classList.remove("hide-scrollbar");
  } else {
    if (ScrollSimplebar.isDragging) {
      LyricsContainer.classList.remove("hide-scrollbar");
    } else {
      LyricsContainer.classList.add("hide-scrollbar");
    }
  }
}).Start();
