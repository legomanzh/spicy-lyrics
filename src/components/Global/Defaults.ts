export const isDev = false;

const Defaults = {
    lyrics: {
        api: {
            url: isDev ? "http://localhost:3001" : "https://api.spicylyrics.org",
        }
    },
    CurrentLyricsType: "None",
    LyricsContainerExists: false,
    SkipSpicyFont: false,
    OldStyleFont: false,
    SpicyLyricsVersion: "0.0.0",
    show_topbar_notifications: true,
    PrefersReducedMotion: false,
    StaticBackground_Preset: false,
    StaticBackground: false,
    StaticBackgroundType_Preset: 0,
    StaticBackgroundType: "Auto",
    DevMode: false,
    SimpleLyricsMode: false,
    MinimalLyricsMode: false,
    hide_npv_bg: false
}

export default Defaults;