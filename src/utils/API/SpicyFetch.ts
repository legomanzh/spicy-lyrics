import Defaults from "../../components/Global/Defaults";
import Platform from "../../components/Global/Platform";
import storage from "../storage";

export default async function SpicyFetch(path: string): Promise<Response> {
    return new Promise(async (resolve, reject) => {
        const lyricsApi = storage.get("customLyricsApi") ?? Defaults.lyrics.api.url;
        const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.lyrics.api.accessToken;
        const url = `${lyricsApi}/${path}`

        const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();
        
        fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${SpotifyAccessToken}`,
                "access-token": lyricsAccessToken
            }
        }).then(CheckForErrors)
        .then(res => {
            resolve(res)
        }).catch(err => {
            reject(err)
        });
    });
}

let ENDPOINT_DISABLEMENT_Shown = false;

async function CheckForErrors(res) {
    if (res.status === 500) {
        const TEXT = await res.text();
        if (TEXT.includes(`{"`)) {
            const data = JSON.parse(TEXT);
            if (data.type === "ENDPOINT_DISABLEMENT") {
                if (ENDPOINT_DISABLEMENT_Shown) return;
                Spicetify.PopupModal.display({
                    title: "Endpoint Disabled",
                    content: `
                        <div>
                            <p>The endpoint you're trying to access is disabled.</p><br>
                            <p>This could mean a few things:</p><br>
                            <ul>
                                <li>Maintenace on the API</li>
                                <li>A Critical Issue</li>
                                <li>A quick Disablement of the Endpoint</li>
                            </ul><br><br>
                            <p>Is this problem persists, contact us on Github: <a href="https://github.com/spikenew7774/spicy-lyrics/" target="_blank" style="text-decoration:underline;">https://github.com/spikenew7774/spicy-lyrics</a>
                            ,<br> Or at <b>spikerko@spikerko.org</b></p>
                            <h3>Thanks!</h3>
                        </div>
                    `
                })
                ENDPOINT_DISABLEMENT_Shown = true;
            }
        }
    }
    return res;
}