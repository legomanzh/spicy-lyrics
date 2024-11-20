import { SpikyCache } from "@spikerko/web-modules/SpikyCache";
import storage from "./storage";
import { runLiiInt, stopLyricsInInt } from "./lyrics";
import Defaults from "../components/Defaults";

export const lyricsCache = new SpikyCache({
    name: "SpikyCache_Spicy_Lyrics"
})

export default async function fetchLyrics(uri: string) {
    if (!document.querySelector("#LyricsPageContainer")) return;

    stopLyricsInInt();
    runLiiInt();

    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").classList.contains("offline")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").classList.remove("offline");
    }


    const currFetching = storage.get("currentlyFetching");
    if (currFetching == "true") return;

    storage.set("currentlyFetching", "true");
    

    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
    }

    // I'm not sure if this will entirely work, because in my country the Spotify DJ isn't available. So if anybody finds out that this doesn't work, please let me know.
    if (Spicetify.Player.data.item.type === "unknown" && Spicetify.Player.data.item.provider.startsWith("narration")) return DJMessage(); 

    const trackId = uri.split(":")[2];
    
    // Check if there's already data in localStorage
    const savedLyricsData = storage.get("currentLyricsData");

    if (savedLyricsData) {
        try {
            const lyricsData = JSON.parse(savedLyricsData);
            // Return the stored lyrics if the ID matches the track ID
            if (lyricsData?.id === trackId) {
                storage.set("currentlyFetching", "false");
                if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
                    document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
                }
                if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
                    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
                }
                if (lyricsData.Type === "Static") stopLyricsInInt();
                return lyricsData;
            }
        } catch (error) {
            console.error("Error parsing saved lyrics data:", error);
            storage.set("currentlyFetching", "false");
            if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
                document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
            }
            if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
                document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
            }
        }
    }


    if (lyricsCache) {
        try {
            const lyricsFromCache = await lyricsCache.get(trackId);
            if (lyricsFromCache) {
                if (navigator.onLine && lyricsFromCache?.expiresAt < new Date().getTime()) {
                    await lyricsCache.remove(trackId);
                } else {
                    storage.set("currentLyricsData", JSON.stringify(lyricsFromCache));
                    storage.set("currentlyFetching", "false");
                    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
                        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
                    }
                    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
                        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
                    }
                    if (lyricsFromCache.Type === "Static") stopLyricsInInt();
                    return { ...lyricsFromCache, fromCache: true };
                }
            }
        } catch (error) {
            if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
                document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
            }
            console.log("Error parsing saved lyrics data:", error);
            return noLyricsMessage();
        }
    }

    if (!navigator.onLine) return urOfflineMessage();

    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.add("active");
    }


    // Fetch new lyrics if no match in localStorage
    const lyricsApi = storage.get("customLyricsApi") ?? Defaults.lyrics.api.url;
    const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.lyrics.api.accessToken;

    try {
        const response = await fetch(`${lyricsApi?.replace("{SPOTIFY_ID}", trackId)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${Spicetify.Platform.Session.accessToken}`,
                "access-token": lyricsAccessToken
            }
        });

        if (response.status !== 200) {
            if (response.status === 401) {
                storage.set("currentlyFetching", "false");
               //fetchLyrics(uri);
                window.location.reload();
                return;
            }
            if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
                document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
            }
            return noLyricsMessage();
        }

        const lyricsText = await response.text();

        if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
        }

        if (lyricsText === "") return noLyricsMessage();

        const lyricsJson = JSON.parse(lyricsText);

        // Store the new lyrics in localStorage
        storage.set("currentLyricsData", JSON.stringify(lyricsJson));

        storage.set("currentlyFetching", "false");

        if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
        }

        if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
        }

        if (lyricsCache) {
            const expiresAt = new Date().getTime() + 1000 * 60 * 60 * 24 * 7; // Expire after 7 days

            try {
                await lyricsCache.set(trackId, {
                    ...lyricsJson,
                    expiresAt
                });
            } catch (error) {
                console.error("Error saving lyrics to cache:", error);
            }
        }

        if (lyricsJson.Type === "Static") stopLyricsInInt();

        return { ...lyricsJson, fromCache: false };
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        storage.set("currentlyFetching", "false");
        if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
            document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
        }
        return noLyricsMessage();
    }
    
}


function noLyricsMessage() {
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

    const noLyricsMessage = {
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
    }
    

    storage.set("currentLyricsData", JSON.stringify(noLyricsMessage));

    storage.set("currentlyFetching", "false");

    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
    }

    stopLyricsInInt();

    return noLyricsMessage;
}

function urOfflineMessage() {
    const Message = {
        Type: "Static",
        alternative_api: false,
        offline: true,
        Lines: [
            {
                Text: "You're offline"
            },
            {
                Text: ""
            },
            {
                Text: "[DEF=font_size:small]This extension works only if you're online."
            }
        ]
    };
    

    storage.set("currentlyFetching", "false");

    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
    }

    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
    }

    stopLyricsInInt();

    return Message;
}

function DJMessage() {
    const Message = {
        Type: "Static",
        alternative_api: false,
        styles: {
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "flex-direction": "column"
        },
        Lines: [
            {
                Text: "DJ Mode is On"
            },
            {
                Text: ""
            },
            {
                Text: "[DEF=font_size:small]If you want to load lyrics, please select a Song."
            }
        ]
    };
    

    storage.set("currentlyFetching", "false");

    if (document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .loaderContainer").classList.remove("active");
    }

    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) {
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").innerHTML = "";
    }

    stopLyricsInInt();

    return Message;
}