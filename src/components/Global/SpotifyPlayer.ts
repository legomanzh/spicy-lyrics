import GetProgress from "../../utils/Gets/GetProgress";

type ArtworkSize = "s" | "l" | "xl" | "S" | "L" | "XL" | null;

export const SpotifyPlayer = {
    IsPlaying: false,
    GetTrackPosition: GetProgress,
    Seek: (position: number) => {
        Spicetify.Player.origin.seekTo(position);
    },
    Artwork: {
        Get: (size: ArtworkSize): string => {
            const psize = size?.toLowerCase() ?? null;
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
    }
}