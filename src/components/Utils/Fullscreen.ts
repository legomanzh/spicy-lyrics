import Animator from "@spikerko/tools/Animator";
import { ResetLastLine } from "../../utils/Scrolling/ScrollToActiveLine";
import storage from "../../utils/storage";
import Defaults from "../Global/Defaults";
import Global from "../Global/Global";
import PageView, { Compactify, GetPageRoot, isSizeReadyToBeCompacted, Tooltips } from "../Pages/PageView";
import { CleanUpNowBarComponents, CloseNowBar, DeregisterNowBarBtn, OpenNowBar } from "./NowBar";
import TransferElement from "./TransferElement";
import { GetCurrentLyricsContainerInstance } from "../../utils/Lyrics/Applyer/CreateLyricsContainer";
import Spring from "@socali/modules/Spring";
import { Maid } from "@socali/modules/Maid";
import { OnPreRender } from "@socali/modules/Scheduler";
import { EnableCompactMode, IsCompactMode } from "./CompactMode";

const ArtworkBrightness = {
    Start: 0.78,
    End: 0.55,
    Duration: 0.35,
    ParentHover: {
        Start: 1,
        End: 0.78,
        Duration: 0.4
    }
};

const ControlsOpacity = {
    Start: 0.5,
    End: 1,
    Duration: 0.35,
    ParentHover: {
        Start: 0,
        End: 0.5,
        Duration: 0.4
    }
};

const Fullscreen = {
    Open,
    Close,
    Toggle,
    IsOpen: false,
    CinemaViewOpen: false,
};

const ControlsMaid = new Maid();

const controlsOpacitySpring = new Spring(0, 2, 2, 0.65);
const artworkBrightnessSpring = new Spring(0, 2, 2, 0.78);

let animationLastTimestamp: (number | undefined) = undefined;

let controlsVisible = false;
let visualsApplied = false;
let pageHover = false;
let mediaBoxHover = false;


let lastPageMouseMove: (number | undefined) = undefined;

const Page_MouseMove = (e: MouseEvent) => {

/*     if (storage.get("ForceCompactMode") === "true") {
        const target = e.target as HTMLElement;
        const nowBar = target.closest('.NowBar') || (target.classList.contains('NowBar') ? target : null);
        if (!nowBar) return;
    } */

    controlsVisible = true;
    pageHover = true;

    lastPageMouseMove = performance.now();

    // console.log("Page_MouseMove")
    ToggleControls();
    if (!mediaBoxHover) {
        MouseMoveChecker();
    }
}

const MouseMoveChecker = () => {
    const now = performance.now();
    // console.log("MouseMoveChecker", lastPageMouseMove, (now - lastPageMouseMove), !mediaBoxHover)
    if (lastPageMouseMove !== undefined && (now - lastPageMouseMove) >= 750 && !mediaBoxHover) {
        // console.log("Controls Should Hide now - after 750ms")
        animationLastTimestamp = now;
        ToggleControls(true);
        ControlsMaid.Clean("MouseMoveChecker")
        return;
    }
    ControlsMaid.Give(OnPreRender(MouseMoveChecker), "MouseMoveChecker");
}

const RunMediaBoxAnimation = () => {
    const timestampNow = performance.now();

    if (animationLastTimestamp !== undefined) {
        // console.log("Running MediaBox Animation")
        const deltaTime = ((timestampNow - animationLastTimestamp) / 1000);
        const controlsOpacity = controlsOpacitySpring.Step(deltaTime);
		const artworkBrightness = artworkBrightnessSpring.Step(deltaTime);

        const MediaBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox");
        
        if (MediaBox) {
            MediaBox.style.setProperty("--ArtworkBrightness", artworkBrightness.toString());
            MediaBox.style.setProperty("--ControlsOpacity", controlsOpacity.toString());
            // console.log("MediaBoxAnimation: Set style properties")
        }

        if (controlsOpacitySpring.CanSleep() && artworkBrightnessSpring.CanSleep()) {
            animationLastTimestamp = undefined
            visualsApplied = false;
            // console.log("MediaBoxAnimation: Sleep")
            return
        }
    }

    animationLastTimestamp = timestampNow

    ControlsMaid.Give(OnPreRender(RunMediaBoxAnimation), "MediaBoxAnimation");
}


const ToggleControls = (force: boolean = false) => {
    // console.log("Ran ToggleControls")
    const now = performance.now();

    const getControlsOpacityGoal = () => {
        if (lastPageMouseMove !== undefined && (now - lastPageMouseMove) >= 750) {
            return 0
        } else if (pageHover && !mediaBoxHover) {
            return 0.65
        } else if (mediaBoxHover) {
            return 0.985
        } else {
            return 0
        }
    }

    const getArtworkBrightnessGoal = () => {
        if (lastPageMouseMove !== undefined && (now - lastPageMouseMove) >= 750) {
            return 1
        } else if (pageHover && !mediaBoxHover) {
            return 0.78
        } else if (mediaBoxHover) {
            return 0.55
        } else {
            return 1
        }
    }

    controlsOpacitySpring.SetGoal(getControlsOpacityGoal());
    artworkBrightnessSpring.SetGoal(getArtworkBrightnessGoal());

    /* controlsOpacitySpring.SetFrequency(2)
	controlsOpacitySpring.SetDampingRatio(2)

    artworkBrightnessSpring.SetFrequency(2)
	artworkBrightnessSpring.SetDampingRatio(2); */

    if (force || visualsApplied === false) {
        visualsApplied = true;
        // console.log("VisualsAppied was false")

        RunMediaBoxAnimation();
        // console.log("MediaBoxAnimation in ToggleControls Ran!")
    }
}

let EventAbortController: (AbortController | undefined) = undefined;

const MediaBox_MouseIn = () => {
    controlsVisible = true;
    mediaBoxHover = true;
    pageHover = true;
    // console.log("MediaBox_MouseIn")
    ToggleControls();
    ControlsMaid.Clean("MouseMoveChecker")
}

const MediaBox_MouseOut = () => {
    controlsVisible = true;
    mediaBoxHover = false;
    pageHover = true;
    // console.log("MediaBox_MouseOut")
    ToggleControls();
}

const MediaBox_MouseMove = () => {
    controlsVisible = true;
    mediaBoxHover = true;
    pageHover = true;
    // console.log("MediaBox_MouseMove")
    ControlsMaid.Clean("MouseMoveChecker");
    ToggleControls();
}
const Page_MouseIn = (e: MouseEvent) => {

/*     if (storage.get("ForceCompactMode") === "true") {
        const target = e.target as HTMLElement;
        const nowBar = target.closest('.NowBar') || (target.classList.contains('NowBar') ? target : null);
        if (!nowBar) return;
    } */
    
    controlsVisible = true;
    mediaBoxHover = false;
    pageHover = true;
    // console.log("Page_MouseIn")
    ToggleControls();
}

const Page_MouseOut = (e: MouseEvent) => {
    controlsVisible = false;
    mediaBoxHover = false;
    pageHover = false;
    // console.log("Page_MouseOut")
    ToggleControls();
    ControlsMaid.Clean("MouseMoveChecker")
}


/* const MediaBox_Data = {
    Eventified: false,
    hoverTimeoutId: null as number | null,
    abortController: null as AbortController | null,
    Functions: {
        MouseIn: () => {
            // Clear any existing timeout when entering MediaBox
            if (MediaBox_Data.hoverTimeoutId) {
                clearTimeout(MediaBox_Data.hoverTimeoutId);
                MediaBox_Data.hoverTimeoutId = null;
            }

            if (Defaults.PrefersReducedMotion && MediaBox_Data.Functions.Target) {
                MediaBox_Data.Functions.Target.style.setProperty("--ArtworkBrightness", `${ArtworkBrightness.End}`);
                MediaBox_Data.Functions.Target.style.setProperty("--ControlsOpacity", `${ControlsOpacity.End}`);
                return;
            }

            if (MediaBox_Data.Animators.brightness.reversed) MediaBox_Data.Animators.brightness.Reverse();
            if (MediaBox_Data.Animators.opacity.reversed) MediaBox_Data.Animators.opacity.Reverse();
            MediaBox_Data.Animators.brightness.Start();
            MediaBox_Data.Animators.opacity.Start();
        },
        PageMouseIn: () => {
            // Clear any existing timeout when entering NowBar
            if (MediaBox_Data.hoverTimeoutId) {
                clearTimeout(MediaBox_Data.hoverTimeoutId);
                MediaBox_Data.hoverTimeoutId = null;
            }

            if (Defaults.PrefersReducedMotion && MediaBox_Data.Functions.Target) {
                MediaBox_Data.Functions.Target.style.setProperty("--ArtworkBrightness", `${ArtworkBrightness.ParentHover.End}`);
                MediaBox_Data.Functions.Target.style.setProperty("--ControlsOpacity", `${ControlsOpacity.ParentHover.End}`);
                return;
            }

            // Use half-strength animators
            if (MediaBox_Data.Animators.brightnessHalf.reversed) MediaBox_Data.Animators.brightnessHalf.Reverse();
            if (MediaBox_Data.Animators.opacityHalf.reversed) MediaBox_Data.Animators.opacityHalf.Reverse();
            MediaBox_Data.Animators.brightnessHalf.Start();
            MediaBox_Data.Animators.opacityHalf.Start();
        },
        MouseOut: () => {
            // Clear any existing timeout (though this timeout is primarily for half-strength, good to clear)
            if (MediaBox_Data.hoverTimeoutId) {
                clearTimeout(MediaBox_Data.hoverTimeoutId);
                MediaBox_Data.hoverTimeoutId = null;
            }

            if (Defaults.PrefersReducedMotion && MediaBox_Data.Functions.Target) {
                MediaBox_Data.Functions.Target.style.setProperty("--ArtworkBrightness", `${ArtworkBrightness.Start}`);
                MediaBox_Data.Functions.Target.style.setProperty("--ControlsOpacity", `${ControlsOpacity.Start}`);
                return;
            }

            // Reverse MediaBox's full-strength animations as the mouse is leaving MediaBox
            if (!MediaBox_Data.Animators.brightness.reversed) MediaBox_Data.Animators.brightness.Reverse();
            if (!MediaBox_Data.Animators.opacity.reversed) MediaBox_Data.Animators.opacity.Reverse();
            MediaBox_Data.Animators.brightness.Start();
            MediaBox_Data.Animators.opacity.Start();

            // The logic for handling mouse leaving SpicyLyricsPage and managing half-strength
            // animations is now handled by PageMouseOut, PageMouseIn, and PageMouseMoveHandler.
        },
        PageMouseMoveHandler: (event: MouseEvent) => {
            const MediaBox = MediaBox_Data.Functions.Target;
            // We're not using NowBar variable, so we can remove it to avoid the unused variable warning
            // const NowBar = event.currentTarget as HTMLElement;

            // Don't handle moves if mouse is over MediaBox
            if (MediaBox && event.target && MediaBox instanceof HTMLElement && MediaBox.contains(event.target as Node)) {
                return;
            }

            // If animations are reversed, bring them back
            if (MediaBox_Data.Animators.brightnessHalf.reversed) {
                MediaBox_Data.Animators.brightnessHalf.Reverse();
                MediaBox_Data.Animators.opacityHalf.Reverse();

                MediaBox_Data.Animators.brightnessHalf.Start();
                MediaBox_Data.Animators.opacityHalf.Start();
            }

            // Clear existing timeout
            if (MediaBox_Data.hoverTimeoutId) {
                clearTimeout(MediaBox_Data.hoverTimeoutId);
            }

            // Set new timeout
            MediaBox_Data.hoverTimeoutId = setTimeout(() => {
                // Only reverse if we're still in NowBar state
                if (!MediaBox_Data.Animators.brightnessHalf.reversed) {
                    MediaBox_Data.Animators.brightnessHalf.Reverse();
                    MediaBox_Data.Animators.opacityHalf.Reverse();

                    MediaBox_Data.Animators.brightnessHalf.Start();
                    MediaBox_Data.Animators.opacityHalf.Start();
                }
            }, 750);
        },
        PageMouseOut: () => {
            // This function is called when the mouse leaves SpicyLyricsPage.
            // Clear any timeout set by PageMouseMoveHandler
            if (MediaBox_Data.hoverTimeoutId) {
                clearTimeout(MediaBox_Data.hoverTimeoutId);
                MediaBox_Data.hoverTimeoutId = null;
            }

            const target = MediaBox_Data.Functions.Target;
            if (Defaults.PrefersReducedMotion && target) {
                // Revert to the "non-page-hovered" state for reduced motion
                target.style.setProperty("--ArtworkBrightness", `${ArtworkBrightness.ParentHover.Start}`);
                target.style.setProperty("--ControlsOpacity", `${ControlsOpacity.ParentHover.Start}`);
                return;
            }

            // If half-strength animators are active (not reversed), reverse them and play them.
            if (!MediaBox_Data.Animators.brightnessHalf.reversed) {
                MediaBox_Data.Animators.brightnessHalf.Reverse();
                if (!MediaBox_Data.Animators.opacityHalf.reversed) { // Keep opacity in sync
                    MediaBox_Data.Animators.opacityHalf.Reverse();
                }
                MediaBox_Data.Animators.brightnessHalf.Start();
                MediaBox_Data.Animators.opacityHalf.Start();
            }
        },
        Reset: (MediaBox: HTMLElement) => {
            MediaBox.style.removeProperty("--ArtworkBrightness");
            MediaBox.style.removeProperty("--ControlsOpacity");
        },
        Eventify: (MediaBox: HTMLElement) => {
            MediaBox_Data.Functions.Target = MediaBox;

            // Full strength animation events
            MediaBox_Data.Animators.brightness.on("progress", (progress) => {
                MediaBox.style.setProperty("--ArtworkBrightness", `${progress}`);
            });
            MediaBox_Data.Animators.opacity.on("progress", (progress) => {
                MediaBox.style.setProperty("--ControlsOpacity", `${progress}`);
            });

            // Half strength animation events
            MediaBox_Data.Animators.brightnessHalf.on("progress", (progress) => {
                MediaBox.style.setProperty("--ArtworkBrightness", `${progress}`);
            });
            MediaBox_Data.Animators.opacityHalf.on("progress", (progress) => {
                MediaBox.style.setProperty("--ControlsOpacity", `${progress}`);
            });

            MediaBox_Data.Eventified = true;
        },
        Target: null as HTMLElement | null,
    },
    Animators: {
        brightness: new Animator(ArtworkBrightness.Start, ArtworkBrightness.End, ArtworkBrightness.Duration),
        opacity: new Animator(ControlsOpacity.Start, ControlsOpacity.End, ControlsOpacity.Duration),
        brightnessHalf: new Animator(ArtworkBrightness.ParentHover.Start, ArtworkBrightness.ParentHover.End, ArtworkBrightness.ParentHover.Duration),
        opacityHalf: new Animator(ControlsOpacity.ParentHover.Start, ControlsOpacity.ParentHover.End, ControlsOpacity.ParentHover.Duration)
    }
}; */



export const ExitFullscreenElement = async () => {
    if (document.fullscreenElement) {
        await document.exitFullscreen();
    }
    setTimeout(Compactify, 1000)
}

export const EnterSpicyLyricsFullscreen = async () => {
    const mainElement = document.querySelector<HTMLElement>("#main");
    if (mainElement) {
        mainElement.style.display = "none";
    }

    try {
        if (!document.fullscreenElement) {
            // Use the html element for fullscreen instead of SpicyLyricsPage
            await document.documentElement.requestFullscreen();
        }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Fullscreen error: ${errorMessage}`);
    }
    setTimeout(Compactify, 1000)
}

function CleanupMediaBox() {
    // Abort the controller to remove listeners
    EventAbortController?.abort();
    EventAbortController = undefined;
    
    ControlsMaid.CleanUp();

    animationLastTimestamp = undefined;
    lastPageMouseMove = undefined;

    controlsVisible = false;
    visualsApplied = false;
    mediaBoxHover = false;
    pageHover = false;

    // Cleanup media box interactions (Styles and Timeout)
    //const MediaBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox");
    //if (MediaBox) {
        /* // Clear any existing timeout
        if (MediaBox_Data.hoverTimeoutId) {
            clearTimeout(MediaBox_Data.hoverTimeoutId);
            MediaBox_Data.hoverTimeoutId = null;
        }

        // Reset styles
        MediaBox_Data.Functions.Reset(MediaBox); */

    //}
}

function Open(skipDocumentFullscreen: boolean = false) {
    const SpicyPage = document.querySelector<HTMLElement>(".Root__main-view #SpicyLyricsPage");
    const Root = document.body as HTMLElement;
    const mainElement = document.querySelector<HTMLElement>("#main");

    if (SpicyPage) {
        // Set state first
        Fullscreen.IsOpen = true;
        Fullscreen.CinemaViewOpen = skipDocumentFullscreen;

        // Handle DOM changes
        TransferElement(SpicyPage, Root);
        SpicyPage.classList.add("Fullscreen");

        // Hide the main element
        if (mainElement) {
            mainElement.style.display = "none";
        }

        // Safely destroy tooltip if it exists
        const nowBarToggle = Tooltips.NowBarToggle as any;
        if (nowBarToggle && typeof nowBarToggle.destroy === 'function') {
            nowBarToggle.destroy();
        }

        const NowBarToggle = document.querySelector<HTMLElement>("#SpicyLyricsPage .ViewControls #NowBarToggle");
        if (NowBarToggle) {
            NowBarToggle.remove();
        }

        CleanUpNowBarComponents();
        CleanupMediaBox();
        OpenNowBar(true);

        // Handle fullscreen state
        const handleFullscreen = async () => {
            try {
                if (!skipDocumentFullscreen) {
                    await EnterSpicyLyricsFullscreen();
                }
                setTimeout(() => PageView.AppendViewControls(true), 50);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`Fullscreen error: ${errorMessage}`);
            }
        };

        handleFullscreen();
        ResetLastLine();

        // Setup media box interactions
        const MediaBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox");
        const MediaImage = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox .MediaImage");

        if (MediaBox && MediaImage) {
            // Create and store the AbortController
            EventAbortController = new AbortController();
            const signal = EventAbortController.signal;

            MediaBox.addEventListener("mouseenter", MediaBox_MouseIn, { signal });
            MediaBox.addEventListener("mouseleave", MediaBox_MouseOut, { signal });
            MediaBox.addEventListener("mousemove", MediaBox_MouseMove, { signal });

            // Add NowBar hover animation and movement tracking
            //const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
            if (SpicyPage) {
                SpicyPage.addEventListener("mouseenter", Page_MouseIn, { signal });
                SpicyPage.addEventListener("mousemove", Page_MouseMove, { signal });
                SpicyPage.addEventListener("mouseleave", Page_MouseOut, { signal });
            }
        }

        Global.Event.evoke("fullscreen:open", null);
    }
    setTimeout(() => {
        Compactify();

        if (storage.get("ForceCompactMode") === "true" && !IsCompactMode()) {
            SpicyPage?.classList.add("ForcedCompactMode")
            EnableCompactMode();
        }

        setTimeout(() => {
            const NoLyrics = storage.get("currentLyricsData")?.toString()?.includes("NO_LYRICS");
            if (NoLyrics && !IsCompactMode()) {
                document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
                document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.add("LyricsHidden");
            }
        }, 75);
    }, 750)
    GetCurrentLyricsContainerInstance()?.Resize();
}

function Close() {
    const SpicyPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");
    const mainElement = document.querySelector<HTMLElement>("#main");

    if (SpicyPage) {
        // Set state first
        //const wasOpen = Fullscreen.IsOpen;
        Fullscreen.IsOpen = false;
        Fullscreen.CinemaViewOpen = false;

        // Handle DOM changes
        TransferElement(SpicyPage, GetPageRoot() as HTMLElement);
        SpicyPage.classList.remove("Fullscreen");

        // Show the main element again
        if (mainElement) {
            mainElement.style.removeProperty("display");
        }

        // Handle fullscreen exit
        const handleFullscreenExit = async () => {
            await ExitFullscreenElement();

            // Only update controls after fullscreen state is settled
            setTimeout(() => PageView.AppendViewControls(true), 50);
        };

        handleFullscreenExit();

        const NoLyrics = storage.get("currentLyricsData")?.toString()?.includes("NO_LYRICS");
        if (NoLyrics) {
            document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
            document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
            DeregisterNowBarBtn();
        }

        ResetLastLine();

        if (storage.get("IsNowBarOpen") !== "true") {
            CloseNowBar();
        }

        CleanupMediaBox();
        CleanUpNowBarComponents();

        Global.Event.evoke("fullscreen:exit", null);
    }
    setTimeout(Compactify, 1000)
    GetCurrentLyricsContainerInstance()?.Resize();
}

function Toggle(skipDocumentFullscreen: boolean = false) {
    const SpicyPage = document.querySelector<HTMLElement>("#SpicyLyricsPage");

    if (SpicyPage) {
        if (Fullscreen.IsOpen) {
            Close();
        } else {
            Open(skipDocumentFullscreen);
        }
    }
}

export { CleanupMediaBox };
export default Fullscreen;