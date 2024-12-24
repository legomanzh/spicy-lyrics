import storage from "../../utils/storage";
import ArtistVisuals from "./ArtistVisuals/Main";

export default async function ApplyDynamicBackground(element) {
    if (!element) return
    let currentImgCover = Spicetify.Player.data?.item.metadata.image_url;
    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
    const CurrentSongArtist = Spicetify.Player.data?.item.artists[0].uri;
    const CurrentSongUri = Spicetify.Player.data?.item.uri;

    if (lowQModeEnabled) {
        try {
            currentImgCover = await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
        } catch (error) {
            console.error("Error happened while trying to set the Low Quality Mode Dynamic Background", error)
        }
    }
    
    if (element?.querySelector(".spicy-dynamic-bg")) {
        element.querySelector(".spicy-dynamic-bg").remove();
    }
    

    if (lowQModeEnabled) {
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