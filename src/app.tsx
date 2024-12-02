import { Timeout } from "@spikerko/web-modules/Scheduler";
import "./css/default.css";
import fetchLyrics from "./functions/fetchLyrics";
import { ClearCurrrentContainerScrollData, lineLyrics, ScrollingIntervalTime, scrollToActiveLine, staticLyrics, syllableLyrics } from "./functions/lyrics";
import storage from "./functions/storage";
import { setSettingsMenu } from "./functions/settings";
import DisplayLyricsPage, { DestroyLyricsPage } from "./components/PageView";
import { Icons } from "./components/Icons";
import ApplyDynamicBackground from "./components/dynamicBackground";
import LoadFonts from "./components/Fonts";
import { IntervalManager } from "./functions/IntervalManager";
import { SpotifyPlayer } from "./components/SpotifyPlayer";
import { IsPlaying } from "./components/Addons";
import CSSFilter from "./functions/CSSFilter";
import "./css/Simplebar.css";
// Currently Unused: import hasLyrics from "./functions/hasLyrics";

async function main() {
  /* while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  } */
  
  // Lets set out the Settings Menu
  setSettingsMenu();

  storage.set("fetchedFirst", "false");
  storage.set("lastFetchedUri", null)
  storage.set("intRunning", "false")

  LoadFonts();

  /* async function checkIfLyrics(currentUri) {
    //THIS IS CURRENTLY DISABLED
    const trackHasLyrics = await hasLyrics(currentUri);

    if (!trackHasLyrics) {
      button.disabled = true;
      if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
        Spicetify.Platform.History.goBack();
      }
      return;
    };

    button.disabled = false;
    return null;
  } */

  /* const cssElem = document.createElement("link");
  cssElem.href = "/spicetify-routes-spicy-lyrics.css";
  cssElem.rel = "stylesheet";
  cssElem.type = "text/css";
  document.head.appendChild(cssElem); */

  // Lets set out Dynamic Background (spicy-dynamic-bg) to the now playing bar

  let lastImgUrl;

  const button = new Spicetify.Playbar.Button(
    "Spicy Lyrics",
    Icons.LyricsPage,
    (self) => {
        if (!self.active) {
          Spicetify.Platform.History.push("/SpicyLyrics");
          //self.active = true;
        } else {
          Spicetify.Platform.History.goBack();
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
        /* Spicetify.colorExtractor(Spicetify.Player.data.item.uri).then(colors => {
          nowPlayingBar.querySelector<HTMLElement>(".AAdBM1nhG73supMfnYX7").style.backgroundColor = colors.DESATURATED;
          lastImgUrl = coverUrl;
        }).catch(err => {
          console.error("Error extracting color:", err);
        });
        return */

        CSSFilter({ blur: "20px" }, coverUrl).then(url => {
          dynamicBackground.innerHTML = `
              <img class="Front NoEffect" src="${url}" />
              <img class="Back NoEffect" src="${url}" />
              <img class="BackCenter NoEffect" src="${url}" />
          `
        })
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
  function onSongChange(event) {
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

    //Intervals.LyricsInterval.Restart();

    //await checkIfLyrics(currentUri);

    fetchLyrics(currentUri).then(lyrics => {
        //storage.set("currentLyricsType", lyrics?.Type);
        if (lyrics?.Type === "Syllable") {
            syllableLyrics(lyrics);
        } else if (lyrics?.Type === "Line") {
            lineLyrics(lyrics);
        } else if (lyrics?.Type === "Static") {
            staticLyrics(lyrics);
        }
        storage.set("lastFetchedUri", currentUri);
    });

    applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url)
    songChangeLoopRan = 0;
    if (!document.querySelector("#SpicyLyricsPage .lyricsParent")) return;
    ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .lyricsParent"))
    ClearCurrrentContainerScrollData();
  }


  /* Timeout(3, async () => {
    await checkIfLyrics(Spicetify.Player.data?.item.uri);
  }) */

  window.addEventListener("online", async () => {

    storage.set("lastFetchedUri", null);

    //await checkIfLyrics(Spicetify.Player.data?.item.uri);

    button.disabled = false;

    fetchLyrics(Spicetify.Player.data?.item.uri).then(lyrics => {
      storage.set("fetchedFirst", "true");
      //storage.set("currentLyricsType", lyrics?.Type);
      if (lyrics?.Type === "Syllable") {
          syllableLyrics(lyrics);
      } else if (lyrics?.Type === "Line") {
          lineLyrics(lyrics);
      } else if (lyrics?.Type === "Static") {
          staticLyrics(lyrics);
      }
      storage.set("lastFetchedUri", Spicetify.Player.data?.item.uri);
    });
  });

  new IntervalManager(ScrollingIntervalTime, scrollToActiveLine).Start();

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
    Timeout(3, () => {
      loadPage(Spicetify.Platform.History.location)
      button.active = true;
    })
  }

  button.register();

  button.tippy.setContent("Spicy Lyrics");


  Spicetify.Player.addEventListener("onplaypause", (e) => {
    SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
  })

  SpotifyPlayer.IsPlaying = IsPlaying();
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
