import { Interval, Timeout } from "@spikerko/web-modules/Scheduler";
import "./css/default.css";
import fetchLyrics from "./functions/fetchLyrics";
import { lineLyrics, runLiiInt, ScrollingIntervalTime, scrollToActiveLine, staticLyrics, stopLyricsInInt, syllableLyrics } from "./functions/lyrics";
import storage from "./functions/storage";
import { setSettingsMenu } from "./functions/settings";
import DisplayLyricsPage, { DestroyLyricsPage } from "./components/PageView";
import { Icons } from "./components/Icons";
import ApplyDynamicBackground from "./components/dynamicBackground";
// Currently Unused: import hasLyrics from "./functions/hasLyrics";

async function main() {
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Lets set out the Settings Menu
  setSettingsMenu();

  storage.set("fetchedFirst", "false");
  storage.set("lastFetchedUri", null)
  storage.set("intRunning", "false")

  const fontElement = document.createElement("link");
  fontElement.href = "https://fonts.spikerko.org/lyrics/source.css";
  fontElement.rel = "stylesheet";
  fontElement.type = "text/css";
  document.head.appendChild(fontElement);

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

      if (lowQModeEnabled) {
        nowPlayingBar.classList.add("spicy-dynamic-bg-in-this")
        Spicetify.colorExtractor(Spicetify.Player.data.item.uri).then(colors => {
          nowPlayingBar.querySelector<HTMLElement>(".AAdBM1nhG73supMfnYX7").style.backgroundColor = colors.DESATURATED;
          lastImgUrl = coverUrl;
        }).catch(err => {
          console.error("Error extracting color:", err);
        });
        return
      }
  
      const dynamicBackground = document.createElement("div");
      dynamicBackground.classList.add("spicy-dynamic-bg");
      
      dynamicBackground.innerHTML = `
        <img class="Front" src="${coverUrl}" />
        <img class="Back" src="${coverUrl}" />
        <img class="BackCenter" src="${coverUrl}" />
      `
  
      nowPlayingBar.classList.add("spicy-dynamic-bg-in-this")
  
      nowPlayingBar.appendChild(dynamicBackground);

      lastImgUrl = coverUrl;
    } catch (error) {
      console.error("Error:", error) 
    }
  }

  Interval(1, () => applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url));

  Spicetify.Player.addEventListener("songchange", async (event) => {
    const currentUri = event.data.item.uri;

    stopLyricsInInt();
    runLiiInt();

    //await checkIfLyrics(currentUri);

    fetchLyrics(currentUri).then(lyrics => {
        storage.set("currentLyricsType", lyrics?.Type);
        if (lyrics?.Type === "Syllable") {
            syllableLyrics(lyrics);
        } else if (lyrics?.Type === "Line") {
            lineLyrics(lyrics);
        } else if (lyrics?.Type === "Static") {
            staticLyrics(lyrics);
        }
        storage.set("lastFetchedUri", currentUri);
    });
    /* stopLyricsInInt();
    Spicetify.LocalStorage.set("SpicyLyrics-intRunning", "false")
    runLiiInt(); */
    /* Spicetify.Player.pause();
    Spicetify.Player.play(); */
    if (!document.querySelector("#LyricsPageContainer .lyricsParent")) return;
    ApplyDynamicBackground(document.querySelector("#LyricsPageContainer .lyricsParent"))
  })


  /* Timeout(3, async () => {
    await checkIfLyrics(Spicetify.Player.data?.item.uri);
  }) */

  window.addEventListener("online", async () => {

    storage.set("lastFetchedUri", null);

    //await checkIfLyrics(Spicetify.Player.data?.item.uri);

    button.disabled = false;

    fetchLyrics(Spicetify.Player.data?.item.uri).then(lyrics => {
      storage.set("fetchedFirst", "true");
      storage.set("currentLyricsType", lyrics?.Type);
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

  setInterval(scrollToActiveLine, ScrollingIntervalTime);

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
    if (e.data.isPaused) {
      stopLyricsInInt();
    } else {
      runLiiInt();
    }
  })


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
