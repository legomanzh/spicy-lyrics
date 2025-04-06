import fetchLyrics from "./utils/Lyrics/fetchLyrics";
import { ScrollingIntervalTime } from "./utils/Lyrics/lyrics";
import storage from "./utils/storage";
import { setSettingsMenu } from "./utils/settings";
import PageView from "./components/Pages/PageView";
import { Icons } from "./components/Styling/Icons";
import ApplyDynamicBackground, { GetBlurredCoverArt, LowQMode_SetDynamicBackground, updateContainerDimensions } from "./components/DynamicBG/dynamicBackground";
import LoadFonts from "./components/Styling/Fonts";
import { IntervalManager } from "./utils/IntervalManager";
import { SpotifyPlayer } from "./components/Global/SpotifyPlayer";
import { IsPlaying } from "./utils/Addons";
import { ScrollToActiveLine } from "./utils/Scrolling/ScrollToActiveLine";
import { ScrollSimplebar } from "./utils/Scrolling/Simplebar/ScrollSimplebar";
import ApplyLyrics from "./utils/Lyrics/Global/Applyer";
import { UpdateNowBar } from "./components/Utils/NowBar";
import { requestPositionSync } from "./utils/Gets/GetProgress";
import "./components/PlaylistBGs/main";
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
import Whentil from "./utils/Whentil";
import Session from "./components/Global/Session";
import Defaults from "./components/Global/Defaults";
import { CheckForUpdates } from "./utils/version/CheckForUpdates";
import sleep from "./utils/sleep";
import Sockets from "./utils/Sockets/main";
import * as THREE from "three"
import { GetShaderUniforms, VertexShader, FragmentShader, ShaderUniforms } from "./components/DynamicBG/ThreeShaders";
import Fullscreen from "./components/Utils/Fullscreen";
import { Defer } from "@spikerko/web-modules/Scheduler";
import Animator from "./utils/Animator";

// Add custom type for our container element
interface DynamicBGContainer extends HTMLElement {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    uniforms: ShaderUniforms;
    animationFrame?: number;
}

async function main() {
  await Platform.OnSpotifyReady;

  if (!storage.get("show_topbar_notifications")) {
    storage.set("show_topbar_notifications", "true")
  }

  if (!storage.get("lyrics_spacing")) {
    storage.set("lyrics_spacing", "Medium");
  }

  if (!storage.get("prefers_reduced_motion")) {
    storage.set("prefers_reduced_motion", "false");
  }

  if (storage.get("prefers_reduced_motion")) {
    Defaults.PrefersReducedMotion = storage.get("prefers_reduced_motion") === "true";
  }

  if (storage.get("lyrics_spacing")) {
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
  }

  const lowQMode = storage.get("lowQMode");
  const lowQModeEnabled = lowQMode && lowQMode === "true";

  if (lowQModeEnabled) {
    document.body.classList.add("SpicyLyrics_LowQMode")
  }

  // Lets set out the Settings Menu
  setSettingsMenu();

  const OldStyleFont = storage.get("old-style-font");
  if (OldStyleFont != "true") {
    LoadFonts();
  }

  // Lets import the required Scripts from our CDN
  {
    const scripts: HTMLScriptElement[] = [];
    const GetFullUrl = (target: string) => `https://public.storage.spicylyrics.org/tools/${target}`;

    const AddScript = (scriptFileName: string) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = GetFullUrl(scriptFileName);
      script.onerror = () => {
        sleep(2).then(() => {
          window._spicy_lyrics?.func_main?._deappend_scripts();
          window._spicy_lyrics?.func_main?._add_script(scriptFileName);
          window._spicy_lyrics?.func_main?._append_scripts();
        })
      };
      scripts.push(script);
    }

    Global.SetScope("func_main._add_script", AddScript);

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
    const DeappendScripts = () => {
      for (const script of scripts) {
        document.head.removeChild(script);
      }
    }

    Global.SetScope("func_main._append_scripts", AppendScripts)
    Global.SetScope("func_main._deappend_scripts", DeappendScripts)
    AppendScripts();
  }

  const skeletonStyle = document.createElement("style");
  skeletonStyle.innerHTML = `
        <!-- This style is here to prevent the @keyframes removal in the CSS. I still don't know why that's happening. -->
        <!-- This is a part of Spicy Lyrics -->
        <style>
            @keyframes skeleton {
                to {
                    background-position-x: 0
                }
            }
        </style>
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
              //self.active = true;
            } else {
              Session.GoBack();
              //self.active = false;
            }
        },
        false, // Whether the button is disabled.
        false, // Whether the button is active.
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
              Whentil.When(() => document.querySelector<HTMLElement>(".Root__main-view #SpicyLyricsPage"), () => {
                Fullscreen.Open();
              })
              //self.active = true;
            } else {
              Session.GoBack();
              //self.active = false;
            }
        },
        false, // Whether the button is disabled.
        false, // Whether the button is active.
      )
    }
  ]

  /* let buttonRegistered = false;

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
  ); */
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
    Defaults.SpicyLyricsVersion = window._spicy_lyrics_metadata?.LoadedVersion ?? "2.6.2";
    await Sockets.all.ConnectSockets();

    // Because somethimes the "syncedPositon" was unavailable, I'm putting this check here that checks if the Spicetify?.Platform?.PlaybackAPI is available (which is then used in SpotifyPlayer.GetTrackPosition())
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
    let lastImgUrl;

    // Setup static THREE.js objects
    const RenderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    RenderCamera.position.z = 1;
    const MeshGeometry = new THREE.PlaneGeometry(2, 2);
    function applyDynamicBackgroundToNowPlayingBar(coverUrl: string) {
      if (lowQModeEnabled) return;
      const nowPlayingBar = document.querySelector<HTMLElement>(".Root__right-sidebar aside.NowPlayingView");
    
      try {
        if (nowPlayingBar == null) {
          lastImgUrl = null;
          return;
        };
        if (coverUrl === lastImgUrl) return;
        
        nowPlayingBar.classList.add("spicy-dynamic-bg-in-this");
        
        let container = nowPlayingBar.querySelector<DynamicBGContainer>(".spicy-dynamic-bg");
        const prevContainer = container;
        
        // If same song, do nothing
        if (container && container.getAttribute("data-cover-id") === coverUrl) {
          return;
        }

        // Create new container
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        container = renderer.domElement as DynamicBGContainer;
        container.classList.add("spicy-dynamic-bg");
        container.style.opacity = "0"; // Start hidden for animation

        // Setup THREE.js scene
        const renderScene = new THREE.Scene();
        const materialUniforms = GetShaderUniforms();
        const meshMaterial = new THREE.ShaderMaterial({
          uniforms: materialUniforms,
          vertexShader: VertexShader,
          fragmentShader: FragmentShader,
        });
        const sceneMesh = new THREE.Mesh(MeshGeometry, meshMaterial);
        renderScene.add(sceneMesh);

        // Store references
        container.renderer = renderer;
        container.scene = renderScene;
        container.uniforms = materialUniforms;

        // Add to DOM
        nowPlayingBar.appendChild(container);

        // Update attributes and set initial size
        container.setAttribute("data-cover-id", coverUrl);
        const width = Math.max(nowPlayingBar.clientWidth, 500);
        const height = Math.max(nowPlayingBar.clientHeight, 500);
        
        // Set size and update uniforms
        updateContainerDimensions(container, width, height);

        // Setup animation
        if (Defaults.PrefersReducedMotion) {
          container.style.opacity = "1";
          if (prevContainer) {
            if (prevContainer.animationFrame) {
              cancelAnimationFrame(prevContainer.animationFrame);
            }
            prevContainer.remove();
          }
        } else {
          const fadeIn = new Animator(0, 1, 0.6);
          const fadeOut = new Animator(1, 0, 0.6);

          fadeIn.on("progress", (progress) => {
            container.style.opacity = progress.toString();
          });

          fadeOut.on("progress", (progress) => {
            if (prevContainer) {
              prevContainer.style.opacity = progress.toString();
            }
          });

          fadeIn.on("finish", () => {
            container.style.opacity = "1";
            fadeIn.Destroy();
          });

          fadeOut.on("finish", () => {
            if (prevContainer) {
              if (prevContainer.animationFrame) {
                cancelAnimationFrame(prevContainer.animationFrame);
              }
              prevContainer.remove();
            }
            fadeOut.Destroy();
          });

          fadeOut.Start();
          fadeIn.Start();
        }

        // Update texture and start animation loop
        GetBlurredCoverArt().then(blurredCover => {
          const texture = new THREE.CanvasTexture(blurredCover);
          texture.minFilter = THREE.NearestFilter;
          texture.magFilter = THREE.NearestFilter;
          container.uniforms.BlurredCoverArt.value = texture;
          container.uniforms.RotationSpeed.value = 1.0;

          const animate = () => {
            container.uniforms.Time.value = performance.now() / 3500;
            container.renderer.render(container.scene, RenderCamera);
            container.animationFrame = requestAnimationFrame(animate);
          };
          animate();
        });

        lastImgUrl = coverUrl;
      } catch (error) {
        console.error("Error Applying the Dynamic BG to the NowPlayingBar:", error);
      }
    }

    new IntervalManager(1, () => {
      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url);
    }).Start();

    Spicetify.Player.addEventListener("songchange", onSongChange);
    Spicetify.Player.addEventListener("songchange", async (event) => {
      fetchLyrics(event?.data?.item?.uri).then(ApplyLyrics);
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
    })

    let songChangeLoopRan = 0;
    const songChangeLoopMax = 5;
    async function onSongChange(event) {
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

      const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";

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
        // Prefetch Track Data
        await SpotifyPlayer.Track.GetTrackInfo();
        if (document.querySelector("#SpicyLyricsPage .ContentBox .NowBar")) {
          Fullscreen.IsOpen ? UpdateNowBar(true) : UpdateNowBar();
        }
      }


      applyDynamicBackgroundToNowPlayingBar(Spicetify.Player.data?.item.metadata.image_url)
      songChangeLoopRan = 0;


      if (!document.querySelector("#SpicyLyricsPage .LyricsContainer")) return;
      ApplyDynamicBackground(document.querySelector("#SpicyLyricsPage .ContentBox"))
    }

    {
      fetchLyrics(Spicetify.Player.data.item.uri).then(ApplyLyrics);
    
      // Artist Header Image Prefetch (For a Faster Experience)
      {
        const lowQMode = storage.get("lowQMode");
        const lowQModeEnabled = lowQMode && lowQMode === "true";
        if (lowQModeEnabled) {
          const CurrentSongArtist = Spicetify.Player.data?.item.artists[0].uri;
          const CurrentSongUri = Spicetify.Player.data?.item.uri;
            try {
                await LowQMode_SetDynamicBackground(CurrentSongArtist, CurrentSongUri);
            } catch (error) {
                console.error("Error happened while trying to prefetch the Low Quality Mode Dynamic Background", error)
            }
        }
      }
    }


    window.addEventListener("online", async () => {

      storage.set("lastFetchedUri", null);

      fetchLyrics(Spicetify.Player.data?.item.uri).then(ApplyLyrics);
    });

    new IntervalManager(ScrollingIntervalTime, () => ScrollToActiveLine(ScrollSimplebar)).Start();


    let lastLocation = null;

    function loadPage(location) {
      if (location.pathname === "/SpicyLyrics") {
        PageView.Open();
        button.Button.active = true;
      } else {
        if (lastLocation?.pathname === "/SpicyLyrics") {
          PageView.Destroy();
          button.Button.active = false;
        }
      }
      lastLocation = location;
    }

    Spicetify.Platform.History.listen(loadPage)

    
    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {
      Global.Event.listen("pagecontainer:available", () => {
        loadPage(Spicetify.Platform.History.location);
        button.Button.active = true;
      })
    }

    button.Button.tippy.setContent("Spicy Lyrics");


    Spicetify.Player.addEventListener("onplaypause", (e) => {
      SpotifyPlayer.IsPlaying = !e?.data?.is_paused;
      Global.Event.evoke("playback:playpause", e);
    })

    {
      let lastLoopType = null;
      const LoopInt = new IntervalManager(Infinity, () => {
        const LoopState = Spicetify.Player.getRepeat();
        const LoopType = LoopState === 1 ? "context" : LoopState === 2 ? "track" : "none";
        SpotifyPlayer.LoopType = LoopType;
        if (lastLoopType !== LoopType) {
          Global.Event.evoke("playback:loop", LoopType);
        }
        lastLoopType = LoopType;
      }).Start();
    }

    {
      let lastShuffleType = null;
      const ShuffleInt = new IntervalManager(Infinity, () => {
        const ShuffleType = (Spicetify.Player.origin._state.smartShuffle ? "smart" : (Spicetify.Player.origin._state.shuffle ? "normal" : "none"));
        SpotifyPlayer.ShuffleType = ShuffleType;
        if (lastShuffleType !== ShuffleType) {
          Global.Event.evoke("playback:shuffle", ShuffleType);
        }
        lastShuffleType = ShuffleType;
      }).Start();
    }
    
    {
      let lastPosition = 0;
      const PositionInt = new IntervalManager(0.5, () => {
        const pos = SpotifyPlayer.GetTrackPosition();
        if (pos !== lastPosition) {
          Global.Event.evoke("playback:position", pos);
        }
        lastPosition = pos;
      }).Start();
    }

    SpotifyPlayer.IsPlaying = IsPlaying();

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

      Global.Event.listen("session:navigation", (data) => {
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

  Whentil.When(() => Spicetify.Player.data.item.type, () => {
    const IsSomethingElseThanTrack = Spicetify.Player.data.item.type !== "track";

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
