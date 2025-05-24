import Defaults from "../Global/Defaults";
import ArtistVisuals from "./ArtistVisuals/Main";
import { type CoverArtCache, DynamicBackground, DynamicBackgroundOptions } from "@spikerko/tools/DynamicBackground"
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import { Timeout } from "@socali/modules/Scheduler";

const CoverArtCacheMap: CoverArtCache = new Map();

export const DynamicBackgroundConfig: DynamicBackgroundOptions = {
    transition: Defaults.PrefersReducedMotion ? 0 : 0.25,
    blur: 65,
    speed: 0.2,
    coverArtCache: CoverArtCacheMap
}

// Store the DynamicBackground instance and element for reuse
let currentBgInstance: DynamicBackground | null = null;

export const CleanupDynamicBGLets = () => {
    if (currentBgInstance) {
        currentBgInstance.Destroy();
        currentBgInstance = null;
    }
}

export default async function ApplyDynamicBackground(element: HTMLElement) {
    if (!element) return;
    const currentImgCover = SpotifyPlayer.GetCover("large") ?? "";
    const IsEpisode = SpotifyPlayer.GetContentType() === "episode";

    const artists = SpotifyPlayer.GetArtists() ?? [];
    const TrackArtist = artists.length > 0 && artists[0]?.uri
        ? artists[0].uri.replace("spotify:artist:", "")
        : undefined;

    const TrackId = SpotifyPlayer.GetId() ?? undefined;

    if (Defaults.StaticBackground) {
        const currentImgCover = await GetStaticBackground(TrackArtist, TrackId);

        if (IsEpisode || !currentImgCover) return;
        const prevBg = element.querySelector<HTMLElement>(".spicy-dynamic-bg.StaticBackground");

        if (prevBg && prevBg.getAttribute("data-cover-id") === currentImgCover) {
            return;
        }
        const dynamicBg = document.createElement("div");

        dynamicBg.classList.add("spicy-dynamic-bg", "StaticBackground", "Hidden");

        //const processedCover = `https://i.scdn.co/image/${currentImgCover.replace("spotify:image:", "")}`;

        dynamicBg.style.backgroundImage = `url("${currentImgCover}")`;
        dynamicBg.setAttribute("data-cover-id", currentImgCover);
        element.appendChild(dynamicBg);

        Timeout(0.08, () => {
            if (prevBg) {
                prevBg.classList.add("Hidden")
                Timeout(0.5, () => prevBg?.remove());
            }
            dynamicBg.classList.remove("Hidden");
        })
    } else {
        const existingElement = element.querySelector<HTMLElement>(".spicy-dynamic-bg");
        // Get existing DynamicBackground instance if it exists
        const existingBgData = existingElement?.getAttribute("data-cover-id") ?? null;


        // If same song, do nothing
        if (existingBgData === currentImgCover) {
            return;
        }

        // Check if we already have a DynamicBackground instance
        if (existingElement && currentBgInstance) {
            // If we have an instance, just update it with the new image
            const processedCover = currentImgCover;

            // Update the data-cover-id attribute
            existingElement.setAttribute("data-cover-id", currentImgCover ?? "");

            // Update with the current image
            await currentBgInstance.Update({
                image: processedCover ?? ""
            });

            return;
        }

        // Create new DynamicBackground instance
        currentBgInstance = new DynamicBackground(DynamicBackgroundConfig);

        // Get the canvas element
        const container = currentBgInstance.GetCanvasElement();

        // Add the spicy-dynamic-bg class
        container.classList.add("spicy-dynamic-bg");

        // Set the data-cover-id attribute to match the existing code
        container.setAttribute("data-cover-id", currentImgCover ?? "");

        // Apply the background to the element
        currentBgInstance.AppendToElement(element);

        // Update with the current image
        await currentBgInstance.Update({
            image: currentImgCover ?? ""
        });
    }
}

export async function GetStaticBackground(TrackArtist: string | undefined, TrackId: string | undefined): Promise<string | undefined> {
    if (!TrackArtist || !TrackId) return undefined;

    try {
        return await ArtistVisuals.ApplyContent(TrackArtist, TrackId);
    } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error);
        return undefined;
    }
}

/* const GetCoverArtURL = (): string | null => {
    const images = Spicetify.Player.data?.item?.album?.images;
    if (!images || images.length === 0) return null;

    for (const image of images) {
      const url = image.url;
      if (url) return url;
    }
    return null;
};

const BlurredCoverArts = new Map<string, OffscreenCanvas>();
export async function GetBlurredCoverArt() {
    const coverArt = GetCoverArtURL();

    if (BlurredCoverArts.has(coverArt)) {
        return BlurredCoverArts.get(coverArt);
    }

    const image = new Image();
    image.src = coverArt;
    await image.decode();

    const originalSize = Math.min(image.width, image.height); // Crop to a square
    const blurExtent = Math.ceil(3 * 40); // Blur spread extent

    // Create a square canvas to crop the image into a circle
    const circleCanvas = new OffscreenCanvas(originalSize, originalSize);
    const circleCtx = circleCanvas.getContext('2d')!;

    // Create circular clipping mask
    circleCtx.beginPath();
    circleCtx.arc(originalSize / 2, originalSize / 2, originalSize / 2, 0, Math.PI * 2);
    circleCtx.closePath();
    circleCtx.clip();

    // Draw the original image inside the circular clip
    circleCtx.drawImage(
        image,
        ((image.width - originalSize) / 2), ((image.height - originalSize) / 2),
        originalSize, originalSize,
        0, 0,
        originalSize, originalSize
    );

    // Expand canvas to accommodate blur effect
    const padding = (blurExtent * 1.5);
    const expandedSize = originalSize + padding;
    const blurredCanvas = new OffscreenCanvas(expandedSize, expandedSize);
    const blurredCtx = blurredCanvas.getContext('2d')!;

    blurredCtx.filter = `blur(${22}px)`;

    // Draw the cropped circular image in the center of the expanded canvas
    blurredCtx.drawImage(circleCanvas, (padding / 2), (padding / 2));

    BlurredCoverArts.set(coverArt, blurredCanvas);
    return blurredCanvas;
}

Global.Event.listen("playback:songchange", async () => {
    if (Defaults.LyricsContainerExists) return;
    setTimeout(async () => {
        await GetBlurredCoverArt();
    }, 500)
}) */

/* const prefetchBlurredCoverArt = async () =>{
    if (!Defaults.LyricsContainerExists) {
        await GetBlurredCoverArt();
    };
}

Platform.OnSpotifyReady
.then(() => {
    prefetchBlurredCoverArt();
}) */
