import { Spicetify } from "@spicetify/bundler";
import { GetExpireStore } from "@spikerko/tools/Cache";
import Defaults from "../../components/Global/Defaults.ts";
import Platform from "../../components/Global/Platform.ts";
import { SpotifyPlayer } from "../../components/Global/SpotifyPlayer.ts";
import PageView from "../../components/Pages/PageView.ts";
import { IsCompactMode } from "../../components/Utils/CompactMode.ts";
import Fullscreen from "../../components/Utils/Fullscreen.ts";
import { SendJob } from "../API/SendJob.ts";
import { SetWaitingForHeight } from "../Scrolling/ScrollToActiveLine.ts";
import storage from "../storage.ts";
import { ProcessLyrics } from "./ProcessLyrics.ts";
import { getLrclibLyrics } from "../../providers/lrclib";

export const LyricsStore = GetExpireStore<any>("SpicyLyrics_LyricsStore", 10, {
  Unit: "Days",
  Duration: 3,
});

export default async function fetchLyrics(uri: string) {
  const IsSpicyRenderer = Defaults.LyricsRenderer === "Spicy";

  //if (!document.querySelector("#SpicyLyricsPage")) return;
  const LyricsContent =
    document.querySelector("#SpicyLyricsPage .LyricsContainer .LyricsContent") ?? undefined;
  if (LyricsContent?.classList.contains("offline")) {
    LyricsContent.classList.remove("offline");
  }

  //if (!Fullscreen.IsOpen) PageView.AppendViewControls(true);

  if (SpotifyPlayer.IsDJ()) return DJMessage();

  if (
    Spicetify.Player.data?.item?.mediaType &&
    Spicetify.Player.data?.item?.mediaType !== "audio"
  ) {
    return NotTrackMessage();
  }

  const IsSomethingElseThanTrack = SpotifyPlayer.GetContentType() !== "track";
  if (IsSomethingElseThanTrack) {
    return NotTrackMessage();
  }

  const currFetching = storage.get("currentlyFetching");
  if (currFetching === "true") return;

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
            document
              .querySelector("#SpicyLyricsPage")
              ?.classList.add("Lyrics_RomanizationAvailable");
          } else {
            document
              .querySelector("#SpicyLyricsPage")
              ?.classList.remove("Lyrics_RomanizationAvailable");
          }

          storage.set("currentlyFetching", "false");
          HideLoaderContainer();
          Defaults.CurrentLyricsType = lyricsData.Type;
          document
            .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")
            ?.classList.remove("LyricsHidden");
          document
            .querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")
            ?.classList.remove("Hidden");
          PageView.AppendViewControls(true);
          return lyricsData;
        }
      }
    } catch (error) {
      console.error("Error parsing saved lyrics data:", error);
      storage.set("currentlyFetching", "false");
      HideLoaderContainer();
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
          document.querySelector("#SpicyLyricsPage")?.classList.add("Lyrics_RomanizationAvailable");
        } else {
          document
            .querySelector("#SpicyLyricsPage")
            ?.classList.remove("Lyrics_RomanizationAvailable");
        }

        storage.set("currentLyricsData", JSON.stringify(lyricsFromCache));
        storage.set("currentlyFetching", "false");
        HideLoaderContainer();
        Defaults.CurrentLyricsType = lyricsFromCache.Type;
        document
          .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")
          ?.classList.remove("LyricsHidden");
        document
          .querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")
          ?.classList.remove("Hidden");
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

  ShowLoaderContainer();

  // Fetch new lyrics if no match in localStorage
  /* const lyricsApi = storage.get("customLyricsApi") ?? Defaults.LyricsContent.api.url;
    const lyricsAccessToken = storage.get("lyricsApiAccessToken") ?? Defaults.LyricsContent.api.accessToken; */

  try {
    const Token = await Platform.GetSpotifyAccessToken();

    let lyricsText = "";
    let status = 0;

    const jobs = await SendJob(
      [
        {
          handler: "LYRICS_ID",
          args: {
            id: trackId,
            auth: "SpicyLyrics-WebAuth",
          },
        },
      ],
      {
        "SpicyLyrics-WebAuth": `Bearer ${Token}`,
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
  // Try LRCLIB as a fallback before giving up
  const lrclibLyrics = await getLrclibLyrics({
    artist: Spicetify.Player.data?.item?.artists?.[0]?.name,
    track: Spicetify.Player.data?.item?.name,
    durationMs: Spicetify.Player.getDuration(),
    id: trackId,
  });

  if (lrclibLyrics) {
    IsSpicyRenderer ? await ProcessLyrics(lrclibLyrics) : null;
    storage.set("currentLyricsData", JSON.stringify(lrclibLyrics));
    storage.set("currentlyFetching", "false");
    HideLoaderContainer();

    if (LyricsStore) {
      try {
        await LyricsStore.SetItem(trackId, lrclibLyrics);
      } catch (error) {
        console.error("Error saving lyrics to cache:", error);
      }
    }

    Defaults.CurrentLyricsType = lrclibLyrics.Type ?? "Static";
    document
      .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")
      ?.classList.remove("LyricsHidden");
    document
      .querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")
      ?.classList.remove("Hidden");
    PageView.AppendViewControls(true);
    return { ...lrclibLyrics, fromCache: false };
  }

  // No LRCLIB result either → fall back to no lyrics
  return await noLyricsMessage(false, true);
}


    if (lyricsText === null) return await noLyricsMessage(false, false);
    if (lyricsText === "") return await noLyricsMessage(false, true);

    // const providerLyrics = JSON.parse(lyricsText);
    const lyrics = JSON.parse(lyricsText);

    IsSpicyRenderer ? await ProcessLyrics(lyrics) : null;

    storage.set("currentLyricsData", JSON.stringify(lyrics));
    storage.set("currentlyFetching", "false");

    HideLoaderContainer();

    if (LyricsStore) {
      try {
        await LyricsStore.SetItem(trackId, lyrics);
      } catch (error) {
        console.error("Error saving lyrics to cache:", error);
      }
    }

    Defaults.CurrentLyricsType = lyrics.Type;
    document
      .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")
      ?.classList.remove("LyricsHidden");
    document
      .querySelector("#SpicyLyricsPage .ContentBox .LyricsContainer")
      ?.classList.remove("Hidden");
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
  const trackId = SpotifyPlayer.GetId() ?? "";

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

  HideLoaderContainer();

  Defaults.CurrentLyricsType = "Static";

  if (!IsCompactMode() && (Fullscreen.IsOpen || Fullscreen.CinemaViewOpen)) {
    document
      .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox .LyricsContainer")
      ?.classList.add("Hidden");
    document
      .querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox")
      ?.classList.add("LyricsHidden");
  }

  ClearLyricsPageContainer();
  PageView.AppendViewControls(true);

  return {
    Type: "Static",
    id: SpotifyPlayer.GetId() ?? "",
    noLyrics: true,
    Lines: [
      {
        Text: "No Lyrics Found",
      },
    ],
  };
}

function urOfflineMessage() {
  const Message = {
    Type: "Static",
    offline: true,
    Lines: [
      {
        Text: "You're offline",
      },
      {
        Text: "This extension works only if you're online.",
      },
    ],
  };

  SetWaitingForHeight(false);

  storage.set("currentlyFetching", "false");

  HideLoaderContainer();

  ClearLyricsPageContainer();

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
        Text: "DJ Mode is On",
      },
      {
        Text: "If you want to load lyrics, please select a Song.",
      },
    ],
  };

  SetWaitingForHeight(false);

  storage.set("currentlyFetching", "false");

  HideLoaderContainer();

  ClearLyricsPageContainer();

  Defaults.CurrentLyricsType = Message.Type;
  PageView.AppendViewControls(true);
  return Message;
}

function NotTrackMessage() {
  const Message = {
    Type: "Static",
    Lines: [
      {
        Text: "[DEF=font_size:small]You're playing an unsupported Content Type",
      },
    ],
  };

  SetWaitingForHeight(false);

  storage.set("currentlyFetching", "false");

  HideLoaderContainer();

  ClearLyricsPageContainer();
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
  const loaderContainer = document.querySelector<HTMLElement>(
    "#SpicyLyricsPage .LyricsContainer .loaderContainer"
  );
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
  const loaderContainer = document.querySelector<HTMLElement>(
    "#SpicyLyricsPage .LyricsContainer .loaderContainer"
  );
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
  const lyricsContent = document.querySelector<HTMLElement>(
    "#SpicyLyricsPage .LyricsContainer .LyricsContent"
  );
  if (lyricsContent) {
    lyricsContent.innerHTML = "";
  }
}
