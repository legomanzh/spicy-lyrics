import storage from "../../utils/storage";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import { Tooltips } from "../Pages/PageView";
import Fullscreen from "./Fullscreen";


function OpenNowBar() {
    const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
    if (!NowBar) return;
    UpdateNowBar(true);
    NowBar.classList.add("Active");
    storage.set("IsNowBarOpen", "true");

    if (Fullscreen.IsOpen) {
        const MediaBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent");
        
        // Let's Apply more data into the fullscreen mode.
        {
            if (MediaBox.querySelector(".AlbumData")) return;
            const AlbumNameElement = document.createElement("div");
            AlbumNameElement.classList.add("AlbumData");
            AlbumNameElement.innerHTML = `<span>${SpotifyPlayer.GetAlbumName()}</span>`;
            MediaBox.insertBefore(AlbumNameElement, MediaBox.firstChild);
        }
    }

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
        Title: SpotifyPlayer.GetSongName(),
        Album: SpotifyPlayer.GetAlbumName()
    }
    NowBar.querySelector<HTMLImageElement>(".Header .MediaBox .MediaImage").src = Song.Artwork;
    NowBar.querySelector<HTMLSpanElement>(".Header .SongName span").textContent = Song.Title;

    if (Fullscreen.IsOpen) {
        const NowBarAlbum = NowBar.querySelector<HTMLElement>(".Header .MediaBox .AlbumData");
        if (NowBarAlbum) {
            NowBarAlbum.querySelector<HTMLSpanElement>("span").textContent = Song.Album;
        }
    }
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