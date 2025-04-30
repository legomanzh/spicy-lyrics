import { SpotifyPlayer } from "../../../Global/SpotifyPlayer";

export default function GetHeaderUrl(data: any) {
    if (!data)
        return SpotifyPlayer.GetCover("xlarge") ?? undefined;

    const HeaderImage =
        typeof data === "object" ?
            data?.Visuals?.headerImage?.sources[0]?.url :
            JSON.parse(data)?.Visuals?.headerImage?.sources[0]?.url;

    if (!HeaderImage)
        return SpotifyPlayer.GetCover("xlarge") ?? undefined;
    
    return `spotify:image:${HeaderImage.replace("https://i.scdn.co/image/", "")}`;
}