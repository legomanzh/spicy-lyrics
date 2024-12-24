import { ResetLastLine } from "../../utils/Scrolling/ScrollToActiveLine";
import storage from "../../utils/storage";
import { AppendViewControls, PageRoot, Tooltips } from "../Pages/PageView";
import { DeregisterNowBarBtn, OpenNowBar } from "./NowBar";
import TransferElement from "./TransferElement";

const Fullscreen = {
    Open,
    Close,
    Toggle,
    IsOpen: false
};

function Open() {
    const SpicyPage = document.querySelector<HTMLElement>(".Root__main-view #SpicyLyricsPage");
    const Root = document.body as HTMLElement;

    if (SpicyPage) {
        TransferElement(SpicyPage, Root);
        SpicyPage.classList.add("Fullscreen");
        Fullscreen.IsOpen = true
        AppendViewControls(true);

        Tooltips.NowBarToggle?.destroy();

        const NowBarToggle = document.querySelector<HTMLElement>("#SpicyLyricsPage .ViewControls #NowBarToggle");

        if (NowBarToggle) {
            NowBarToggle.remove();
        }

        OpenNowBar();

        if (!document.fullscreenElement) {
            Root.querySelector("#SpicyLyricsPage").requestFullscreen().catch((err) => {
                alert(
                    `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`,
                );
            });
        } else {
            document.exitFullscreen();
        }

        ResetLastLine();

    }
}

function Close() {
    const SpicyPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");

    if (SpicyPage) {
        TransferElement(SpicyPage, PageRoot);
        SpicyPage.classList.remove("Fullscreen");
        Fullscreen.IsOpen = false
        AppendViewControls(true);
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        const NoLyrics = storage.get("currentLyricsData")?.includes("NO_LYRICS");
        if (NoLyrics) {
            OpenNowBar();
            document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer").classList.add("Hidden");
            DeregisterNowBarBtn();
        }
        ResetLastLine();
    }
}

function Toggle() {
    const SpicyPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");

    if (SpicyPage) {
        if (Fullscreen.IsOpen) {
            Close();
        } else {
            Open();
        }
    }
}

export default Fullscreen;