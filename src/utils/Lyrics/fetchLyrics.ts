import { GetExpireStore } from "@spikerko/tools/Cache";
import storage from "../storage";
import Defaults from "../../components/Global/Defaults";
import PageView from "../../components/Pages/PageView";
import { SendJob } from "../API/SendJob";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer";
import { IsCompactMode } from "../../components/Utils/CompactMode";
import Fullscreen from "../../components/Utils/Fullscreen";
import { SetWaitingForHeight } from "../Scrolling/ScrollToActiveLine";
import Platform from "../../components/Global/Platform";
// @ts-ignore
import Kuroshiro from "kuroshiro";
import * as KuromojiAnalyzer from "./KuromojiAnalyzer"
import { franc } from "franc-all";
import Aromanize from "./Aromanize"
import pinyin from "pinyin";
import langs from "langs";
import cyrillicToLatin from 'cyrillic-romanization';
// @ts-ignore
import greekRomanization from "./GreekRomanization.js"

export const LyricsStore = GetExpireStore<any>(
    "SpicyLyrics_LyricsStore",
    8,
    {
        Unit: "Days",
        Duration: 3
    }
)

// Constants
const RomajiConverter = new Kuroshiro()
const RomajiPromise = RomajiConverter.init(KuromojiAnalyzer);

const KoreanTextTest = /[\uac00-\ud7af]|[\u1100-\u11ff]|[\u3130-\u318f]|[\ua960-\ua97f]|[\ud7b0-\ud7ff]/;
const ChineseTextText = /([\u4E00-\u9FFF])/;
const JapaneseTextText = /([ぁ-んァ-ン])/;

// Cyrillic (basic + supplements + extended)
const CyrillicTextTest = /[\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F]/;

// Greek (Basic + Extended)
const GreekTextTest = /[\u0370-\u03FF\u1F00-\u1FFF]/;

const RomanizeKorean = async (lyricMetadata: any, primaryLanguage: string) => {
    if ((primaryLanguage === "kor") || KoreanTextTest.test(lyricMetadata.Text)) {
        lyricMetadata.RomanizedText = Aromanize(lyricMetadata.Text, "RevisedRomanizationTransliteration");
    }
}

const RomanizeChinese = async (lyricMetadata: any, primaryLanguage: string) => {
    if ((primaryLanguage === "cmn") || ChineseTextText.test(lyricMetadata.Text)) {
        const result = pinyin(
            lyricMetadata.Text,
            {
                segment: false,
                group: true
            }
        )

        lyricMetadata.RomanizedText = result.join("-");
	}
}

const RomanizeJapanese = async (lyricMetadata: any, primaryLanguage: string) => {
	if ((primaryLanguage === "jpn") || JapaneseTextText.test(lyricMetadata.Text)) {
        await RomajiPromise;

        const result = await RomajiConverter.convert(
            lyricMetadata.Text,
            {
                to: "romaji",
                mode: "spaced"
            }
        )

        lyricMetadata.RomanizedText = result
	}
}

const RomanizeCyrillic = async (lyricMetadata: any, primaryLanguage: string, iso2Lang: string) => {
    if ((
        primaryLanguage === "bel" ||
        primaryLanguage === "bul" ||
        primaryLanguage === "kaz" ||
        iso2Lang === "ky" ||
        primaryLanguage === "mkd" ||
        iso2Lang === "mn" ||
        primaryLanguage === "rus" ||
        primaryLanguage === "srp" ||
        primaryLanguage === "tgk" ||
        primaryLanguage === "ukr"
    ) || CyrillicTextTest.test(lyricMetadata.Text)) {
        const result = cyrillicToLatin(lyricMetadata.Text);
        if (result != null) {
            lyricMetadata.RomanizedText = result;
        }
    }
}

const RomanizeGreek = async (lyricMetadata: any, primaryLanguage: string) => {
    if ((primaryLanguage === "ell") || GreekTextTest.test(lyricMetadata.Text)) {
        const result = greekRomanization(lyricMetadata.Text);
        if (result != null) {
            lyricMetadata.RomanizedText = result;
        }
    }
}

const Romanize = async (lyricMetadata: any, rootInformation: any): Promise<string | undefined> => {
    const primaryLanguage = rootInformation.Language;
    const iso2Language = rootInformation.LanguageISO2;
    if ((primaryLanguage === "jpn") || JapaneseTextText.test(lyricMetadata.Text)) {
        await RomanizeJapanese(lyricMetadata, primaryLanguage);
        rootInformation.IncludesRomanization = true;
        return "Japanese"
    } else if ((primaryLanguage === "cmn") || ChineseTextText.test(lyricMetadata.Text)) {
        await RomanizeChinese(lyricMetadata, primaryLanguage);
        rootInformation.IncludesRomanization = true;
        return "Chinese"
    } else if ((primaryLanguage === "kor") || KoreanTextTest.test(lyricMetadata.Text)) {
        await RomanizeKorean(lyricMetadata, primaryLanguage);
        rootInformation.IncludesRomanization = true;
        return "Korean"
    } else if ((
        primaryLanguage === "bel" ||
        primaryLanguage === "bul" ||
        primaryLanguage === "kaz" ||
        iso2Language === "ky" ||
        primaryLanguage === "mkd" ||
        iso2Language === "mn" ||
        primaryLanguage === "rus" ||
        primaryLanguage === "srp" ||
        primaryLanguage === "tgk" ||
        primaryLanguage === "ukr"
    ) || CyrillicTextTest.test(lyricMetadata.Text)) {
        await RomanizeCyrillic(lyricMetadata, primaryLanguage, iso2Language);
        rootInformation.IncludesRomanization = true;
        return "Cyrillic"
    } else if ((primaryLanguage === "ell") || GreekTextTest.test(lyricMetadata.Text)) {
        await RomanizeGreek(lyricMetadata, primaryLanguage);
        rootInformation.IncludesRomanization = true;
        return "Greek"
    } else {
        rootInformation.IncludesRomanization = false;
        return undefined
    }
}

export default async function fetchLyrics(uri: string) {
    //if (!document.querySelector("#SpicyLyricsPage")) return;
    const LyricsContent = document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent") ?? undefined;
    if (LyricsContent?.classList.contains("offline")) {
        LyricsContent.classList.remove("offline");
    }

    //if (!Fullscreen.IsOpen) PageView.AppendViewControls(true);

    if (
        SpotifyPlayer.IsDJ()   
    ) return DJMessage();

    if (Spicetify.Player.data?.item?.mediaType && Spicetify.Player.data?.item?.mediaType !== "audio") {
        return NotTrackMessage()
    };

    const IsSomethingElseThanTrack = SpotifyPlayer.GetContentType() !== "track";
    if (IsSomethingElseThanTrack) {
        return NotTrackMessage();
    }

    const currFetching = storage.get("currentlyFetching");
    if (currFetching == "true") return;

    storage.set("currentlyFetching", "true");

    if (LyricsContent) {
        LyricsContent.classList.add("HiddenTransitioned");
    }

    const trackId = uri.split(":")[2];

    // Check if there's already data in localStorage
    const savedLyricsData = storage.get("currentLyricsData")?.toString();

    if (savedLyricsData) {
        try {
            if (savedLyricsData.includes("NO_LYRICS")) {
                const split = savedLyricsData.split(":");
                const id = split[1];
                if (id === trackId) {
                    return await noLyricsMessage(false, true);
                }
            } else {
                const lyricsData = JSON.parse(savedLyricsData);
                // Return the stored lyrics if the ID matches the track ID
                if (lyricsData?.id === trackId) {

                    if (lyricsData?.IncludesRomanization) {
                        document.querySelector("#SpicyLyricsPage")?.classList.add("Lyrics_RomanizationAvailable")
                    } else {
                        document.querySelector("#SpicyLyricsPage")?.classList.remove("Lyrics_RomanizationAvailable")
                    }

                    storage.set("currentlyFetching", "false");
                    HideLoaderContainer()
                    Defaults.CurrentLyricsType = lyricsData.Type;
                    document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
                    document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
                    PageView.AppendViewControls(true);
                    return lyricsData;
                }
            }
        } catch (error) {
            console.error("Error parsing saved lyrics data:", error);
            storage.set("currentlyFetching", "false");
            HideLoaderContainer()
        }
    }


    if (LyricsStore) {
        try {
            const lyricsFromCacheRes = await LyricsStore.GetItem(trackId);
            if (lyricsFromCacheRes) {
                if (lyricsFromCacheRes?.Value === "NO_LYRICS") {
                    return await noLyricsMessage(false, true);
                }
                const lyricsFromCache = lyricsFromCacheRes ?? {};

                if (lyricsFromCache?.IncludesRomanization) {
                    document.querySelector("#SpicyLyricsPage")?.classList.add("Lyrics_RomanizationAvailable")
                } else {
                    document.querySelector("#SpicyLyricsPage")?.classList.remove("Lyrics_RomanizationAvailable")
                }

                storage.set("currentLyricsData", JSON.stringify(lyricsFromCache));
                storage.set("currentlyFetching", "false");
                HideLoaderContainer()
                Defaults.CurrentLyricsType = lyricsFromCache.Type;
                document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
                document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
                PageView.AppendViewControls(true);
                return { ...lyricsFromCache, fromCache: true };
            }
        } catch (error) {
            console.error("Error parsing saved lyrics data:", error);
            return await noLyricsMessage(false, true);
        }
    }

    SetWaitingForHeight(false);

    if (!navigator.onLine) return urOfflineMessage();

    ShowLoaderContainer()


    // Fetch new lyrics if no match in localStorage
    /* const lyricsApi = storage.get("customLyricsApi") ?? Defaults.LyricsContent.api.url;
    const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.LyricsContent.api.accessToken; */


    try {
        const Token = await Platform.GetSpotifyAccessToken();
        
        let lyricsText = "";
        let status = 0;

        const jobs = await SendJob([{
            handler: "LYRICS_ID",
            args: {
                id: trackId,
                auth: "SpicyLyrics-WebAuth"
            }
        }],
            {
                "SpicyLyrics-WebAuth": `Bearer ${Token}`
            }
        );

        const lyricsJob = jobs.get("LYRICS_ID");
        if (!lyricsJob) {
            console.error("Lyrics job not found");
            return await noLyricsMessage(false, true);
        }

        status = lyricsJob.status;

        if (lyricsJob.type !== "json") {
            lyricsText = "";
        }

        lyricsText = JSON.stringify(lyricsJob.responseData);

        if (status !== 200) {
            if (status === 500) return await noLyricsMessage(false, true);
            if (status === 401) {
                storage.set("currentlyFetching", "false");
               //fetchLyrics(uri);
                //window.location.reload();
                return await noLyricsMessage(false, false);
            }

            if (status === 404) {
                return await noLyricsMessage(false, true);
            }
            return await noLyricsMessage(false, true);
        }



        if (lyricsText === null) return await noLyricsMessage(false, false);
        if (lyricsText === "") return await noLyricsMessage(false, true);

        // const providerLyrics = JSON.parse(lyricsText);
        const lyrics = JSON.parse(lyricsText);
        // Romanization
        {
            const romanizationPromises: Promise<string | undefined>[] = []
            if (lyrics.Type === "Static") {
                {
                    let textToProcess = lyrics.Lines[0].Text
                    for (let index = 1; index < lyrics.Lines.length; index += 1) {
                        textToProcess += `\n${lyrics.Lines[index].Text}`
                    }
        
                    const language = franc(textToProcess);
                    const languageISO2 = langs.where('3', language)?.['1'];
        
                    lyrics.Language = language;
                    lyrics.LanguageISO2 = languageISO2;
                }
        
                for(const lyricMetadata of lyrics.Lines) {
                    romanizationPromises.push(Romanize(lyricMetadata, lyrics))
                }
            } else if (lyrics.Type === "Line") {
                {
                    const lines = []
                    for (const vocalGroup of lyrics.Content) {
                        if (vocalGroup.Type === "Vocal") {
                            lines.push(vocalGroup.Text)
                        }
                    }
                    const textToProcess = lines.join("\n") 
        
                    const language = franc(textToProcess);
                    const languageISO2 = langs.where('3', language)?.['1'];
        
                    lyrics.Language = language;
                    lyrics.LanguageISO2 = languageISO2;
                }
        
                for(const vocalGroup of lyrics.Content) {
                    if (vocalGroup.Type == "Vocal") {
                        romanizationPromises.push(Romanize(vocalGroup, lyrics))
                    }
                }
            } else if (lyrics.Type === "Syllable") {
                {
                    const lines = []
                    for (const vocalGroup of lyrics.Content) {
                        if (vocalGroup.Type === "Vocal") {
                            let text = vocalGroup.Lead.Syllables[0].Text
                            for (let index = 1; index < vocalGroup.Lead.Syllables.length; index += 1) {
                                const syllable = vocalGroup.Lead.Syllables[index]
                                text += `${syllable.IsPartOfWord ? "" : " "}${syllable.Text}`
                            }
        
                            lines.push(text)
                        }
                    }
                    const textToProcess = lines.join("\n") 
        
                    const language = franc(textToProcess);
                    const languageISO2 = langs.where('3', language)?.['1'];
        
                    lyrics.Language = language;
                    lyrics.LanguageISO2 = languageISO2;
                }
        
                for(const vocalGroup of lyrics.Content) {
                    if (vocalGroup.Type == "Vocal") {
                        for(const syllable of vocalGroup.Lead.Syllables) {
                            romanizationPromises.push(Romanize(syllable, lyrics))
                        }
        
                        if (vocalGroup.Background !== undefined) {
                            for(const syllable of vocalGroup.Background[0].Syllables) {
                                romanizationPromises.push(Romanize(syllable, lyrics))
                            }
                        }
                    }
                }
            }

            await Promise.all(romanizationPromises);
            if (lyrics.IncludesRomanization === true) {
                document.querySelector("#SpicyLyricsPage")?.classList.add("Lyrics_RomanizationAvailable")
            } else {
                document.querySelector("#SpicyLyricsPage")?.classList.remove("Lyrics_RomanizationAvailable")
            }
            
        }

        storage.set("currentLyricsData", JSON.stringify(lyrics));
        storage.set("currentlyFetching", "false");

        HideLoaderContainer()

        if (LyricsStore) {
            try {
                await LyricsStore.SetItem(trackId, lyrics);
            } catch (error) {
                console.error("Error saving lyrics to cache:", error);
            }
        }

        Defaults.CurrentLyricsType = lyrics.Type;
        document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.remove("LyricsHidden");
        document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.remove("Hidden");
        PageView.AppendViewControls(true);
        return { ...lyrics, fromCache: false };
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        storage.set("currentlyFetching", "false");

        return await noLyricsMessage(false, true);
    }

}


async function noLyricsMessage(Cache = true, LocalStorage = true) {
    /* const totalTime = Spicetify.Player.getDuration() / 1000;
    const segmentDuration = totalTime / 3;

    const noLyricsMessage = {
        "Type": "Syllable",
        "alternative_api": false,
        "Content": [
            {
                "Type": "Vocal",
                "OppositeAligned": false,
                "Lead": {
                    "Syllables": [
                        {
                            "Text": "We're working on the Lyrics...",
                            "StartTime": 0,
                            "EndTime": 10,
                            "IsPartOfWord": false
                        }
                    ],
                    "StartTime": 0,
                    "EndTime": 10
                }
            },
            {
                "Type": "Vocal",
                "OppositeAligned": false,
                "Lead": {
                    "Syllables": [
                        {
                            "Text": "♪",
                            "StartTime": 0,
                            "EndTime": segmentDuration,
                            "IsPartOfWord": true
                        },
                        {
                            "Text": "♪",
                            "StartTime": segmentDuration,
                            "EndTime": 2 * segmentDuration,
                            "IsPartOfWord": true
                        },
                        {
                            "Text": "♪",
                            "StartTime": 2 * segmentDuration,
                            "EndTime": totalTime,
                            "IsPartOfWord": false
                        }
                    ],
                    "StartTime": 0,
                    "EndTime": totalTime
                }
            }
        ]
    }; */

    /* const noLyricsMessage = {
        Type: "Static",
        alternative_api: false,
        offline: false,
        id: Spicetify.Player.data.item.uri.split(":")[2],
        styles: {
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "flex-direction": "column"
        },
        Lines: [
            {
                Text: "No Lyrics Found"
            }
        ]
    } */

    SetWaitingForHeight(false);
    const trackId = SpotifyPlayer.GetId() ?? '';

    if (LocalStorage) {
        storage.set("currentLyricsData", `NO_LYRICS:${trackId}`);
    }

    if (LyricsStore && Cache && trackId) {
        //const expiresAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; // Expire after 7 days

        try {
            await LyricsStore.SetItem(trackId, { Value: "NO_LYRICS" });
        } catch (error) {
            console.error("Error saving lyrics to cache:", error);
        }
    }

    storage.set("currentlyFetching", "false");

    HideLoaderContainer()

    Defaults.CurrentLyricsType = "Static";


    if (!(IsCompactMode()) && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
        document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .LyricsContainer")?.classList.add("Hidden");
        document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")?.classList.add("LyricsHidden");
    }


    ClearLyricsPageContainer()
    PageView.AppendViewControls(true);

    return {
        Type: "Static",
        id: SpotifyPlayer.GetId() ?? '',
        Lines: [
            {
                Text: "No Lyrics Found"
            }
        ]
    };
}

function urOfflineMessage() {
    const Message = {
        Type: "Static",
        offline: true,
        Lines: [
            {
                Text: "You're offline"
            },
            {
                Text: "This extension works only if you're online."
            }
        ]
    };

    SetWaitingForHeight(false);

    storage.set("currentlyFetching", "false");

    HideLoaderContainer()

    ClearLyricsPageContainer()


    Defaults.CurrentLyricsType = Message.Type;

    /* if (storage.get("IsNowBarOpen")) {
        document.querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer").classList.add("Hidden");
    } */
    PageView.AppendViewControls(true);
    return Message;
}

function DJMessage() {
    const Message = {
        Type: "Static",
        Lines: [
            {
                Text: "DJ Mode is On"
            },
            {
                Text: "If you want to load lyrics, please select a Song."
            }
        ]
    };


    SetWaitingForHeight(false);

    storage.set("currentlyFetching", "false");

    HideLoaderContainer()

    ClearLyricsPageContainer()

    Defaults.CurrentLyricsType = Message.Type;
    PageView.AppendViewControls(true);
    return Message;
}

function NotTrackMessage() {
    const Message = {
        Type: "Static",
        Lines: [
            {
                Text: "[DEF=font_size:small]You're playing an unsupported Content Type"
            }
        ]
    }

    SetWaitingForHeight(false);

    storage.set("currentlyFetching", "false");

    HideLoaderContainer()

    ClearLyricsPageContainer()
    // CloseNowBar()

    Defaults.CurrentLyricsType = Message.Type;
    PageView.AppendViewControls(true);
    return Message;
}

let ContainerShowLoaderTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Show the loader container after a delay
 */
function ShowLoaderContainer(): void {
    const loaderContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .loaderContainer");
    if (loaderContainer) {
        ContainerShowLoaderTimeout = setTimeout(() => {
            loaderContainer.classList.add("active");
        }, 2000);
    }
}

/**
 * Hide the loader container and clear any pending timeout
 */
function HideLoaderContainer(): void {
    const loaderContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .loaderContainer");
    if (loaderContainer) {
        if (ContainerShowLoaderTimeout) {
            clearTimeout(ContainerShowLoaderTimeout);
            ContainerShowLoaderTimeout = null;
        }
        loaderContainer.classList.remove("active");
    }
}

/**
 * Clear the lyrics container content
 */
export function ClearLyricsPageContainer(): void {
    const lyricsContent = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    if (lyricsContent) {
        lyricsContent.innerHTML = "";
    }
}