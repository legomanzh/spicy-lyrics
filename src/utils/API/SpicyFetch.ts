import { SpikyCache } from "@spikerko/web-modules/SpikyCache";
import Defaults from "../../components/Global/Defaults";
import Platform from "../../components/Global/Platform";
import storage from "../storage";

export let SpicyFetchCache = new SpikyCache({
    name: "SpicyFetch__Cache"
});

export default async function SpicyFetch(path: string, IsExternal: boolean = false, cache: boolean = false, cosmos: boolean = false): Promise<Response | any> {
    return new Promise(async (resolve, reject) => {
        const lyricsApi = storage.get("customLyricsApi") ?? Defaults.lyrics.api.url;
        const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.lyrics.api.accessToken;
        const url = IsExternal ? path : `${lyricsApi}/${path}`;

        const CachedContent = await GetCachedContent(url);
        if (CachedContent) {
            resolve(CachedContent);
            return;
        }

        const SpotifyAccessToken = await Platform.GetSpotifyAccessToken();
        
        if (cosmos) {
            Spicetify.CosmosAsync.get(url)
                .then(CheckForErrors)
                .then(async res => {
                    if (cache) {
                        await CacheContent(url, res, 604800000);
                    }
                    resolve(res)
                }).catch(err => {
                    reject(err)
                });
        } else {
            fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${SpotifyAccessToken}`,
                    "access-token": lyricsAccessToken
                }
            }).then(CheckForErrors)
            .then(async res => {
                if (cache) {
                    await CacheContent(url, res, 604800000);
                }
                resolve(res)
            }).catch(err => {
                reject(err)
            });
        }
    });
}

async function CacheContent(key, data, expirationTtl: number) {
    try {
        const expiresIn = Date.now() + expirationTtl;
        const processedKey = await SpicyHasher.md5(key);
        
        await SpicyFetchCache.set(processedKey, {
            Content: data,
            expiresIn
        });
    } catch (error) {
        await SpicyFetchCache.destroy();
    }
}

async function GetCachedContent(key) {
    const processedKey = await SpicyHasher.md5(key);
    const content = await SpicyFetchCache.get(processedKey);
    if (content) {
        if (content.expiresIn > Date.now()) {
            return content.Content;
        } else {
            await SpicyFetchCache.remove(key);
            return null;
        }
    }
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