import storage from "../../utils/storage";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import { Tooltips } from "../Pages/PageView";


function OpenNowBar() {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    UpdateNowBar(true);
    NowBar.classList.add("Active");
    storage.set("IsNowBarOpen", "true");
}

function CloseNowBar() {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    NowBar.classList.remove("Active");
    storage.set("IsNowBarOpen", "false");
}

function ToggleNowBar() {
    const IsNowBarOpen = storage.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
        CloseNowBar();
    } else {
        OpenNowBar();
    }
}

function Session_OpenNowBar() {
    const IsNowBarOpen = storage.get("IsNowBarOpen");
    if (IsNowBarOpen === "true") {
        OpenNowBar();
    } else {
        CloseNowBar();
    }
}

function UpdateNowBar(force: boolean = false) {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    const IsNowBarOpen = storage.get("IsNowBarOpen");
    if (IsNowBarOpen == "false" && !force) return;
    const Song = {
        Artwork: SpotifyPlayer.Artwork.Get("xl"),
        Title: SpotifyPlayer.GetSongName()
    }
    NowBar.querySelector<HTMLImageElement>(".Header .Artwork img").src = Song.Artwork;
    NowBar.querySelector<HTMLSpanElement>(".Header .SongName span").textContent = Song.Title;
}

function NowBar_SwapSides() {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    const CurrentSide = storage.get("NowBarSide");
    if (CurrentSide === "left") {
        storage.set("NowBarSide", "right");
        NowBar.classList.remove("LeftSide");
        NowBar.classList.add("RightSide");
    } else if (CurrentSide === "right") {
        storage.set("NowBarSide", "left");
        NowBar.classList.remove("RightSide");
        NowBar.classList.add("LeftSide");
    } else {
        storage.set("NowBarSide", "right");
        NowBar.classList.remove("LeftSide");
        NowBar.classList.add("RightSide");
    }
}


function Session_NowBar_SetSide() {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    const CurrentSide = storage.get("NowBarSide");
    if (CurrentSide === "left") {
        storage.set("NowBarSide", "left");
        NowBar.classList.remove("RightSide");
        NowBar.classList.add("LeftSide");
    } else if (CurrentSide === "right") {
        storage.set("NowBarSide", "right");
        NowBar.classList.remove("LeftSide");
        NowBar.classList.add("RightSide");
    } else {
        storage.set("NowBarSide", "left");
        NowBar.classList.remove("RightSide");
        NowBar.classList.add("LeftSide");
    }
}


function DeregisterNowBarBtn() {
    Tooltips.NowBarToggle?.destroy();
    Tooltips.NowBarToggle = null;
    const nowBarButton = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .ViewControls #NowBarToggle");
    nowBarButton?.remove();
}

export {
    OpenNowBar,
    CloseNowBar,
    ToggleNowBar,
    UpdateNowBar,
    Session_OpenNowBar,
    NowBar_SwapSides,
    Session_NowBar_SetSide,
    DeregisterNowBarBtn
}