import { GetCurrentLyricsContainerInstance } from "../../utils/Lyrics/Applyer/CreateLyricsContainer";
import storage from "../../utils/storage";
import Defaults from "../Global/Defaults";
import Global from "../Global/Global";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import Fullscreen from "./Fullscreen";
import { Session_NowBar_SetSide } from "./NowBar";

let CompactMode = false;

export const EnableCompactMode = () => {
    if (!Fullscreen.IsOpen) return;
    const SpicyLyricsPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");
    if (!SpicyLyricsPage) return;
    
    const isNoLyrics = storage.get("currentLyricsData")?.toString() === `NO_LYRICS:${SpotifyPlayer.GetId()}`;
    if (isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
        SpicyLyricsPage.querySelector<HTMLElement>(".ContentBox .LyricsContainer")?.classList.remove("Hidden");
        SpicyLyricsPage.querySelector<HTMLElement>(".ContentBox")?.classList.remove("LyricsHidden");
    }

    SpicyLyricsPage.classList.add("CompactMode", "NowBarSide__Left");
    SpicyLyricsPage.classList.remove("NowBarSide__Right");
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    NowBar.classList.add("LeftSide");
    NowBar.classList.remove("RightSide");

    if (Defaults.CompactMode_LockedMediaBox) {
        NowBar.classList.add("LockedMediaBox");
    }

    CompactMode = true;
    GetCurrentLyricsContainerInstance()?.Resize();
    Global.Event.evoke("compact-mode:enable");
}

export const DisableCompactMode = () => {
    const SpicyLyricsPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");
    if (!SpicyLyricsPage) return;

    const isNoLyrics = storage.get("currentLyricsData")?.toString() === `NO_LYRICS:${SpotifyPlayer.GetId()}`;
    if (isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
        SpicyLyricsPage.querySelector<HTMLElement>(".ContentBox .LyricsContainer")?.classList.add("Hidden");
        SpicyLyricsPage.querySelector<HTMLElement>(".ContentBox")?.classList.add("LyricsHidden");
    }


    SpicyLyricsPage.classList.remove("CompactMode");
    Session_NowBar_SetSide();
    CompactMode = false;
    GetCurrentLyricsContainerInstance()?.Resize();
    
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (NowBar) NowBar.classList.add("LockedMediaBox");
    
    Global.Event.evoke("compact-mode:disable");
}

export const IsCompactMode = () => {
    return CompactMode;
}

export const ToggleCompactMode = () => {
    if (CompactMode) DisableCompactMode();
    else EnableCompactMode();
}
