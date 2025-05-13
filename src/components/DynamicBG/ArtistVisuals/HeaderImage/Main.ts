import SpicyFetch from "../../../../utils/API/SpicyFetch";
import Defaults from "../../../Global/Defaults";
import { SpotifyPlayer } from "../../../Global/SpotifyPlayer";
import ArtistVisuals from "../Main";
import GetHeaderUrl from "./GetHeaderUrl";

// Track ongoing fetches
const isFetching = new Map();

export default async function ApplyContent(ArtistId: string, TrackId: string): Promise<string | undefined> {
    if (!TrackId) throw new Error("Invalid Song Id");
    if (Defaults.StaticBackgroundType === "Cover Art") return SpotifyPlayer.GetCover("xlarge") ?? undefined;
    if (!ArtistId) throw new Error("Invalid Song Artist");
    if (!TrackId || !ArtistId) throw new Error("Invalid URIs");
    const Cached: any = await ArtistVisuals.CacheStore.GetItem(ArtistId);

    if (Cached) {
        if (Cached.Result) {
            return GetHeaderUrl(Cached.Result);
        }
    }

    return Continue();

    async function Continue() {
        // Check if we're already fetching this track
        if (isFetching.has(ArtistId)) {
            return isFetching.get(ArtistId);
        }
        
        // Create the fetch promise
        const fetchPromise = (async () => {
            try {
                const [res, status] = await SpicyFetch(`artist/visuals?artist=spotify:artist:${ArtistId}&track=spotify:track:${TrackId}`);
                if (status === 200) {
                    await ArtistVisuals.CacheStore.SetItem(ArtistId, {
                        Result: res ?? "",
                    });
                    return GetHeaderUrl(res ?? "");
                } else {
                    throw new Error(`Failed to fetch visuals: ${status}`);
                }
            } finally {
                // Clean up the map entry when done
                isFetching.delete(ArtistId);
            }
        })();
        
        // Store the promise
        isFetching.set(ArtistId, fetchPromise);
        
        return fetchPromise;
    }
}