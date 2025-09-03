import Whentil, { type CancelableTask } from "@spikerko/tools/Whentil";
import PageView from "../Pages/PageView.ts";
import storage from "../../utils/storage.ts";
import { currentBgInstance as currentPageBgInstance, SetPageBGBlur } from "../DynamicBG/dynamicBackground.ts";
import { Spicetify } from "@spicetify/bundler";

export const getNowPlayingViewPlaybarButton = () => {
    // console.log("[Spicy Lyrics Debug] getNowPlayingViewPlaybarButton");
    return document.querySelector<HTMLElement>('[data-testid="control-button-npv"]');
};
export const getNowPlayingViewContainer = () => {
    // console.log("[Spicy Lyrics Debug] getNowPlayingViewContainer");
    return document.querySelector<HTMLElement>(".Root__right-sidebar aside.NowPlayingView") ??
           document.querySelector<HTMLElement>(`.Root__right-sidebar aside#Desktop_PanelContainer_Id:has(.main-nowPlayingView-coverArtContainer)`);
};
export const getNowPlayingViewParentContainer = () => {
    // console.log("[Spicy Lyrics Debug] getNowPlayingViewParentContainer");
    return document.querySelector<HTMLElement>('.Root__right-sidebar .XOawmCGZcQx4cesyNfVO');
};
const appendOpen = () => {
    // console.log("[Spicy Lyrics Debug] appendOpen");
    document.body.classList.add("SpicySidebarLyrics__Active");
};
const appendClosed = () => {
    // console.log("[Spicy Lyrics Debug] appendClosed");
    document.body.classList.remove("SpicySidebarLyrics__Active");
};

export const getQueuePlaybarButton = () => {
    // console.log("[Spicy Lyrics Debug] getNowPlayingViewPlaybarButton");
    return document.querySelector<HTMLElement>('[data-testid="control-button-queue"]');
};

const getDevicesPlaybarButton = () => {
    // console.log("[Spicy Lyrics Debug] getNowPlayingViewPlaybarButton");
    return document.querySelector<HTMLElement>('[data-restore-focus-key="device_picker"]');
};

export const getQueueContainer = () => {
    return document.querySelector<HTMLElement>(".Root__right-sidebar .XOawmCGZcQx4cesyNfVO:not(:has(.h0XG5HZ9x0lYV7JNwhoA.JHlPg4iOkqbXmXjXwVdo)):has(.jD_TVjbjclUwewP7P9e8)");
}

export let isSpicySidebarMode = false;

/* const playbarButton = new Spicetify.Playbar.Button(
    "Spicy Sidebar Lyrics",
    "lyrics",
    () => {
        // console.log("[Spicy Lyrics Debug] playbarButton clicked", { isSpicySidebarMode });
        if (isSpicySidebarMode) {
            CloseSidebarLyrics();
        } else {
            OpenSidebarLyrics();
        }
    },
    false,
    false
);
 */
export function RegisterSidebarLyrics() {
    // console.log("[Spicy Lyrics Debug] RegisterSidebarLyrics");
    //playbarButton.register();
}

let currentNPVWhentil: CancelableTask | null = null;
let onOpen_wasThingOpen: string | undefined = undefined;

export function OpenSidebarLyrics(wasOpenForceUndefined: boolean = false) {
    onOpen_wasThingOpen = undefined;
    // console.log("[Spicy Lyrics Debug] OpenSidebarLyrics");
    if (isSpicySidebarMode) {
        // console.log("[Spicy Lyrics Debug] already in sidebar mode, returning");
        return;
    }
    const playbarButton = getQueuePlaybarButton();
    if (!playbarButton) {
        console.error("[Spicy Lyrics] Playbar button is missing");
        return;
    }
    const parentContainer = getNowPlayingViewParentContainer();
    if (!parentContainer) {
        console.error("[Spicy Lyrics] Now Playing View parent container is missing");
        return;
    }
    const finalContainer = getQueueContainer();
    {
        if (parentContainer.querySelector<HTMLElement>(':scope > *:not(#SpicyLyricsPage)')) {
            onOpen_wasThingOpen = 
                    wasOpenForceUndefined
                        ? undefined
                    : getNowPlayingViewContainer()
                        ? "npv"
                    : parentContainer.querySelector<HTMLElement>(".vzeIlCPBQJUaqdMZHqHE .vXYSi4u1nPutJ_ZkC6mq .jD_TVjbjclUwewP7P9e8")
                        ? "devices"
                    : finalContainer ? "queue" : undefined;
            
        }
    }
    appendOpen();
    if (!finalContainer) {
        // console.log("[Spicy Lyrics Debug] finalContainer not found, clicking button and waiting");
        playbarButton.click();
        currentNPVWhentil = Whentil.When(
            () => getQueueContainer() && !PageView.IsOpened,
            () => {
                // console.log("[Spicy Lyrics Debug] finalContainer appeared after click");
                PageView.Open(parentContainer, true);
                Whentil.When(() => currentPageBgInstance, () => {
                    SetPageBGBlur(100);
                })
                currentNPVWhentil?.Cancel();
                currentNPVWhentil = null;
                SetRSBListeners()
            },
        );
    } else {
        // console.log("[Spicy Lyrics Debug] finalContainer found, opening page view");
        currentNPVWhentil = Whentil.When(
            () => finalContainer && !PageView.IsOpened,
            () => {
                // console.log("[Spicy Lyrics Debug] Whentil with existing container");
                PageView.Open(parentContainer, true);
                Whentil.When(() => currentPageBgInstance, () => {
                    SetPageBGBlur(100);
                })
                currentNPVWhentil?.Cancel();
                currentNPVWhentil = null;
                SetRSBListeners();
            },
        );
    }

    isSpicySidebarMode = true;
    storage.set("sidebar-status", "open");

    // console.log("[Spicy Lyrics Debug] isSpicySidebarMode set to true");
}

export function CloseSidebarLyrics() {
    // console.log("[Spicy Lyrics Debug] CloseSidebarLyrics");
    if (!isSpicySidebarMode) {
        // console.log("[Spicy Lyrics Debug] not in sidebar mode, returning");
        return;
    }
    currentNPVWhentil?.Cancel();
    currentNPVWhentil = null;
    // console.log("[Spicy Lyrics Debug] PageView.Destroy()");
    PageView.Destroy();
    appendClosed();
    CleanupRSBListeners();
    isSpicySidebarMode = false;
    storage.set("sidebar-status", "closed");
    // console.log("[Spicy Lyrics Debug] isSpicySidebarMode set to false");
    {
        if (onOpen_wasThingOpen === undefined) {
            const queuePlaybarButton = getQueuePlaybarButton();
            if (!queuePlaybarButton) {
                console.error("[Spicy Lyrics] Queue playbar button is missing");
                return;
            }
            queuePlaybarButton.click();
        } else if (onOpen_wasThingOpen === "npv") {
            const playbarButton = getNowPlayingViewPlaybarButton();
            if (!playbarButton) {
                console.error("[Spicy Lyrics] Now Playing View playbar button is missing");
                return;
            }
            playbarButton.click();
        } else if (onOpen_wasThingOpen === "queue") {
            const queuePlaybarButton = getQueuePlaybarButton();
            if (!queuePlaybarButton) {
                console.error("[Spicy Lyrics] Queue playbar button is missing");
                return;
            }
            queuePlaybarButton.click();
        } else if (onOpen_wasThingOpen === "devices") {
            const devicesPlaybarButton = getDevicesPlaybarButton();
            if (!devicesPlaybarButton) {
                console.error("[Spicy Lyrics] Devices playbar button is missing");
                return;
            }
            devicesPlaybarButton.click();
        }
    }
    onOpen_wasThingOpen = undefined;
}

let RSBAbortControllers: Array<AbortController | undefined> = [undefined, undefined, undefined];

export function SetRSBListeners() {
    const npv = getNowPlayingViewPlaybarButton();
    const queue = getQueuePlaybarButton();
    const devices = getDevicesPlaybarButton();

    if (!npv) return;
    if (!queue) return;
    if (!devices) return;

    [npv, queue, devices].forEach((button, i) => {
        const abortController = new AbortController();
        RSBAbortControllers[i] = abortController;
        button.addEventListener("click", () => {
            if (!isSpicySidebarMode) return;
            currentNPVWhentil?.Cancel();
            currentNPVWhentil = null;
            PageView.Destroy();
            appendClosed();
            isSpicySidebarMode = false;
            // console.log(i)
            if (i === 1) {
                queue.click();
            }
        }, { signal: abortController.signal })
    })
}

export function CleanupSpecificRSBListener(type: "npv" | "queue" | "devices") {
    if (RSBAbortControllers.length <= 0) return;
    let mappedType: number | undefined = undefined;
    switch (type) {
        case "npv":
            mappedType = 0
            break;
        case "queue":
            mappedType = 1;
            break;
        case "devices":
            mappedType = 2;
            break;
        default: 
            mappedType = undefined
            break;
    }

    if (mappedType) {
        RSBAbortControllers[mappedType]?.abort();
        RSBAbortControllers[mappedType] = undefined;
    }
}

export function CleanupRSBListeners() {
    if (RSBAbortControllers.length <= 0) return;
    RSBAbortControllers.forEach((abortController, i, arr) => {
        abortController?.abort();
        if (i === (arr.length - 1)) {
            RSBAbortControllers = [undefined, undefined, undefined];
        }
    })
}

Spicetify.Player.addEventListener("songchange", (e: any) => {
    if (e.data === null) {
        CloseSidebarLyrics();
    }
})