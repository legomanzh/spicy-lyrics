export default function GetHeaderUrl(data: any) {
    const HeaderImage = data?.Visuals?.headerImage?.sources[0]?.url as string
    console.log(HeaderImage,data)
    if (!HeaderImage) return Spicetify.Player.data?.item.metadata.image_xlarge_url || null;
    return `spotify:image:${HeaderImage.replace("https://i.scdn.co/image/", "")}`;
}