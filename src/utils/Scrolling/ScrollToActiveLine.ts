import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../Lyrics/lyrics";
import ScrollIntoCenterView from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';
import { IsInViewport } from "./IsInViewport";

let lastLine: HTMLElement | null = null;
let isAutoScrolling = false;
let isUserScrolling = false;
let scrollTimeout: NodeJS.Timeout | null = null;

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    /* if (!SpotifyPlayer.IsPlaying) return; */
    if (!Defaults.LyricsContainerExists) return;

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;
        const Position = SpotifyPlayer.GetTrackPosition();
        const PositionOffset = 400;
        const ProcessedPosition = Position + PositionOffset;
        const container = ScrollSimplebar?.getScrollElement() as HTMLElement;

        if (!Lines || !container) return;

        // Find current active line
        for (let i = 0; i < Lines.length; i++) {
            const line = Lines[i];
            if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
                const currentLine = line;
                handleLineScroll(currentLine, container);
                return;
            }
        }
    }
}

function handleLineScroll(currentLine: any, container: HTMLElement) {
    if (!currentLine) return;
    
    const LineElem = currentLine.HTMLElement as HTMLElement;
    if (!LineElem || (lastLine && lastLine === LineElem)) return;

    // Check if user is scrolling and if the active line is in viewport
    if (isUserScrolling) {
        const isLineInView = IsInViewport(LineElem, container);
        if (!isLineInView) return; // Don't scroll if user is scrolling and line is not in view
    }

    lastLine = LineElem;
    setTimeout(() => LineElem.classList.add("Active", "OverridenByScroller"), 200);

    // Set auto-scrolling flag before scrolling
    isAutoScrolling = true;
    ScrollIntoCenterView(container, LineElem, 300, -50);
    
    // Reset auto-scrolling flag after animation completes
    setTimeout(() => {
        isAutoScrolling = false;
    }, 350); // 300ms animation + 50ms buffer
}

export function OnUserScroll() {
    // Ignore scroll events triggered by auto-scrolling
    if (isAutoScrolling) return;

    const lyricsContent = document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer .LyricsContent");
    lyricsContent?.classList.add("HideLineBlur");
    
    isUserScrolling = true;
    
    // Clear existing timeout
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }

    // Reset the isUserScrolling flag after 1 second of no scrolling
    scrollTimeout = setTimeout(() => {
        if (!isAutoScrolling && isUserScrolling) {  // Only remove class if we're not auto-scrolling
            isUserScrolling = false;
            const lyricsContent = document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer .LyricsContent");
            lyricsContent?.classList.remove("HideLineBlur");
        }
    }, 3000);
}

export function ResetLastLine() {
    lastLine = null;
    isUserScrolling = false;
    isAutoScrolling = false;
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
}
