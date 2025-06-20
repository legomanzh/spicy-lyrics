import Animator from "@spikerko/tools/Animator";
import { ResetLastLine } from "../../utils/Scrolling/ScrollToActiveLine";
import storage from "../../utils/storage";
import Defaults from "../Global/Defaults";
import Global from "../Global/Global";
import PageView, { Compactify, GetPageRoot, Tooltips } from "../Pages/PageView";
import { CleanUpNowBarComponents, CloseNowBar, DeregisterNowBarBtn, OpenNowBar } from "./NowBar";
import TransferElement from "./TransferElement";
import { GetCurrentLyricsContainerInstance } from "../../utils/Lyrics/Applyer/CreateLyricsContainer";

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

const MediaBox_Data = {
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
};



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
    MediaBox_Data.abortController?.abort();
    MediaBox_Data.abortController = null;

    // Cleanup media box interactions (Styles and Timeout)
    const MediaBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar .Header .MediaBox");
    if (MediaBox) {
        // Clear any existing timeout
        if (MediaBox_Data.hoverTimeoutId) {
            clearTimeout(MediaBox_Data.hoverTimeoutId);
            MediaBox_Data.hoverTimeoutId = null;
        }

        // Reset styles
        MediaBox_Data.Functions.Reset(MediaBox);
    }
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
            MediaBox_Data.abortController = new AbortController();
            const signal = MediaBox_Data.abortController.signal;

            MediaBox_Data.Functions.Eventify(MediaBox);
            MediaBox.addEventListener("mouseenter", MediaBox_Data.Functions.MouseIn, { signal });
            MediaBox.addEventListener("mouseleave", MediaBox_Data.Functions.MouseOut, { signal });

            // Add NowBar hover animation and movement tracking
            //const NowBar = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .NowBar");
            if (SpicyPage) {
                SpicyPage.addEventListener("mouseenter", MediaBox_Data.Functions.PageMouseIn, { signal });
                SpicyPage.addEventListener("mousemove", MediaBox_Data.Functions.PageMouseMoveHandler, { signal });
                SpicyPage.addEventListener("mouseleave", MediaBox_Data.Functions.PageMouseOut, { signal });
            }
        }

        Global.Event.evoke("fullscreen:open", null);
    }
    setTimeout(Compactify, 1000)
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
            OpenNowBar();
            document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
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