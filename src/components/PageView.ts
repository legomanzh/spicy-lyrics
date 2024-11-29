import fetchLyrics from "../functions/fetchLyrics";
import "../css/default.css";
import storage from "../functions/storage";
import "../css/loader2.css"
import { syllableLyrics, lineLyrics, staticLyrics, checkLowQStatus, addLinesEvListener, removeLinesEvListener, scrollToActiveLine, ClearCurrrentContainerScrollData } from "../functions/lyrics";
import ApplyDynamicBackground from "./dynamicBackground";
import Defaults from "./Defaults";
import { Icons } from "./Icons";
/* function firstFetched() {
    return storage.get("")
} */

const Tooltips = {
    Close: null
}

export const PageRoot = document.querySelector<HTMLElement>('.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]');

export default function DisplayLyricsPage() {
    const elem = document.createElement("div");
    elem.id = "SpicyLyricsPage";
    elem.innerHTML = `
        <div class="lyricsParent">
            <div class="loaderContainer">
                <div id="ArcadeLoader"></div>
            </div>
            <div class="lyrics"></div>
            <div class="ViewControls">
                <button id="Close" class="ViewControl">${Icons.Close}</button>
            </div>
        </div>
    `

    PageRoot.appendChild(elem);

    // Let's set up our TippyProps
    {
        const closeButton = elem.querySelector("#Close");

        Tooltips.Close = Spicetify.Tippy(
            closeButton,
            {
                ...Spicetify.TippyProps,
                content: `Close Page`
            }
        )

        closeButton.addEventListener(
            "click",
            () => Spicetify.Platform.History.goBack()
        )
    }

    Defaults.LyricsContainerExists = true;

    ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .lyricsParent"))

    addLinesEvListener();

    {
        if (!Spicetify.Player.data?.item?.uri) return; // Exit if `uri` is not available
        checkLowQStatus();

        const currentUri = Spicetify.Player.data.item.uri;

        fetchLyrics(currentUri).then(lyrics => {
            if (lyrics?.Type === "Syllable") {
                syllableLyrics(lyrics);
            } else if (lyrics?.Type === "Line") {
                lineLyrics(lyrics);
            } else if (lyrics?.Type === "Static") {
                staticLyrics(lyrics);
            }
            storage.set("lastFetchedUri", currentUri);
        });
    }
}

export function DestroyLyricsPage() {
    if (!PageRoot.querySelector("#SpicyLyricsPage")) return
    PageRoot.querySelector("#SpicyLyricsPage")?.remove();
    Defaults.LyricsContainerExists = false;
   // Intervals.LyricsInterval.Stop();
    //Intervals.AnimationFrameInterval.Stop();
    removeLinesEvListener();
    ClearCurrrentContainerScrollData();
    Object.values(Tooltips).forEach(a => a.destroy());
}