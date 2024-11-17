import Defaults from "../components/Defaults";
import storage from "./storage";

// Currently Unused

export default async function hasLyrics(uri: string) {
    const trackId = uri.split(":")[2];

    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.add("active");
    }

    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
    }

    const lyricsApi = storage.get("customLyricsApi") ?? Defaults.lyrics.api.url;
    const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.lyrics.api.accessToken;

    try {
        const req = await fetch(`${lyricsApi?.replace("{SPOTIFY_ID}", `has/${trackId}`)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${Spicetify.Platform.Session.accessToken}`,
                "access-token": lyricsAccessToken
            }
        });

        if (req.status !== 200) {
            return false;
        }

        const data = await req.json();

        if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
        }

        if (data.exists) {
            return true;
        }

        return false;

    } catch (error) {
        if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
        }
        return false;
    }
}