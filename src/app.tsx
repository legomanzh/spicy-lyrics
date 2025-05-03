import fetchLyrics from "./utils/Lyrics/fetchLyrics";
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import PageView, { GetPageRoot } from "./components/Pages/PageView";
import { Icons } from "./components/Styling/Icons";
import ApplyDynamicBackground, { DynamicBackgroundConfig, GetStaticBackground } from "./components/DynamicBG/dynamicBackground";
import LoadFonts, { ApplyFontPixel } from "./components/Styling/Fonts";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollToActiveLine } from "./utils/Scrolling/ScrollToActiveLine";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "./utils/Lyrics/Global/Applyer";
import { UpdateNowBar } from "./components/Utils/NowBar";
import { requestPositionSync } from "./utils/Gets/GetProgress";
import "./components/PlaylistBGs/main";

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
import Whentil from "@spikerko/tools/Whentil";
import Session from "./components/Global/Session";
import Defaults from "./components/Global/Defaults";
import { CheckForUpdates } from "./utils/version/CheckForUpdates";
// Unused import removed: import sleep from "./utils/sleep";
import Sockets from "./utils/Sockets/main";
import Fullscreen from "./components/Utils/Fullscreen";
import { Defer } from "@socali/modules/Scheduler";
import { DynamicBackground } from "@spikerko/tools/DynamicBackground";


async function main() {
  await Platform.OnSpotifyReady;

  if (!storage.get("show_topbar_notifications")) {
    storage.set("show_topbar_notifications", "true")
  }

 /*  if (!storage.get("lyrics_spacing")) {
    storage.set("lyrics_spacing", "Medium");
  } */

  if (!storage.get("prefers_reduced_motion")) {
    storage.set("prefers_reduced_motion", "false");
  }

  if (storage.get("prefers_reduced_motion")) {
    const prefersReducedMotion = storage.get("prefers_reduced_motion") === "true";
    Defaults.PrefersReducedMotion = prefersReducedMotion;
  }

  if (!storage.get("staticBackgroundType")) {
    storage.set("staticBackgroundType", "Auto");
  }

  if (storage.get("staticBackgroundType")) {
    Defaults.StaticBackgroundType = storage.get("staticBackgroundType") as string;
  }

  if (!storage.get("staticBackground")) {
    storage.set("staticBackground", "false");
  }

  if (storage.get("staticBackground")) {
    Defaults.StaticBackground = storage.get("staticBackground") === "true";
  }

  /* if (storage.get("lyrics_spacing")) {
    if (storage.get("lyrics_spacing") === "None") {
      document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "0");
    }
    if (storage.get("lyrics_spacing") === "Small") {
      document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "0.5cqw 0");
    }
    if (storage.get("lyrics_spacing") === "Medium") {
      document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "1cqw 0");
    }
    if (storage.get("lyrics_spacing") === "Large") {
      document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "1.5cqw 0");
    }
    if (storage.get("lyrics_spacing") === "Extra Large") {
      document.querySelector("html").style.setProperty("--SpicyLyrics-LineSpacing", "2cqw 0");
    }
  } */

  // Lets set out the Settings Menu
  setSettingsMenu();

  const OldStyleFont = storage.get("old-style-font");
  if (OldStyleFont != "true") {
    LoadFonts();
    ApplyFontPixel();
  }

  // Lets import the required Scripts from our CDN
  {
    const scripts: HTMLScriptElement[] = [];
    const GetFullUrl = (target: string) => `https://public.storage.spicylyrics.org/tools/${target}`;

    const AddScript = (scriptFileName: string) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = GetFullUrl(scriptFileName);
      /* script.onerror = () => {
        sleep(2).then(() => {
          window._spicy_lyrics?.func_main?._deappend_scripts();
          window._spicy_lyrics?.func_main?._add_script(scriptFileName);
          window._spicy_lyrics?.func_main?._append_scripts();
        })
      }; */
      scripts.push(script);
    }

    //Global.SetScope("func_main._add_script", AddScript);

    // spicy-hasher.js
    AddScript("spicy-hasher.js");

    // pako.min.js
    AddScript("pako.min.js");

    // vibrant.min.js
    AddScript("vibrant.min.js");

    // Lets apply our Scripts
    const AppendScripts = () => {
      for (const script of scripts) {
        document.head.appendChild(script);
      }
    }
    /* const DeappendScripts = () => {
      for (const script of scripts) {
        document.head.removeChild(script);
      }
    } */

    /* Global.SetScope("func_main._append_scripts", AppendScripts)
    Global.SetScope("func_main._deappend_scripts", DeappendScripts) */
    AppendScripts();
  }

  const skeletonStyle = document.createElement("style");
  skeletonStyle.innerHTML = `
        /* This style is here to prevent the @keyframes removal in the CSS. I still don't know why that's happening. */
        /* This is a part of Spicy Lyrics */
        @keyframes skeleton {
            to {
                background-position-x: 0
            }
        }
  `
  document.head.appendChild(skeletonStyle);

  const ButtonList = [
    {
      Registered: false,
      Button: new Spicetify.Playbar.Button(
        "Spicy Lyrics",
        Icons.LyricsPage,
        (self) => {
            if (!self.active) {
              Session.Navigate({ pathname: "/SpicyLyrics" });
              if (Global.Saves.shift_key_pressed) {
                const pageWhentil = Whentil.When(() => document.querySelector<HTMLElement>(".Root__main-view #SpicyLyricsPage"), () => {
                  Fullscreen.Open(true);
                  pageWhentil?.Cancel();
                });
              }
            } else {
              Session.GoBack();
            }
        },
        false,
        false,
      )
    },
    {
      Registered: false,
      Button: new Spicetify.Playbar.Button(
        "Enter Fullscreen",
        Icons.Fullscreen,
        (self) => {
            if (!self.active) {
              Session.Navigate({ pathname: "/SpicyLyrics" });
              const pageWhentil = Whentil.When(() => document.querySelector<HTMLElement>(".Root__main-view #SpicyLyricsPage"), () => {
                Fullscreen.Open(Global.Saves.shift_key_pressed ?? false);
                pageWhentil?.Cancel();
              })
            } else {
              Session.GoBack();
            }
        },
        false,
        false,
      )
    }
  ]

  // Add shift key tracking
  Global.Saves.shift_key_pressed = false;

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      Global.Saves.shift_key_pressed = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      Global.Saves.shift_key_pressed = false;
    }
  });

  Global.Event.listen("pagecontainer:available", () => {
    for (const button of ButtonList) {
      if (!button.Registered) {
        button.Button.register();
        button.Registered = true;
      }
    }
  })

  {
    const fullscreenButton = ButtonList[1].Button;
    fullscreenButton.element.style.order = "100000"
		fullscreenButton.element.id = "SpicyLyrics_FullscreenButton"

    const SearchDOMForFullscreenButtons = () => {
			const controlsContainer = document.querySelector<HTMLButtonElement>(".main-nowPlayingBar-extraControls")
			if (controlsContainer === null) {
				Defer(SearchDOMForFullscreenButtons)
			} else {
				for (const element of controlsContainer.children) {
					if (
						(element.attributes.getNamedItem("data-testid")?.value === "fullscreen-mode-button")
						&& (element.id !== "SpicyLyrics_FullscreenButton")
					) {
						(element as HTMLElement).style.display = "none"
					}
				}
			}
		}
		SearchDOMForFullscreenButtons()
  }

  const button = ButtonList[0];

  const Hometinue = async () => {
    Defaults.SpicyLyricsVersion = window._spicy_lyrics_metadata?.LoadedVersion ?? "4.10.0";
    await Sockets.all.ConnectSockets();

    Whentil.When(() => Spicetify.Platform.PlaybackAPI, () => {
      requestPositionSync();
    })

    const previousVersion = storage.get("previous-version");
    if (previousVersion && previousVersion !== Defaults.SpicyLyricsVersion) {
      Spicetify.PopupModal.display({
        title: "Updated - Spicy Lyrics",
        content: `
        <div style="font-size: 1.5rem;">
          Your Spicy Lyrics version has been successfully updated!
          <br>
          Version: From: ${previousVersion} -> To: ${Defaults.SpicyLyricsVersion}
          <br>
          <br>
          <p>
            What's new: <a href="https://github.com/Spikerko/spicy-lyrics/releases/tag/${Defaults.SpicyLyricsVersion}" target="_blank" style="text-decoration: underline;">Open on Github -></a>
          </p>
        </div>`,
      })
      storage.set("previous-version", Defaults.SpicyLyricsVersion);
    }

    // Lets set out Dynamic Background (spicy-dynamic-bg) to the now playing bar
    let lastImgUrl: string | null;
    // Store the DynamicBackground instance for reuse
    let nowPlayingBarDynamicBg: DynamicBackground | null = null;

    const CleanupNowBarDynamicBgLets = () => {
      if (nowPlayingBarDynamicBg) {
        nowPlayingBarDynamicBg.Destroy();
        nowPlayingBarDynamicBg = null;
      }
    }

    async function applyDynamicBackgroundToNowPlayingBar(coverUrl: string | undefined) {
      if (Defaults.StaticBackground || !coverUrl) return;
      const nowPlayingBar = document.querySelector<HTMLElement>(".Root__right-sidebar aside.NowPlayingView");

      try {
        if (nowPlayingBar == null) {
          lastImgUrl = null;
          return;
        };
        if (coverUrl === lastImgUrl) return;

        const existingElement = nowPlayingBar.querySelector<HTMLElement>(".spicy-dynamic-bg");
        nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");

        // Process the cover URL
        const processedCover = coverUrl;

        // Check if we already have a DynamicBackground instance
        if (nowPlayingBarDynamicBg && existingElement) {
          // Update the data-cover-id attribute
          existingElement.setAttribute("data-cover-id", coverUrl);

          // Update with the current image
          await nowPlayingBarDynamicBg.Update({
            image: processedCover
          });
        } else {
          // Create new DynamicBackground instance
          nowPlayingBarDynamicBg = new DynamicBackground(DynamicBackgroundConfig);

          // Get the canvas element
          const container = nowPlayingBarDynamicBg.GetCanvasElement();

          // Add the spicy-dynamic-bg class
          container.classList.add("spicy-dynamic-bg");

          // Set the data-cover-id attribute
          container.setAttribute("data-cover-id", coverUrl);

          // Apply the background to the element
          nowPlayingBarDynamicBg.AppendToElement(nowPlayingBar);

          // Update with the current image
          await nowPlayingBarDynamicBg.Update({
            image: processedCover
          });
        }

        lastImgUrl = coverUrl;
      } catch (error) {
        console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
      }
    }

    new IntervalManager(1, async () => {
      await applyDynamicBackgroundToNowPlayingBar(SpotifyPlayer.GetCover("xlarge"));
    }).Start();

    async function onSongChange(event: any) {
      const IsSomethingElseThanTrack = SpotifyPlayer.GetContentType() !== "track";

      if (IsSomethingElseThanTrack) {
        button.Button.deregister();
        button.Registered = false;
      } else {
        if (!button.Registered) {
          button.Button.register();
          button.Registered = true;
        }
      }

      if (!IsSomethingElseThanTrack) {
        if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) {
          Fullscreen.IsOpen ? UpdateNowBar(true) : UpdateNowBar();
        }
      }

      fetchLyrics(event?.data?.item?.uri).then(ApplyLyrics);


      if (Defaults.StaticBackground) {
        const Artists = SpotifyPlayer.GetArtists();
        const Artist = Artists?.map(artist => artist.uri?.replace("spotify:artist:", ""))[0] ?? undefined;
        try {
          await GetStaticBackground(Artist, SpotifyPlayer.GetId());
        } catch (error) {
          console.error("Unable to prefetch Static Background");
        }
      }

      await applyDynamicBackgroundToNowPlayingBar(SpotifyPlayer.GetCover("xlarge"));

      const contentBox = document.querySelector<HTMLElement>("#SpicyLyricsPage .ContentBox");
      if (!contentBox) return;
      ApplyDynamicBackground(contentBox);
    }
    Global.Event.listen("playback:songchange", onSongChange);

    {
      fetchLyrics(Spicetify.Player.data?.item?.uri).then(ApplyLyrics);

      if (Defaults.StaticBackground) {
        const Artists = SpotifyPlayer.GetArtists();
        const Artist = Artists?.map(artist => artist.uri?.replace("spotify:artist:", ""))[0] ?? undefined;
        try {
          await GetStaticBackground(Artist, SpotifyPlayer.GetId());
        } catch (error) {
          console.error("Unable to prefetch Static Background");
        }
      }
    }


    window.addEventListener("online", async () => {

      storage.set("lastFetchedUri", null);

      fetchLyrics(Spicetify.Player.data?.item?.uri).then(ApplyLyrics);
    });

    new IntervalManager(ScrollingIntervalTime, () => {
      if (ScrollSimplebar) {
        ScrollToActiveLine(ScrollSimplebar);
      }
    }).Start();


    interface Location {
      pathname: string;
      [key: string]: any;
    }

    let lastLocation: Location | null = null;

    function loadPage(location: Location) {
      if (location.pathname === "/SpicyLyrics") {
        PageView.Open();
        button.Button.active = true;
      } else {
        if (lastLocation?.pathname === "/SpicyLyrics") {
          CleanupNowBarDynamicBgLets();
          PageView.Destroy();
          button.Button.active = false;
        }
      }
      lastLocation = location;
    }

    Global.Event.listen("platform:history", loadPage);


    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
      Global.Event.listen("pagecontainer:available", () => {
        loadPage(Spicetify.Platform.History.location);
        button.Button.active = true;
      })
    }

    button.Button.tippy.setContent("Spicy Lyrics");


    {
      type LoopType = "context" | "track" | "none";
      let lastLoopType: LoopType | null = null;
      // These interval managers are intentionally not stored in variables that are used elsewhere
      // They are self-running background processes that continue to run throughout the app lifecycle
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      new IntervalManager(Infinity, () => {
        const LoopState = Spicetify.Player.getRepeat();
        const LoopType: LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
        SpotifyPlayer.LoopType = LoopType;
        if (lastLoopType !== LoopType) {
          Global.Event.evoke("playback:loop", LoopType);
        }
        lastLoopType = LoopType;
      }).Start();
    }

    {
      type ShuffleType = "smart" | "normal" | "none";
      let lastShuffleType: ShuffleType | null = null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      new IntervalManager(Infinity, () => {
        const ShuffleType: ShuffleType = (Spicetify.Player.origin._state.smartShuffle ? "smart" : (Spicetify.Player.origin._state.shuffle ? "normal" : "none"));
        SpotifyPlayer.ShuffleType = ShuffleType;
        if (lastShuffleType !== ShuffleType) {
          Global.Event.evoke("playback:shuffle", ShuffleType);
        }
        lastShuffleType = ShuffleType;
      }).Start();
    }

    {
      let lastPosition = 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      new IntervalManager(0.5, () => {
        const pos = SpotifyPlayer.GetPosition();
        if (pos !== lastPosition) {
          Global.Event.evoke("playback:position", pos);
        }
        lastPosition = pos;
      }).Start();
    }

    SpotifyPlayer.IsPlaying = IsPlaying();

    // Events
    {
      Spicetify.Player.addEventListener("onplaypause", (e) => {
        SpotifyPlayer.IsPlaying = !e?.data?.isPaused;
        Global.Event.evoke("playback:playpause", e)
      });
      Spicetify.Player.addEventListener("onprogress", (e) => Global.Event.evoke("playback:progress", e));
      Spicetify.Player.addEventListener("songchange", (e) => Global.Event.evoke("playback:songchange", e));

      Whentil.When(GetPageRoot, () => {
        Global.Event.evoke("pagecontainer:available", GetPageRoot())
      })

      Spicetify.Platform.History.listen((e: Location) => {
        Global.Event.evoke("platform:history", e);
      });
      Spicetify.Platform.History.listen(Session.RecordNavigation);
      Session.RecordNavigation(Spicetify.Platform.History.location);

      Global.Event.listen("session:navigation", (data: Location) => {
        if (data.pathname === "/SpicyLyrics/Update") {
          storage.set("previous-version", Defaults.SpicyLyricsVersion);
          window._spicy_lyrics_metadata = {}
          Session.GoBack();
          window.location.reload();
        }
      })

      async function CheckForUpdates_Intervaled() {
        await CheckForUpdates();
        setTimeout(CheckForUpdates_Intervaled, 60000);
      }
      setTimeout(async () => await CheckForUpdates_Intervaled(), 10000);
    }
  }

  Whentil.When(() => SpotifyPlayer.GetContentType(), () => {
    const IsSomethingElseThanTrack = SpotifyPlayer.GetContentType() !== "track";

    if (IsSomethingElseThanTrack) {
      button.Button.deregister();
      button.Registered = false;
    } else {
      if (!button.Registered) {
        button.Button.register();
        button.Registered = true;
      }
    }
  })


  Whentil.When(() => (
    SpicyHasher &&
    pako &&
    Vibrant
  ), Hometinue);
}

export default main;
