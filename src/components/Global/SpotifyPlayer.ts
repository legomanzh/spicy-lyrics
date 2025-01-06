import SpicyFetch from "../../utils/API/SpicyFetch";
import GetProgress, { _DEPRECATED___GetProgress } from "../../utils/Gets/GetProgress";

type ArtworkSize = "s" | "l" | "xl" | "d";

export const SpotifyPlayer = {
    IsPlaying: false,
    GetTrackPosition: GetProgress,
    Seek: (position: number) => {
        Spicetify.Player.origin.seekTo(position);
    },
    Artwork: {
        Get: (size: ArtworkSize): string => {
            const psize = (size === "d" ? null : (size?.toLowerCase() ?? null));
            switch (psize) {
                case "s":
                    return Spicetify.Player.data.item.metadata.image_small_url;
                case "l":
                    return Spicetify.Player.data.item.metadata.image_large_url;
                case "xl":
                    return Spicetify.Player.data.item.metadata.image_xlarge_url;
                default:
                    return Spicetify.Player.data.item.metadata.image_url;
            }
        }
    },
    GetSongName: (): string => {
        return Spicetify.Player.data.item.metadata.title;
    },
    GetAlbumName: (): string => {
        return Spicetify.Player.data.item.metadata.album_title;
    },
    GetSongId: (): string => {
        return Spicetify.Player.data.item.uri?.split(":")[2] ?? null;
    },
    GetArtists: async (): Promise<string[]> => {
        const data = await SpicyFetch(`https://api.spotify.com/v1/tracks/${SpotifyPlayer.GetSongId()}`, true, true, true)//await Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${SpotifyPlayer.GetSongId()}`);
        return data?.artists?.map(a => a.name) ?? [];
    },
    JoinArtists: (artists: string[]): string => {
        return artists?.join(", ") ?? null;
    },
    IsPodcast: false,
    _DEPRECATED_: {
        GetTrackPosition: _DEPRECATED___GetProgress
    }
}