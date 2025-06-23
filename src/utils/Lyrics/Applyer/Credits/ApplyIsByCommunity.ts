

export function ApplyIsByCommunity(data: "spt" | "spl" | "aml" | undefined, LyricsContainer: HTMLElement): void {
    if (!data || !LyricsContainer) return;

    if (data !== "spl") return;

    const IsByCommunityElement = document.createElement("div");
    IsByCommunityElement.classList.add("IsByCommunity");

    IsByCommunityElement.textContent = `These lyrics have been provided by our community`;
    LyricsContainer.appendChild(IsByCommunityElement);
}