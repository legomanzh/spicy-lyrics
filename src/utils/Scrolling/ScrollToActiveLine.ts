import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../Lyrics/lyrics";
import ScrollIntoCenterView from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';

let lastLine = null;

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    if (!Defaults.LyricsContainerExists) return;

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {

        const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;
        const Position = SpotifyPlayer.GetTrackPosition();
        const PositionOffset = 100;
        const ProcessedPosition = Position + PositionOffset;

        if (!Lines) return;

        for (let i = 0; i < Lines.length; i++) {
            const line = Lines[i];
            /* if (line.Status === "Active") {
                const currentLine = line;
                Continue(currentLine)
                return; // Exit the loop once a line is found
            } */
            if (line.StartTime <= ProcessedPosition && line.EndTime >= ProcessedPosition) {
                const currentLine = line;
                Continue(currentLine)
                return; // Exit the loop once a line is found
            }
        }

        function Continue(currentLine) {
            if (currentLine) {
                const LineElem = currentLine.HTMLElement as HTMLElement;
                const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
                if (!container) return;
                if (lastLine && lastLine === LineElem) return;
                const didLastLineExist = lastLine !== null;
                lastLine = LineElem
                setTimeout(() => LineElem.classList.add("Active", "OverridenByScroller"), PositionOffset / 2);
                if (didLastLineExist) {
                    ScrollIntoCenterView(container, LineElem, 0, -50); // Scroll Into View with a 0ms Animation
                } else {
                    ScrollIntoCenterView(container, LineElem, 0, -50, true); // Scroll Into View with a 0ms Animation
                }
            }
        }
    }
}

export function ResetLastLine() {
    lastLine = null;
}