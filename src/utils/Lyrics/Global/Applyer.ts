import storage from "../../storage";
import { setBlurringLastLine } from "../Animator/Lyrics/LyricsAnimator";
import { ApplyStaticLyrics, StaticLyricsData } from "../Applyer/Static";
import { ApplyLineLyrics } from "../Applyer/Synced/Line";
import { ApplySyllableLyrics } from "../Applyer/Synced/Syllable";
import { isRomanized } from "../lyrics";

/**
 * Union type for all lyrics data types
 */
export type LyricsData = {
    Type: 'Syllable' | 'Line' | 'Static' | string;
    [key: string]: any;
};

/**
 * Apply lyrics based on their type
 * @param lyrics - The lyrics data to apply
 */
export default function ApplyLyrics(lyrics: LyricsData | null | undefined): void {
    if (!document.querySelector("#SpicyLyricsPage")) return;
    setBlurringLastLine(null);
    if (!lyrics) return;

    const romanize = isRomanized;

    if (lyrics.Type === "Syllable") {
        ApplySyllableLyrics(lyrics as any, romanize);
    } else if (lyrics.Type === "Line") {
        ApplyLineLyrics(lyrics as any, romanize);
    } else if (lyrics.Type === "Static") {
        // Type assertion to StaticLyricsData since we've verified the Type is "Static"
        ApplyStaticLyrics(lyrics as StaticLyricsData, romanize);
    }
}