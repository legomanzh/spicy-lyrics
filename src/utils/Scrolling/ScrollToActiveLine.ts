import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../Lyrics/lyrics";
import ScrollIntoCenterView from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';

let lastLine = null;
let isUserScrolling = false;
let lastUserScrollTime = 0;
let lastPosition = null;
const USER_SCROLL_COOLDOWN = 750; // 0.75 second cooldown
const POSITION_THRESHOLD = 150; // 20ms threshold for start/end detection
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
        lyricsContentObserver.observe(lyricsContent);
    }
}

function handleUserScroll(ScrollSimplebar: SimpleBar) {
    if (!isUserScrolling) {
        isUserScrolling = true;
        // Add HideLineBlur class when user starts scrolling
        const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
        if (lyricsContent) {
            lyricsContent.classList.add("HideLineBlur");
        }
    }
    lastUserScrollTime = performance.now();
}

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    if (!Defaults.LyricsContainerExists) return;

    // Setup the observer when lyrics container exists
    setupLyricsContentObserver();

    // Add scroll event listener
    const scrollElement = ScrollSimplebar?.getScrollElement();
    if (scrollElement) {
        scrollElement.addEventListener('wheel', () => handleUserScroll(ScrollSimplebar));
        scrollElement.addEventListener('touchmove', () => handleUserScroll(ScrollSimplebar));
    }

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;
        const Position = SpotifyPlayer.GetTrackPosition();
        const PositionOffset = 250;
        const ProcessedPosition = Position + PositionOffset;
        const TrackDuration = SpotifyPlayer.GetTrackDuration();
        const didLastLineExist = lastLine !== null;

        // Check if position changed while paused
        if (!SpotifyPlayer.IsPlaying && lastPosition !== null && lastPosition !== Position) {
            ResetLastLine();
        }
        lastPosition = Position;

        if (!Lines) return;

        // Check if all lines are sung
        const allLinesSung = Lines.every(line => line.Status === "Sung");

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
                    ScrollIntoCenterView(container, lastLineElement, 0, -50, true);
                }
                return;
            }
        }

        // Handle start of track
        if (Position <= POSITION_THRESHOLD) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                container.scrollTop = 0;
                return;
            }
        }

        // Handle end of track
        if (ProcessedPosition >= TrackDuration - POSITION_THRESHOLD) {
            const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
            if (container) {
                container.scrollTop = container.scrollHeight;
                return;
            }
        }

        for (let i = 0; i < Lines.length; i++) {
            const line = Lines[i];
            if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
                const currentLine = line;
                Continue(currentLine)
                return;
            }
        }

        function Continue(currentLine) {
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

                // If this is the first line (no previous line), force scroll without checks
                if (!didLastLineExist) {
                    isUserScrolling = false;
                    lastLine = LineElem;
                    ScrollIntoCenterView(container, LineElem, 0, -50, true);
                    return;
                }

                // Only auto-scroll if BOTH conditions are met:
                // 1. User hasn't scrolled in the last second (cooldown passed)
                // 2. AND the active line is in viewport
                if (timeSinceLastScroll > USER_SCROLL_COOLDOWN && isLineInViewport) {
                    isUserScrolling = false;
                    // Remove HideLineBlur class when auto-scroll resumes
                    const lyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent");
                    if (lyricsContent) {
                        lyricsContent.classList.remove("HideLineBlur");
                    }
                    if (isUserScrolling || !isSameLine) {
                        lastLine = LineElem;
                        ScrollIntoCenterView(container, LineElem, 0, -50);
                    }
                }
            }
        }
    }
}

export function ResetLastLine() {
    lastLine = null;
    isUserScrolling = false;
    lastUserScrollTime = 0;
    lastPosition = null;
}