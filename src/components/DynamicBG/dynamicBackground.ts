import Animator from "../../utils/Animator";
import BlobURLMaker from "../../utils/BlobURLMaker";
import storage from "../../utils/storage";
import Defaults from "../Global/Defaults";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import ArtistVisuals from "./ArtistVisuals/Main";
import { CreateDynamicBackground, CleanupContainer } from "./WebGLCoverGenerator";

export default async function ApplyDynamicBackground(element) {
    if (!element) return
    let currentImgCover = await SpotifyPlayer.Artwork.Get("d");
    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    const IsEpisode = Spicetify.Player.data.item.type === "episode";
    const CurrentSongArtist = IsEpisode ? null : Spicetify.Player.data?.item.artists[0].uri;
    const CurrentSongUri = Spicetify.Player.data?.item.uri;

    if (lowQModeEnabled) {
        try {
            currentImgCover = (IsEpisode ? null : (storage.get("force-cover-bg_in-lowqmode") == "true" ? currentImgCover : await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri)));
        } catch (error) {
            console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error)
        }
    }
    
    // Keep the lowQMode implementation as is
    if (lowQModeEnabled) {
        if (IsEpisode) return;
        const dynamicBg = document.createElement("img");
        const prevBg = element.querySelector(".spicy-dynamic-bg.lowqmode");

        if (prevBg && prevBg.getAttribute("spotifyimageurl") === currentImgCover) {
            dynamicBg.remove();
            return;
        }

        dynamicBg.classList.add("spicy-dynamic-bg", "lowqmode")

        const processedCover = `https://i.scdn.co/image/${currentImgCover.replace("spotify:image:", "")}`;

        dynamicBg.src = await BlobURLMaker(processedCover) ?? currentImgCover;
        dynamicBg.setAttribute("spotifyimageurl", currentImgCover);
        element.appendChild(dynamicBg);

        if (Defaults.PrefersReducedMotion) {
            dynamicBg.style.opacity = "1";
            if (prevBg) prevBg.remove();
        } else {
            const Animator1 = new Animator(0, 1, 0.3);
            const Animator2 = new Animator(1, 0, 0.3);

            Animator1.on("progress", (progress) => {
                dynamicBg.style.opacity = progress.toString();
            });

            Animator2.on("progress", (progress) => {
                if (!prevBg) return;
                prevBg.style.opacity = progress.toString();
            });

            Animator1.on("finish", () => {
                dynamicBg.style.opacity = "1";
                Animator1.Destroy();
            });

            Animator2.on("finish", () => {
                prevBg?.remove();
                Animator2.Destroy();
            });

            Animator2.Start();
            Animator1.Start();
        }
    } else {
        // Always use Default container type for this function
        const containerType = "Default";
        
        // Check if we already have a background
        const existingContainer = element.querySelector(".spicy-dynamic-bg");
        
        // If same song, do nothing
        if (existingContainer && existingContainer.getAttribute("data-cover-id") === currentImgCover) {
            return;
        }
        
        // Determine the canvas size - use element dimensions with a minimum
        const width = Math.max(element.clientWidth, 500);
        const height = Math.max(element.clientHeight, 500);
        
        // Create the new WebGL background container
        const newContainer = await CreateDynamicBackground(containerType, width, height);
        newContainer.setAttribute("data-cover-id", currentImgCover);
        
        // Add animation for transition
        newContainer.style.opacity = "0";
        element.appendChild(newContainer);
        
        // Fade in/out animation
        if (Defaults.PrefersReducedMotion) {
            newContainer.style.opacity = "1";
            if (existingContainer) {
                CleanupContainer(existingContainer as HTMLDivElement);
                existingContainer.remove();
            }
        } else {
            const fadeIn = new Animator(0, 1, 0.6);
            fadeIn.on("progress", (progress) => {
                newContainer.style.opacity = progress.toString();
            });
            
            const fadeOut = new Animator(1, 0, 0.6);
            fadeOut.on("progress", (progress) => {
                if (existingContainer) {
                    existingContainer.style.opacity = progress.toString();
                }
            });
            
            fadeIn.on("finish", () => {
                newContainer.style.opacity = "1";
                fadeIn.Destroy();
            });
            
            fadeOut.on("finish", () => {
                if (existingContainer) {
                    // Clean up old WebGL container
                    CleanupContainer(existingContainer as HTMLDivElement);
                    existingContainer.remove();
                }
                fadeOut.Destroy();
            });
            
            fadeOut.Start();
            fadeIn.Start();
        }
    }
}

export async function LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri) {
    if (storage.get("force-cover-bg_in-lowqmode") == "true") return;
    try {
        return await ArtistVisuals.ApplyContent(CurrentSongArtist, CurrentSongUri);
    } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error)
    }
}


