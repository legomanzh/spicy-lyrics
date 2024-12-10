import Defaults from "../../components/Global/Defaults";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../Lyrics/lyrics";
import ScrollIntoCenterView from "../ScrollIntoView/Center";
import SimpleBar from 'simplebar';

let lastLine = null;

export function ScrollToActiveLine(ScrollSimplebar: SimpleBar) {
    if (!SpotifyPlayer.IsPlaying) return;
    if (!Defaults.LyricsContainerExists) return;

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {

        const Lines = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;

        if (!Lines) return;

        for (let i = 0; i < Lines.length; i++) {
            const line = Lines[i];
            if (line.Status === "Active") {
                const currentLine = line;
                Continue(currentLine)
                return; // Exit the loop once a line is found
            }
        }

        function Continue(currentLine) {
            if (currentLine) {
                const LineElem = currentLine.HTMLElement
                const container = ScrollSimplebar?.getScrollElement() as HTMLElement;
                if (!container) return;
                if (lastLine && lastLine === LineElem) return;
                lastLine = LineElem
                ScrollIntoCenterView(container, currentLine.HTMLElement, 200);
            }
        }
    }
}