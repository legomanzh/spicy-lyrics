import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsApplied } from "../../components/Pages/PageView";
import { LyricsObject, LyricsType, LyricsSyllable, LyricsLine } from "../Lyrics/lyrics";
import { ScrollIntoCenterViewCSS } from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';

// Define proper types for variables
let lastLine: HTMLElement | null = null;
let isUserScrolling = false;
let lastUserScrollTime = 0;
let lastPosition: number | null = null;
const USER_SCROLL_COOLDOWN = 750; // 0.75 second cooldown
const POSITION_THRESHOLD = 250; // 250ms threshold for start/end detection

// Force scroll queue mechanism
let forceScrollQueued = false;

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

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    if (!Defaults.LyricsContainerExists) return;
    if (!LyricsApplied) return;

    // Check if a force scroll was queued
    let isForceScrollQueued = forceScrollQueued;
    if (forceScrollQueued) {
        forceScrollQueued = false; // Reset the queue after using it
    }

    // Setup logic moved to InitializeScrollEvents

    //if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        const currentType = Defaults.CurrentLyricsType as LyricsType;
        const Lines = LyricsObject.Types[currentType]?.Lines;
        const Position = SpotifyPlayer.GetPosition();
        const shouldForceScroll = (isForceScrollQueued || lastLine !== null);
        const PositionOffset = 0;
        const ProcessedPosition = Position + PositionOffset;
        const TrackDuration = SpotifyPlayer.GetDuration();

        // Check if position changed while paused
        if (!SpotifyPlayer.IsPlaying && lastPosition !== null && lastPosition !== Position) {
            ResetLastLine();
        }
        lastPosition = Position;

        if (!Lines) return;

        // --- NEW: Check conditions to scroll to top ---
        const allLinesNotSung = Lines.every((line: any) => line.Status === "NotSung");
        const activeLines = Lines.filter((line: any) => line.Status === "Active");
        const sungLines = Lines.filter((line: any) => line.Status === "Sung");
        const oneActiveNoSung = activeLines.length === 1 && sungLines.length === 0;

        if (allLinesNotSung || oneActiveNoSung) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                const timeSinceLastScroll = performance.now() - lastUserScrollTime;
                // Only auto-scroll if user hasn't scrolled recently
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN) {
                    isUserScrolling = false;
                    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                    if (lyricsContent) {
                        lyricsContent.classList.remove("HideLineBlur");
                    }
                    // Use smooth scrolling to top
                    container.scrollTop = 0;
                }
                return; // Exit early after handling scroll to top
            }
        }
        // --- END NEW ---

        // Check if all lines are sung
        const allLinesSung = Lines.every((line: any) => line.Status === "Sung");

        if (allLinesSung) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                const timeSinceLastScroll = performance.now() - lastUserScrollTime;

                // Only auto-scroll if user hasn't scrolled recently
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN) {
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
            }
        }

        // Handle start of track
        if (Position <= POSITION_THRESHOLD) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                // Use smooth scrolling to top
                container.scrollTop = 0;
                return;
            }
        }

        // Handle end of track
        if (ProcessedPosition >= TrackDuration - POSITION_THRESHOLD) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                // Use smooth scrolling to bottom
                container.scrollTop = container.scrollHeight;
                return;
            }
        }

        for (let i = 0; i < Lines.length; i++) {
            const line = Lines[i];
            // Check if line has StartTime and EndTime properties (not Static type)
            if ('StartTime' in line && 'EndTime' in line) {
                if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
                    const currentLine = line;
                    Continue(currentLine);
                    return;
                }
            }
        }

        function Continue(currentLine: LyricsSyllable | LyricsLine) {
            if (currentLine) {
                const LineElem = currentLine.HTMLElement as HTMLElement;
                const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
                if (!container) return;

                const timeSinceLastScroll = performance.now() - lastUserScrollTime;

                // Check if the line is in viewport
                const lineRect = LineElem.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const isLineInViewport = lineRect.top >= containerRect.top && lineRect.bottom <= containerRect.bottom;

                const isSameLine = lastLine === LineElem;

                // If force scroll was queued, scroll regardless of other conditions
                if (isForceScrollQueued) {
                    isUserScrolling = false;
                    lastLine = LineElem;
                    ScrollIntoCenterViewCSS(container, LineElem, -50, true);
                    return;
                }

                // If this is the first line (no previous line), force scroll without checks
                if (!shouldForceScroll) {
                    isUserScrolling = false;
                    lastLine = LineElem;
                    ScrollIntoCenterViewCSS(container, LineElem, -50, true);
                    return;
                }

                // Only auto-scroll if BOTH conditions are met:
                // 1. User hasn't scrolled in the last second (cooldown passed)
                // 2. AND the active line is in viewport
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN && isLineInViewport) {
                    // --- REVISED LOGIC for resuming auto-scroll ---
                    const wasUserScrolling = isUserScrolling; // Capture state before changing
                    isUserScrolling = false;
                    // Remove HideLineBlur class ONLY if we were user scrolling
                    if (wasUserScrolling) {
                        const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                        if (lyricsContent) {
                            lyricsContent.classList.remove("HideLineBlur");
                        } else {
                             console.warn("SpicyLyrics: Could not find .LyricsContent in ScrollToActiveLine to remove HideLineBlur.");
                        }
                    }
                    // Scroll if the line is different from the last auto-scrolled line
                    if (!isSameLine) {
                        lastLine = LineElem;
                        ScrollIntoCenterViewCSS(container, LineElem, -50);
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

export function ResetLastLine() {
    lastLine = null;
    isUserScrolling = false;
    lastUserScrollTime = 0;
    lastPosition = null;
    forceScrollQueued = false;
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
    //console.log("SpicyLyrics scroll events cleaned up."); // Optional log
}
// --- END NEW ---