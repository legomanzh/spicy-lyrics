import storage from "../../utils/storage";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import ArtistVisuals from "./ArtistVisuals/Main";

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
            currentImgCover = IsEpisode ? null : await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
        } catch (error) {
            console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error)
        }
    }
    
    if (element?.querySelector(".spicy-dynamic-bg")) {
        element.querySelector(".spicy-dynamic-bg").remove();
    }
    

    if (lowQModeEnabled) {
        if (IsEpisode) return;
        const dynamicBg = document.createElement("img")
        dynamicBg.classList.add("spicy-dynamic-bg", "lowqmode")

        dynamicBg.src = currentImgCover;
        element.appendChild(dynamicBg)
    } else {   
        const dynamicBg = document.createElement("div")
        dynamicBg.classList.add("spicy-dynamic-bg")
        dynamicBg.classList.remove("lowqmode")

        dynamicBg.innerHTML = `
            <img class="Front" src="${currentImgCover}" />
            <img class="Back" src="${currentImgCover}" />
            <img class="BackCenter" src="${currentImgCover}" />
        `
        element.appendChild(dynamicBg)
    }

}

export async function LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri) {
    try {
        return await ArtistVisuals.ApplyContent(CurrentSongArtist, CurrentSongUri);
    } catch (error) {
        console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error)
    }
}