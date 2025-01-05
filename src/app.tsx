import { Timeout } from "@spikerko/web-modules/Scheduler";
import fetchLyrics from "./utils/Lyrics/fetchLyrics";
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import DisplayLyricsPage, { DestroyLyricsPage } from "./components/Pages/PageView";
import { Icons } from "./components/Styling/Icons";
import ApplyDynamicBackground, { LowQMode_SetDynamicBackground } from "./components/DynamicBG/dynamicBackground";
import LoadFonts from "./components/Styling/Fonts";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollToActiveLine } from "./utils/Scrolling/ScrollToActiveLine";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "./utils/Lyrics/Global/Applyer";
import { UpdateNowBar } from "./components/Utils/NowBar";
import { requestPositionSync } from "./utils/Gets/GetProgress";
// Currently Unused: import hasLyrics from "./functions/hasLyrics";

// CSS Imports
import "./css/default.css";
import "./css/Simplebar.css";
import "./css/ContentBox.css";
import "./css/DynamicBG/spicy-dynamic-bg.css"
import "./css/Lyrics/main.css"
import "./css/Lyrics/Mixed.css"
import "./css/Loaders/LoaderContainer.css"
import Global from "./components/Global/Global";
import Platform from "./components/Global/Platform";
import PostHog from "./utils/PostHog";
import Whentil from "./utils/Whentil";
import Session from "./components/Global/Session";

async function main() {
  await Platform.OnSpotifyReady;

  PostHog.Load();

  Spicetify.Platform.History.listen(PostHog.OnNavigate)
  
  // Lets set out the Settings Menu
  setSettingsMenu();

  const OldStyleFont = storage.get("old-style-font");
  if (OldStyleFont != "true") {
    LoadFonts();
  }

  const SpicyHasherElement = document.createElement("script");
  SpicyHasherElement.async = true;
  SpicyHasherElement.src = "https://storage.spicy-lyrics.spikerko.org/tools/spicy-hasher.js";
  document.head.appendChild(SpicyHasherElement);

  const Hometinue = () => {
    // Because somethimes the "syncedPositon" was unavailable, I'm putting this check here that checks if the Spicetify?.Platform?.PlaybackAPI is available (which is then used in SpotifyPlayer.GetTrackPosition())
    Whentil.When(() => Spicetify.Platform.PlaybackAPI, () => {
      requestPositionSync();
    })

    // Lets set out Dynamic Background (spicy-dynamic-bg) to the now playing bar
    let lastImgUrl;

    const button = new Spicetify.Playbar.Button(
      "Spicy Lyrics",
      Icons.LyricsPage,
      (self) => {
          if (!self.active) {
            Session.Navigate({ pathname: "/SpicyLyrics" });
            //self.active = true;
          } else {
            Session.GoBack();
            //self.active = false;
          }
      },
      false, // Whether the button is disabled.
      false, // Whether the button is active.
    );

    /* Spicetify.Player.addEventListener("songchange", (event) => {
        const cover = event.data.item.metadata.image_url;
        applyDynamicBackgroundToNowPlayingBar(cover)
    }); */

    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";

    function applyDynamicBackgroundToNowPlayingBar(coverUrl: string) {
      if (lowQModeEnabled) return;
      const nowPlayingBar = document.querySelector<HTMLElement>(".Root__right-sidebar aside.NowPlayingView");

      try {
        if (nowPlayingBar == null) {
          lastImgUrl = null;
          return;
        };
        if (coverUrl === lastImgUrl) return;

        if (nowPlayingBar?.querySelector(".spicy-dynamic-bg")) {
          nowPlayingBar.querySelector(".spicy-dynamic-bg").remove();
        }

        const dynamicBackground = document.createElement("div");
        dynamicBackground.classList.add("spicy-dynamic-bg");

        if (lowQModeEnabled) {
          /* CSSFilter({ blur: "20px" }, coverUrl).then(url => {
            dynamicBackground.innerHTML = `
                <img class="Front NoEffect" src="${url}" />
                <img class="Back NoEffect" src="${url}" />
                <img class="BackCenter NoEffect" src="${url}" />
            `
          }) */
        } else {
          dynamicBackground.innerHTML = `
            <img class="Front" src="${coverUrl}" />
            <img class="Back" src="${coverUrl}" />
            <img class="BackCenter" src="${coverUrl}" />
          `
        }
    
        nowPlayingBar.classList.add("spicy-dynamic-bg-in-this")
    
        nowPlayingBar.appendChild(dynamicBackground);

        lastImgUrl = coverUrl;
        //NOWPLAYINGBAR_DYNAMIC_BG_UPDATE_TIME = Date.now();
      } catch (error) {
        console.error("Error:", error) 
      }
    }

    /* function NOWPLAYINGBAR_DYNAMIC_BG() {
      if (Date.now() - NOWPLAYINGBAR_DYNAMIC_BG_UPDATE_TIME > NOWPLAYINGBAR_DYNAMIC_BG_THROTTLE_TIME) {
        applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
      }
    
      requestAnimationFrame(NOWPLAYINGBAR_DYNAMIC_BG)
    }

    NOWPLAYINGBAR_DYNAMIC_BG(); */

    new IntervalManager(1, () => {
      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
    }).Start();

    Spicetify.Player.addEventListener("songchange", onSongChange)

    let songChangeLoopRan = 0;
    const songChangeLoopMax = 15;
    async function onSongChange(event) {
      storage.set("currentlyFetching", "false");

      let currentUri = event?.data?.item?.uri;
      if (!currentUri) {
        currentUri = Spicetify.Player.data?.item?.uri;
        if (!currentUri) {
          if (songChangeLoopRan >= songChangeLoopMax) {
            return;
          }
          onSongChange(event);
          songChangeLoopRan++;
          return;
        }
      };

      SpotifyPlayer.IsPodcast = event.data.item.type === "episode";
      if (document.querySelector("#SpicyLyricsPage")) {
        if (SpotifyPlayer.IsPodcast) {
          document.querySelector("#SpicyLyricsPage").classList.add("Podcast");
        } else {
          document.querySelector("#SpicyLyricsPage").classList.remove("Podcast");
        }
      };

      if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) UpdateNowBar();

      fetchLyrics(currentUri).then(ApplyLyrics);

      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url)
      songChangeLoopRan = 0;
    
      // Artist Header Image Prefetch (For a Faster Experience)
      {
        const lowQMode = storage.get("lowQMode");
        const lowQModeEnabled = lowQMode && lowQMode === "true";
        if (lowQModeEnabled) {
          const CurrentSongArtist = event.data?.item.artists[0].uri;
          const CurrentSongUri = event.data?.item.uri;
            try {
                await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
            } catch (error) {
                console.error("Error happened while trying to prefetch the Low Quality Mode Dynamic Background", error)
            }
        }
      }


      if (!document.querySelector("#SpicyLyricsPage .LyricsContainer")) return;
      ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .ContentBox"))
    }


    /* Timeout(3, async () => {
      await checkIfLyrics(Spicetify.Player.data?.item.uri);
    }) */

    window.addEventListener("online", async () => {

      storage.set("lastFetchedUri", null);

      //await checkIfLyrics(Spicetify.Player.data?.item.uri);

      //button.disabled = false;

      fetchLyrics(Spicetify.Player.data?.item.uri).then(ApplyLyrics);
    });

    new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();

    let lastLocation = null;

    function loadPage(location) {
      if (location.pathname === "/SpicyLyrics") {
        DisplayLyricsPage()
        button.active = true;
      } else {
        if (lastLocation?.pathname === "/SpicyLyrics") {
          DestroyLyricsPage();
          button.active = false;
        }
      }
      lastLocation = location;
    }

    Spicetify.Platform.History.listen(loadPage)

    
    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
      Global.Event.listen("pagecontainer:available", () => {
        loadPage(Spicetify.Platform.History.location);
        button.active = true;
      })
    }

    Global.Event.listen("pagecontainer:available", () => {
      button.register();
    })

    button.tippy.setContent("Spicy Lyrics");


    Spicetify.Player.addEventListener("onplaypause", (e) => {
      SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
    })

    SpotifyPlayer.IsPlaying = IsPlaying();

    if (storage.get("customLyricsApi").includes("{SPOTIFY_ID}") || !storage.get("customLyricsApi").includes("http")) {
      Spicetify.PopupModal.display({
        title: "IMPORTANT NOTIFICATION!!",
        content: `
        <div style="font-size: 1.5rem;">If the "Spicy Lyrics" extension doesn't want to load lyrics, there's a chance that you're using the old API URL.
        To fix this, please change the API URL to the new one, by going to the Settings and clicking on "Reset Custom APIs", and it should be fixed.
        If the problem persists, please submit and issue on our <a href="https://github.com/spikenew7774/spicy-lyrics/" target="_blank">GitHub</a>. Thanks!</div>`,
      })
    }

    // Events
    {
      Spicetify.Player.addEventListener("onplaypause", (e) => Global.Event.evoke("playback:playpause", e));
      Spicetify.Player.addEventListener("onprogress", (e) => Global.Event.evoke("playback:progress", e));
      Spicetify.Player.addEventListener("songchange", (e) => Global.Event.evoke("playback:songchange", e));

      Whentil.When(() => document.querySelector<HTMLElement>(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"), () => {
        Global.Event.evoke("pagecontainer:available", document.querySelector<HTMLElement>(".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"))
      })

      Spicetify.Platform.History.listen(Session.RecordNavigation);
      Session.RecordNavigation(Spicetify.Platform.History.location);
    }
  }


  Whentil.When(() => SpicyHasher.md5("home"), Hometinue);

}

/* 

// Add this into the code after build.

let ImporterMaid;

// ... code ...

ImporterMaid = new Maid(); // Do this when you find atleast one maid in the compiled code after it.

// ... code ...

export const UpdateNotice = {
	Type: "Notification",
	Name: "Spicy Lyrics"
}

export { ImporterMaid }

And then Minimize it.

(Reccomened: https://codebeautify.org/minify-js)

*/

export default main;
