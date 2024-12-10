import fetchLyrics from "../../utils/Lyrics/fetchLyrics";
import storage from "../../utils/storage";
import "../../css/loader2.css"
import { addLinesEvListener, removeLinesEvListener } from "../../utils/Lyrics/lyrics";
import ApplyDynamicBackground from "../DynamicBG/dynamicBackground";
import Defaults from "../Global/Defaults";
import { Icons } from "../Styling/Icons";
import { ScrollSimplebar } from "../../utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "../../utils/Lyrics/Global/Applyer";

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
            <div class="lyrics ScrollbarScrollable"></div>
            <div class="ViewControls">
                <button id="Close" class="ViewControl">${Icons.Close}</button>
            </div>
        </div>
    `

    PageRoot.appendChild(elem);

    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";

    if (lowQModeEnabled) {
        elem.querySelector(".lyricsParent .lyrics").classList.add("lowqmode")
    }
    

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
        const currentUri = Spicetify.Player.data.item.uri;

        fetchLyrics(currentUri).then(ApplyLyrics);
    }

    

}

export function DestroyLyricsPage() {
    if (!PageRoot.querySelector("#SpicyLyricsPage")) return
    PageRoot.querySelector("#SpicyLyricsPage")?.remove();
    Defaults.LyricsContainerExists = false;
    removeLinesEvListener();
    Object.values(Tooltips).forEach(a => a.destroy());
    storage.set("currentlyFetching", "false");
    ScrollSimplebar?.unMount();
}