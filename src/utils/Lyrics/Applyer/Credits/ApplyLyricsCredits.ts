interface LyricsData {
    SongWriters?: string[];
    Type?: string;
    Content?: any;
    classes?: string;
    styles?: Record<string, string>;
}

export function ApplyLyricsCredits(data: LyricsData): void {
    const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (!data?.SongWriters || !LyricsContainer) return;

    const CreditsElement = document.createElement("div");
    CreditsElement.classList.add("Credits");

    const SongWriters = data.SongWriters.join(", ");
    CreditsElement.textContent = `Credits: ${SongWriters}`;
    LyricsContainer.appendChild(CreditsElement);
}