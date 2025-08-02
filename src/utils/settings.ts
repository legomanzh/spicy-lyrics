import { SettingsSection } from "../edited_packages/spcr-settings/settingsSection";
import storage from "./storage";
import Defaults from "../components/Global/Defaults";
import { LyricsStore } from "./Lyrics/fetchLyrics";
import { SpotifyPlayer } from "../components/Global/SpotifyPlayer";
import { ShowNotification } from "../components/Pages/PageView";

export function setSettingsMenu() {
    generalSettings();
    devSettings();
    infos();
}

function devSettings() {
    const settings = new SettingsSection("Spicy Lyrics - Developer Settings", "spicy-lyrics-dev-settings");

    settings.addButton("remove-current-lyrics-all-caches", "Remove Lyrics for the current song from all caches", "Remove", async () => {
        const currentSongId = SpotifyPlayer.GetId();
        if (!currentSongId || currentSongId === undefined) {
            ShowNotification(`The current song id could not be retrieved`, "error");
        }
        try {
            await LyricsStore.RemoveItem(currentSongId ?? "");
            storage.set("currentLyricsData", null);
            ShowNotification(`Lyrics for the current song, have been removed from available all caches`, "success");
        } catch (error) {
            ShowNotification(`
                <p>Lyrics for the current song, couldn't be removed from all available caches</p>
                <p style="opacity: 0.75;">Check the console for more info</p>
            `, "error")
            console.error("SpicyLyrics:", error)
        }
    });

    settings.addButton("remove-cached-lyrics", "Remove Cached Lyrics (Lyrics Stay in Cache for 3 days)", "Remove Cached Lyrics", async () => {
        try {
            await LyricsStore.Destroy();
            ShowNotification("The Lyrics Cache has been destroyed successfully", "success")
        } catch (error) {
            ShowNotification(`
                <p>The Lyrics cache, couldn't be removed</p>
                <p style="opacity: 0.75;">Check the console for more info</p>
            `, "error")
            console.error("SpicyLyrics:", error)
        }
    });

    settings.addButton("remove-current-song-lyrics-from-localStorage", "Remove Current Song Lyrics from internal state", "Remove Current Lyrics", () => { 
        try {
            storage.set("currentLyricsData", null);
            ShowNotification("Lyrics for the current song, have been removed from the internal state successfully", "success");
        } catch (error) {
            ShowNotification(`
                <p>Lyrics for the current song, couldn't be removed from the internal state</p>
                <p style="opacity: 0.75;">Check the console for more info</p>
            `, "error")
            console.error("SpicyLyrics:", error)
        }
    });


    settings.addToggle("dev-mode", "Dev Mode", Defaults.DevMode, () => {
        storage.set("devMode", settings.getFieldValue("dev-mode") as string)
        window.location.reload();
    });


    settings.pushSettings();
}


function generalSettings() {
    const settings = new SettingsSection("Spicy Lyrics", "spicy-lyrics-settings");

    settings.addToggle("static-background", "Static Background", Defaults.StaticBackground_Preset, () => {
        storage.set("staticBackground", settings.getFieldValue("static-background") as string);
    });

    settings.addDropDown("static-background-type", "Static Background Type (Only works when Static Background is Enabled)", ["Auto", "Artist Header Visual", "Cover Art", "Color"], Defaults.StaticBackgroundType_Preset, () => {
        storage.set("staticBackgroundType", settings.getFieldValue("static-background-type") as string);
    });

    settings.addToggle("simple-lyrics-mode", "Simple Lyrics Mode", Defaults.SimpleLyricsMode, () => {
        storage.set("simpleLyricsMode", settings.getFieldValue("simple-lyrics-mode") as string);
    });

    settings.addToggle("minimal-lyrics-mode", "Minimal Lyrics Mode (Only in Fullscreen/Cinema View)", Defaults.MinimalLyricsMode, () => {
        storage.set("minimalLyricsMode", settings.getFieldValue("minimal-lyrics-mode") as string);
    });

    settings.addToggle("skip-spicy-font", "Skip Spicy Font*", Defaults.SkipSpicyFont, () => {
        storage.set("skip-spicy-font", settings.getFieldValue("skip-spicy-font") as string)
    });

    settings.addToggle("old-style-font", "Old Style Font (Gets Overriden by the previous option)", Defaults.OldStyleFont, () => {
        storage.set("old-style-font", settings.getFieldValue("old-style-font") as string)
    });

    settings.addToggle("show_topbar_notifications", "Show Topbar Notifications", Defaults.show_topbar_notifications, () => {
        storage.set("show_topbar_notifications", settings.getFieldValue("show_topbar_notifications") as string)
    });

    settings.addButton("save-n-reload", "Save your current settings and reload.", "Save & Reload", () => {
        window.location.reload();
    });
    

    settings.pushSettings()
}

function infos() {
    const settings = new SettingsSection("Spicy Lyrics - Info", "spicy-lyrics-settings-info");

    settings.addButton("more-info", "*If you're using a custom font modification, turn that on", "", () => {});

    settings.pushSettings();
}