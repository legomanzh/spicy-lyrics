import Defaults from "../../components/Global/Defaults";
import storage from "../storage";

export default async function SpicyFetch(path: string): Promise<Response> {
    return new Promise((resolve, reject) => {
        const lyricsApi = storage.get("customLyricsApi") ?? Defaults.lyrics.api.url;
        const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.lyrics.api.accessToken;
        const url = `https://${lyricsApi}/${path}`

        fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${Spicetify.Platform.Session.accessToken}`,
                "access-token": lyricsAccessToken
            }
        }).then(res => {
            resolve(res)
        }).catch(err => {
            reject(err)
        })
    });
}