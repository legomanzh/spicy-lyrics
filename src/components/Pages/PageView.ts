import fetchLyrics from "../../utils/Lyrics/fetchLyrics";
import storage from "../../utils/storage";
import "../../css/Loaders/DotLoader.css"
import { addLinesEvListener, removeLinesEvListener } from "../../utils/Lyrics/lyrics";
import ApplyDynamicBackground, { CleanupDynamicBGLets } from "../DynamicBG/dynamicBackground";
import Defaults from "../Global/Defaults";
import { Icons } from "../Styling/Icons";
import { ScrollSimplebar } from "../../utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "../../utils/Lyrics/Global/Applyer";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import { NowBar_SwapSides, NowBarObj, Session_NowBar_SetSide, Session_OpenNowBar, ToggleNowBar } from "../Utils/NowBar";
import Fullscreen, { EnterSpicyLyricsFullscreen, ExitFullscreenElement } from "../Utils/Fullscreen";
import TransferElement from "../Utils/TransferElement";
import Session from "../Global/Session";
import { InitializeScrollEvents, ResetLastLine, CleanupScrollEvents } from "../../utils/Scrolling/ScrollToActiveLine";
import Global from "../Global/Global";
import { EnableCompactMode } from "../Utils/CompactMode";
import { DisableCompactMode } from "../Utils/CompactMode";
import { DestroyAllLyricsContainers } from "../../utils/Lyrics/Applyer/CreateLyricsContainer";

interface TippyInstance {
    destroy: () => void;
    [key: string]: any;
}

export const Tooltips: {
    Close: TippyInstance | null;
    NowBarToggle: TippyInstance | null;
    FullscreenToggle: TippyInstance | null;
    CinemaView: TippyInstance | null;
    NowBarSideToggle: TippyInstance | null;
} = {
    Close: null,
    NowBarToggle: null,
    FullscreenToggle: null,
    CinemaView: null,
    NowBarSideToggle: null
}

const PageView = {
    Open: OpenPage,
    Destroy: DestroyPage,
    AppendViewControls,
    IsOpened: false,
    IsTippyCapable: true
};

export const GetPageRoot = () => (
    document.querySelector<HTMLElement>('.Root__main-view .main-view-container div[data-overlayscrollbars-viewport]') ??
    document.querySelector<HTMLElement>('.Root__main-view .main-view-container .uGZUPBPcDpzSYqKcQT8r > div') ??
    document.querySelector<HTMLElement>('.Root__main-view .main-view-container .os-host')
)

let PageResizeListener: ResizeObserver | null = null;

function OpenPage(AppendTo: HTMLElement | undefined = undefined, HoverMode: boolean = false) {
    if (PageView.IsOpened) return;
    if (!HoverMode) {
        PageView.IsTippyCapable = false;
    }
    const elem = document.createElement("div");
    elem.id = "SpicyLyricsPage";
    if (HoverMode) {
        elem.classList.add("TippyMode");
    }
    elem.innerHTML = `
        <div class="NotificationContainer">
            <div class="NotificationIcon"></div>
            <div class="NotificationText">
                <div class="NotificationTitle"></div>
                <div class="NotificationDescription"></div>
            </div>
            <div class="NotificationCloseButton">X</div>
        </div>
        <div class="ContentBox">
            <div class="NowBar">
                <div class="CenteredView">
                    <div class="Header">
                        <div class="MediaBox">
                            <div class="MediaContent"></div>
                            <div class="MediaImage"></div>
                        </div>
                        <div class="Metadata">
                            <div class="SongName">
                                <span></span>
                            </div>
                            <div class="Artists">
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="LyricsContainer">
                <div class="loaderContainer">
                    <div id="DotLoader"></div>
                </div>
                <div class="LyricsContent ScrollbarScrollable"></div>
            </div>
            <div class="ViewControls"></div>
        </div>
    `

    const SkipSpicyFont = storage.get("skip-spicy-font");
    if (SkipSpicyFont != "true") {
        elem.classList.add("UseSpicyFont");
    }

    if (AppendTo !== undefined) {
        AppendTo?.appendChild(elem);
    } else {
        GetPageRoot()?.appendChild(elem);
    }


    const contentBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox");
    if (contentBox) {
        ApplyDynamicBackground(contentBox);
    }

    addLinesEvListener();

    {
        if (!Spicetify.Player.data?.item?.uri) return; // Exit if `uri` is not available
        const currentUri = Spicetify.Player.data.item.uri;

        fetchLyrics(currentUri).then(ApplyLyrics);
    }

    !HoverMode ? Session_OpenNowBar() : null

    /* const ArtworkButton = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .Artwork");

    ArtworkButton.addEventListener("click", () => {
        NowBar_SwapSides();
    }) */

    Session_NowBar_SetSide();

    !HoverMode ? AppendViewControls() : false

    DisableCompactMode();

    if (!HoverMode) {
        PageResizeListener = new ResizeObserver(() => {
            if (!Fullscreen.IsOpen || !Fullscreen.CinemaViewOpen) return;
            Compactify(elem);
        });
    
        PageResizeListener.observe(elem);
    }

    {
        const legacyPage = document.querySelector<HTMLElement>('.Root__main-view .main-view-container .os-host');
        if (legacyPage) {
            legacyPage.style.containerType = "inline-size";
        }
    }

    Defaults.LyricsContainerExists = true;
    PageView.IsOpened = true;
}

export function Compactify(Element: HTMLElement | undefined = undefined) {
    if (!Fullscreen.IsOpen) return;
    const elem = Element ?? document.querySelector<HTMLElement>("#SpicyLyricsPage");
    if (!elem) return;
    const isNoLyrics = storage.get("currentLyricsData")?.toString() === `NO_LYRICS:${SpotifyPlayer.GetId()}`;
    if (window.matchMedia("(max-width: 70.812rem)").matches) {
        if (isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
            elem.querySelector<HTMLElement>(".ContentBox .LyricsContainer")?.classList.remove("Hidden");
            elem.querySelector<HTMLElement>(".ContentBox")?.classList.remove("LyricsHidden");
        }
        EnableCompactMode();
    } else {
        if (isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
            elem.querySelector<HTMLElement>(".ContentBox .LyricsContainer")?.classList.add("Hidden");
            elem.querySelector<HTMLElement>(".ContentBox")?.classList.add("LyricsHidden");
        }
        DisableCompactMode();
    }
}

function DestroyPage() {
    if (!PageView.IsOpened) return;
    if (Fullscreen.IsOpen) Fullscreen.Close();
    if (!document.querySelector("#SpicyLyricsPage")) return
    CleanupDynamicBGLets();
    ResetLastLine();
    CleanupScrollEvents();
    PageResizeListener?.disconnect(); // Disconnect the observer
    PageView.IsOpened = false;
    Defaults.LyricsContainerExists = false;
    DestroyAllLyricsContainers();

    const legacyPage = document.querySelector<HTMLElement>('.Root__main-view .main-view-container .os-host');
    if (legacyPage) {
        legacyPage.style.containerType = "";
    }

    document.querySelector("#SpicyLyricsPage")?.remove();
    removeLinesEvListener();
    Object.values(Tooltips).forEach(a => a?.destroy());
    ScrollSimplebar?.unMount();
    Global.Event.evoke("page:destroy", null);
    PageView.IsTippyCapable = true;
}

export let LyricsApplied = false;

Global.Event.listen("lyrics:not-apply", () => {
    CleanupScrollEvents();
    LyricsApplied = false;
})

Global.Event.listen("lyrics:apply", ({ Type }: { Type: string }) => {
    CleanupScrollEvents();
    if (!Type || Type === "Static") return;
    if (ScrollSimplebar) {
        InitializeScrollEvents(ScrollSimplebar);
        //QueueForceScroll(); // Queue a force scroll instead of directly calling with true
        LyricsApplied = true;
    }
})

function AppendViewControls(ReAppend: boolean = false) {
    const elem = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .ViewControls");
    if (!elem) return;

    // Safely destroy existing tooltips first
    Object.keys(Tooltips).forEach(key => {
        const tippy = Tooltips[key as keyof typeof Tooltips];
        if (tippy?.destroy && typeof tippy.destroy === 'function') {
            tippy.destroy();
            Tooltips[key as keyof typeof Tooltips] = null;
        }
    });

    if (ReAppend) elem.innerHTML = "";
    const isNoLyrics = storage.get("currentLyricsData")?.toString() === `NO_LYRICS:${SpotifyPlayer.GetId()}`;
    elem.innerHTML = `
        ${Fullscreen.IsOpen ? "" : `<button id="CinemaView" class="ViewControl">${Icons.CinemaView}</button>`}
        ${(!Fullscreen.IsOpen && !Fullscreen.CinemaViewOpen) ? `<button id="NowBarToggle" class="ViewControl">${Icons.NowBar}</button>` : ""}
        ${NowBarObj.Open && !(isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) ? `<button id="NowBarSideToggle" class="ViewControl">${Icons.Fullscreen}</button>` : ""}
        ${Fullscreen.IsOpen ? `<button id="FullscreenToggle" class="ViewControl">${Fullscreen.CinemaViewOpen ? Icons.Fullscreen : Icons.CloseFullscreen}</button>` : ""}
        <button id="Close" class="ViewControl">${Icons.Close}</button>
    `

    let targetElem: HTMLElement | null = elem;
    if (Fullscreen.IsOpen) {
        const mediaContent = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent");
        if (mediaContent) {
            TransferElement(elem, mediaContent);
            const viewControls = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaContent .ViewControls");
            if (viewControls) {
                targetElem = viewControls;
            }
        }
    } else {
        const contentBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox");
        if (document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .ViewControls") && contentBox) {
            TransferElement(elem, contentBox);
        }
    }

    if (targetElem) {
        SetupTippy(targetElem);
    }

    function SetupTippy(elem: HTMLElement) {
        // Let's set up our TippyProps
        const closeButton = elem.querySelector("#Close");
        if (closeButton) {
            try {
                Tooltips.Close = Spicetify.Tippy(
                    closeButton,
                    {
                        ...Spicetify.TippyProps,
                        content: `Close Page`
                    }
                );
                closeButton.addEventListener("click", () => {
                    if (Fullscreen.IsOpen) {
                        // If in any fullscreen mode, close it first
                        Fullscreen.Close();
                    }
                    // Then go back
                    Session.GoBack();
                });
            } catch (err) {
                console.warn("Failed to setup Close tooltip:", err);
            }
        }

        if (!Fullscreen.IsOpen && !Fullscreen.CinemaViewOpen) {
            const nowBarButton = elem.querySelector("#NowBarToggle");
            if (nowBarButton) {
                try {
                    Tooltips.NowBarToggle = Spicetify.Tippy(
                        nowBarButton,
                        {
                            ...Spicetify.TippyProps,
                            content: `NowBar`
                        }
                    );
                    nowBarButton.addEventListener("click", () => ToggleNowBar());
                } catch (err) {
                    console.warn("Failed to setup NowBar tooltip:", err);
                }
            }
        }

        const fullscreenBtn = elem.querySelector("#FullscreenToggle");
        if (fullscreenBtn) {
            try {
                Tooltips.FullscreenToggle = Spicetify.Tippy(
                    fullscreenBtn,
                    {
                        ...Spicetify.TippyProps,
                        content: `${Fullscreen.CinemaViewOpen ? "Fullscreen" : "Cinema View"}`
                    }
                );
                fullscreenBtn.addEventListener("click", async () => {
                    // If we're in cinema view, go to full fullscreen
                    if (Fullscreen.CinemaViewOpen) {
                        Fullscreen.CinemaViewOpen = false;
                        await EnterSpicyLyricsFullscreen();
                        PageView.AppendViewControls(true);
                    } else {
                        Fullscreen.CinemaViewOpen = true;
                        await ExitFullscreenElement();
                        PageView.AppendViewControls(true);
                    }
                    setTimeout(Compactify, 250)
                });
            } catch (err) {
                console.warn("Failed to setup Fullscreen tooltip:", err);
            }
        }

        const cinemaViewBtn = elem.querySelector("#CinemaView");
        if (cinemaViewBtn && !Fullscreen.IsOpen) {
            try {
                Tooltips.CinemaView = Spicetify.Tippy(
                    cinemaViewBtn,
                    {
                        ...Spicetify.TippyProps,
                        content: `Cinema View`
                    }
                );
                cinemaViewBtn.addEventListener("click", () => Fullscreen.Open(true));
            } catch (err) {
                console.warn("Failed to setup CinemaView tooltip:", err);
            }
        }

        const nowBarSideToggleBtn = elem.querySelector("#NowBarSideToggle");
        if (nowBarSideToggleBtn && NowBarObj.Open && !(isNoLyrics && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen))) {
            try {
                Tooltips.NowBarSideToggle = Spicetify.Tippy(
                    nowBarSideToggleBtn,
                    {
                        ...Spicetify.TippyProps,
                        content: `Swap NowBar Side`
                    }
                );
                nowBarSideToggleBtn.addEventListener("click", () => NowBar_SwapSides());
            } catch (err) {
                console.warn("Failed to setup NowBarSideToggle tooltip:", err);
            }
        }
    }
}

interface SpicyLyricsNotificationReturnObject {
    cleanup: Function;
    close: Function;
    open: Function;
};

const showTopbarNotifications = storage.get("show_topbar_notifications") === "true";

export function SpicyLyrics_Notification({
    icon,
    metadata: {
        title,
        description
    },
    type,
    closeBtn
}: {
    icon: string;
    metadata: {
        title: string;
        description: string;
    };
    type?: "Danger" | "Information" | "Success" | "Warning";
    closeBtn?: boolean;
}): SpicyLyricsNotificationReturnObject {
    const nonFunctionalReturnObject = {
        cleanup: () => {},
        close: () => {},
        open: () => {}
    }
    if (!showTopbarNotifications) return nonFunctionalReturnObject;
    if (!PageView.IsOpened) return nonFunctionalReturnObject;
    const NotificationContainer = document.querySelector("#SpicyLyricsPage .NotificationContainer");
    if (!NotificationContainer) return nonFunctionalReturnObject;
    const Title = NotificationContainer.querySelector(".NotificationText .NotificationTitle");
    const Description = NotificationContainer.querySelector(".NotificationText .NotificationDescription");
    const Icon = NotificationContainer.querySelector(".NotificationIcon");
    const CloseButton = NotificationContainer.querySelector(".NotificationCloseButton");

    if (Title && title) {
        Title.textContent = title;
    }
    if (Description && description) {
        Description.textContent = description;
    }
    if (Icon && icon) {
        Icon.innerHTML = icon;
    }

    const closeBtnHandler = () => {
        NotificationContainer.classList.remove("Visible")
        if (Title) {
            Title.textContent = "";
        }
        if (Description) {
            Description.textContent = "";
        }
        if (Icon) {
            Icon.innerHTML = "";
        }
        if (CloseButton) {
            CloseButton.classList.remove("Disabled");
        }
    }

    NotificationContainer.classList.add(type ?? "Information")

    const closeBtnA = closeBtn ?? true;

    if (CloseButton) {
        if (!closeBtnA) {
            CloseButton.classList.add("Disabled");
        } else {
            CloseButton.addEventListener("click", closeBtnHandler)
        }
    }

    return {
        cleanup: () => {
            if (closeBtnA && CloseButton) {
                CloseButton.removeEventListener("click", closeBtnHandler);
            }
            NotificationContainer.classList.remove("Visible")
            NotificationContainer.classList.remove(type ?? "Information")
            if (Title) {
                Title.textContent = "";
            }
            if (Description) {
                Description.textContent = "";
            }
            if (Icon) {
                Icon.innerHTML = "";
            }
            if (CloseButton) {
                CloseButton.classList.remove("Disabled");
            }
        },
        close: () => {
            NotificationContainer.classList.remove("Visible")
        },
        open: () => {
            NotificationContainer.classList.add("Visible")
        }
    }
}

/* function SocketStatusChange(status: boolean) {
    if (!PageView.IsOpened) return;
    if (!document.querySelector("#SpicyLyricsPage")) return;
    const notif = SpicyLyrics_Notification({
        icon: Icons.LyricsPage,
        metadata: {
            title: "Connection Error",
            description: "We're recconecting you back to Spicy Lyrics. Be patient."
        },
        type: "Warning",
        closeBtn: false
    })
    if (status) {
        notif.close();
        notif.cleanup();
    } else {
        notif.open();
    }
}

SocketStatusChange(isWsConnected); */

export default PageView;