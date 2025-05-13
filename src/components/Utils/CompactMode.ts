import Fullscreen from "./Fullscreen";
import { Session_NowBar_SetSide } from "./NowBar";

let CompactMode = false;

export const EnableCompactMode = () => {
    if (!Fullscreen.IsOpen) return;
    const SpicyLyricsPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");
    if (!SpicyLyricsPage) return;
    SpicyLyricsPage.classList.add("CompactMode", "NowBarSide__Left");
    SpicyLyricsPage.classList.remove("NowBarSide__Right");
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    NowBar.classList.add("LeftSide");
    NowBar.classList.remove("RightSide");
    CompactMode = true;
}

export const DisableCompactMode = () => {
    const SpicyLyricsPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");
    if (!SpicyLyricsPage) return;
    SpicyLyricsPage.classList.remove("CompactMode");
    Session_NowBar_SetSide();
    CompactMode = false;
}

export const IsCompactMode = () => {
    return CompactMode;
}

export const ToggleCompactMode = () => {
    if (CompactMode) DisableCompactMode();
    else EnableCompactMode();
}
