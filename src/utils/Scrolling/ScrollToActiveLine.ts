import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsApplied } from "../../components/Pages/PageView";
import { LyricsObject, LyricsType, LyricsSyllable, LyricsLine } from "../Lyrics/lyrics";
import { ScrollIntoCenterViewCSS } from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';

// Define intersection types that include _LineIndex
type LyricsLineWithIndex = LyricsLine & { _LineIndex: number };
type LyricsSyllableWithIndex = LyricsSyllable & { _LineIndex: number };
type EnhancedLyricsItem = LyricsLineWithIndex | LyricsSyllableWithIndex;

// Define proper types for variables
let lastLine: HTMLElement | null = null;
let isUserScrolling = false;
let lastUserScrollTime = 0;
let lastPosition: number | null = null;
const USER_SCROLL_COOLDOWN = 750; // 0.75 second cooldown
const POSITION_THRESHOLD = 500; // 500ms threshold for start/end detection

// Force scroll queue mechanism
let forceScrollQueued = false;
let smoothForceScrollQueued = false;

// --- NEW: Module variables for cleanup ---
let currentSimpleBarInstance: SimpleBar | null = null;
let wheelHandler: (() => void) | null = null;
let touchMoveHandler: (() => void) | null = null;
// --- END NEW ---

// Add focus event listener to reset state when window is focused
window.addEventListener('focus', ResetLastLine);
// Add resize event listener to reset state when window is resized
window.addEventListener('resize', ResetLastLine);

// Create ResizeObserver to monitor LyricsContent container dimensions
const lyricsContentObserver = new ResizeObserver(() => {
    ResetLastLine();
});

// Function to setup the observer
function setupLyricsContentObserver() {
    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (lyricsContent) {
        // Ensure we don't observe multiple times if called again
        lyricsContentObserver.disconnect();
        lyricsContentObserver.observe(lyricsContent);
    }
}

function handleUserScroll(ScrollSimplebar: SimpleBar | null) { // Allow null
    if (!ScrollSimplebar) return; // Add null check
    if (!isUserScrolling) {
        isUserScrolling = true;
        // Add HideLineBlur class when user starts scrolling
        const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
        if (lyricsContent) {
            lyricsContent.classList.add("HideLineBlur");
        } else {
            // --- NEW: Add warning if element not found ---
            console.warn("SpicyLyrics: Could not find .LyricsContent in handleUserScroll to add HideLineBlur.");
            // --- END NEW ---
        }
    }
    lastUserScrollTime = performance.now();
}

// Initialization function for scroll events and observers
export function InitializeScrollEvents(ScrollSimplebar: SimpleBar) {
    if (!Defaults.LyricsContainerExists) return;
    // --- NEW: Store instance and define handlers ---
    currentSimpleBarInstance = ScrollSimplebar;
    wheelHandler = () => handleUserScroll(currentSimpleBarInstance);
    touchMoveHandler = () => handleUserScroll(currentSimpleBarInstance);
    // --- END NEW ---

    // Setup the observer
    setupLyricsContentObserver();

    // Add scroll event listener
    const scrollElement = ScrollSimplebar?.getScrollElement();
    if (scrollElement && wheelHandler && touchMoveHandler) { // Check handlers exist
        // Remove potential old listeners first (optional, but safer if called multiple times)
        scrollElement.removeEventListener('wheel', wheelHandler);
        scrollElement.removeEventListener('touchmove', touchMoveHandler);
        // Add new listeners
        scrollElement.addEventListener('wheel', wheelHandler);
        scrollElement.addEventListener('touchmove', touchMoveHandler);
    }
}


const GetScrollLine = (Lines:  LyricsLine[] | LyricsSyllable[], ProcessedPosition: number) => {
  if (Defaults.CurrentLyricsType === "Static" || Defaults.CurrentLyricsType === "None" || !Lines) return
  // 1) gather all active lines
  const activeLines = Lines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line }) =>
      typeof line.StartTime === 'number'
      && typeof line.EndTime   === 'number'
      && line.StartTime <= ProcessedPosition
      && line.EndTime   >= ProcessedPosition
    )
    .map(({ line, idx }) => ({ ...line, _LineIndex: idx } as EnhancedLyricsItem)); // Cast here

  // 3) if zero or one, just return it (or undefined if none)
  if (activeLines.length <= 1) {
    return activeLines[0] || null;
  }

  // more than one → check the span between first and last
  const firstIdx = activeLines[0]._LineIndex;
  const lastIdx  = activeLines[activeLines.length - 1]._LineIndex;

  // 1) contiguous or off by only 1 → pick the first
  if (lastIdx - firstIdx <= 1) {
    return activeLines[0];
  }

  // 2) "gap" bigger than 1 → pick the last
  return activeLines[activeLines.length - 1];
};

let scrolledToLastLine = false;
let scrolledToFirstLine = false;

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    if (Defaults.CurrentLyricsType === "Static" || Defaults.CurrentLyricsType === "None") return;
    if (!Defaults.LyricsContainerExists) return;

    const currentType = Defaults.CurrentLyricsType as LyricsType;
    const Lines = LyricsObject.Types[currentType]?.Lines as LyricsLine[] | LyricsSyllable[];
    if (!Lines) return;

    // Check if a force scroll was queued
    let isForceScrollQueued = forceScrollQueued;
    let isSmoothForceScrollQueued = smoothForceScrollQueued;

    //if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        const Position = SpotifyPlayer.GetPosition();
        const PositionOffset = 0;
        const ProcessedPosition = Position + PositionOffset;
        const currentLine = GetScrollLine(Lines, ProcessedPosition) as EnhancedLyricsItem | null;


        const allLinesNotSung = Lines.every((line: any) => line.Status === "NotSung");
        const activeLines = Lines.filter((line: any) => line.Status === "Active");
        const sungLines = Lines.filter((line: any) => line.Status === "Sung");
        const oneActiveNoSung = activeLines.length === 1 && sungLines.length === 0;
        const allLinesSung = Lines.every((line: any) => line.Status === "Sung");
        const shouldForceScroll = (isForceScrollQueued || lastLine == null);

        if (((shouldForceScroll) || (!SpotifyPlayer.IsPlaying && lastPosition !== Position))) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (!container) return;
            isUserScrolling = false;
            const scrollToLine = allLinesSung ? Lines[Lines.length - 1]?.HTMLElement : currentLine?.HTMLElement;
            if (!scrollToLine) return
            lastLine = scrollToLine;
            ScrollIntoCenterViewCSS(container, scrollToLine, -50, true);
            if (forceScrollQueued) {
                forceScrollQueued = false; // Reset the queue after using it
            }
            lastPosition = Position;
            return;
        }

        lastPosition = Position;

        if ((isSmoothForceScrollQueued)) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (!container) return;
            isUserScrolling = false;
            const scrollToLine = allLinesSung ? Lines[Lines.length - 1]?.HTMLElement : currentLine?.HTMLElement;
            if (!scrollToLine) return
            lastLine = scrollToLine;
            ScrollIntoCenterViewCSS(container, scrollToLine, -50, false);
            if (smoothForceScrollQueued) {
                smoothForceScrollQueued = false; // Reset the queue after using it
            }
            return;
        }


        if (!Lines) return;

        // --- NEW: Check conditions to scroll to top ---
        

        if (allLinesNotSung || oneActiveNoSung) {
           /*  const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                const timeSinceLastScroll = performance.now() - lastUserScrollTime;
                // Only auto-scroll if user hasn't scrolled recently
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN && !isUserScrolling) {
                    isUserScrolling = false;
                    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                    if (lyricsContent) {
                        lyricsContent.classList.remove("HideLineBlur");
                    }
                    // Use smooth scrolling to top
                    container.scrollTop = 0;
                }
                return; // Exit early after handling scroll to top
            } */
            if (scrolledToFirstLine) return;
            QueueSmoothForceScroll();
            scrolledToFirstLine = true;
        }
        // --- END NEW ---

        // Check if all lines are sung

        if (allLinesSung) {
            /* const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                const timeSinceLastScroll = performance.now() - lastUserScrollTime;

                // Only auto-scroll if user hasn't scrolled recently
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN && !isUserScrolling) {
                    isUserScrolling = false;
                    // Remove HideLineBlur class when auto-scroll resumes
                    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                    if (lyricsContent) {
                        lyricsContent.classList.remove("HideLineBlur");
                    }
                    // Get the last line element to scroll to
                    const lastLineElement = Lines[Lines.length - 1].HTMLElement as HTMLElement;
                    ScrollIntoCenterViewCSS(container, lastLineElement, -50, true);
                }
                return;
            } */
            if (scrolledToLastLine) return;
            QueueSmoothForceScroll();
            scrolledToLastLine = true
        }

        // Handle start of track
        //if (Position <= POSITION_THRESHOLD) {
            /* const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                // Use smooth scrolling to top
                container.scrollTop = 0;
                return;
            } */
            /* QueueForceScroll();
        } */

        // Handle end of track
        /* if (ProcessedPosition >= TrackDuration - POSITION_THRESHOLD) {
            /* const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                // Use smooth scrolling to bottom
                container.scrollTop = container.scrollHeight;
                return;
            } 
            QueueForceScroll();
        } */

       Continue(currentLine);

       function Continue(currentLine: EnhancedLyricsItem | null) {
            if (currentLine) {
                const LineElem = currentLine?.HTMLElement as HTMLElement;
                if (!LineElem) return;
                const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
                if (!container) return;

                const timeSinceLastScroll = performance.now() - lastUserScrollTime;

                // Check if the line is in viewport
                const lineRect = LineElem.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const isLineInViewport = lineRect.top >= containerRect.top && lineRect.bottom <= containerRect.bottom;

                const isSameLine = lastLine === LineElem;


                // If this is the first line (no previous line), force scroll without checks
                /* if (!shouldForceScroll) {
                    isUserScrolling = false;
                    lastLine = LineElem;
                    ScrollIntoCenterViewCSS(container, LineElem, -50, true);
                    return;
                } */

                // Only auto-scroll if BOTH conditions are met:
                // 1. User hasn't scrolled in the last second (cooldown passed)
                // 2. AND the active line is in viewport
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN && isLineInViewport) {
                    // --- REVISED LOGIC for resuming auto-scroll ---
                    //const wasUserScrolling = isUserScrolling; // Capture state before changing
                    isUserScrolling = false;
                    // Remove HideLineBlur class ONLY if we were user scrolling
                    //if (wasUserScrolling) {
                        const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                        if (lyricsContent) {
                            lyricsContent.classList.remove("HideLineBlur");
                        } else {
                             console.warn("SpicyLyrics: Could not find .LyricsContent in ScrollToActiveLine to remove HideLineBlur.");
                        }
                    //}
                    // Scroll if the line is different from the last auto-scrolled line
                    if (!isSameLine) {
                        lastLine = LineElem;
                        const Scroll = () => {
                            ScrollIntoCenterViewCSS(container, LineElem, -50);
                            scrolledToLastLine = false;
                            scrolledToFirstLine = false;
                        }
                        if (Lines[currentLine._LineIndex - 1] && Lines[currentLine._LineIndex - 1].DotLine === true) {
                            setTimeout(Scroll, 125);
                        } else {
                            Scroll();
                        }
                    }
                    // --- END REVISED LOGIC ---
                }
            }
        }
    //}
}

// Function to queue a force scroll for the next frame
export function QueueForceScroll() {
    forceScrollQueued = true;
}

export function QueueSmoothForceScroll() {
    smoothForceScrollQueued = true;
}

export function ResetLastLine() {
    lastLine = null;
    isUserScrolling = false;
    lastUserScrollTime = 0;
    lastPosition = null;
    forceScrollQueued = false;
    smoothForceScrollQueued = false;
    scrolledToLastLine = false;
    scrolledToFirstLine = false;
    // Also disconnect observer on reset if needed, though setup handles disconnect now
    // lyricsContentObserver.disconnect();
}

// --- NEW: Cleanup Function ---
export function CleanupScrollEvents() {
    // Remove scroll listeners
    const scrollElement = currentSimpleBarInstance?.getScrollElement();
    if (scrollElement) {
        if (wheelHandler) {
            scrollElement.removeEventListener('wheel', wheelHandler);
        }
        if (touchMoveHandler) {
            scrollElement.removeEventListener('touchmove', touchMoveHandler);
        }
    }

    // Disconnect observer
    lyricsContentObserver?.disconnect();

    // Remove window listeners
    window.removeEventListener('focus', ResetLastLine);
    window.removeEventListener('resize', ResetLastLine);

    // Reset module variables
    currentSimpleBarInstance = null;
    wheelHandler = null;
    touchMoveHandler = null;
    forceScrollQueued = false; // Reset force scroll queue
    smoothForceScrollQueued = false;
    scrolledToLastLine = false;
    scrolledToFirstLine = false;
    //console.log("SpicyLyrics scroll events cleaned up."); // Optional log
}
// --- END NEW ---