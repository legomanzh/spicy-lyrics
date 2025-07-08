import { SettingsSection } from "../edited_packages/spcr-settings/settingsSection";
import storage from "./storage";
import Defaults from "../components/Global/Defaults";
import { LyricsStore } from "./Lyrics/fetchLyrics";

export function setSettingsMenu() {
    generalSettings();
    devSettings();
    infos();
}

function devSettings() {
    const settings = new SettingsSection("Spicy Lyrics - Developer Settings", "spicy-lyrics-dev-settings");

/*     settings.addInput("custom-lyrics-api", "Custom Lyrics API", Defaults.lyrics.api.url, () => {
        storage.set("customLyricsApi", settings.getFieldValue("custom-lyrics-api") as string)
        Spicetify.showNotification("Custom Lyrics API Updated Successfully!", false, 1000);
    });

    settings.addInput("lyrics-api-access-token", "Lyrics API Access Token", Defaults.lyrics.api.accessToken, () => { 
        storage.set("lyricsApiAccessToken", settings.getFieldValue("lyrics-api-access-token") as string)
        Spicetify.showNotification("Lyrics API Access Token Updated Successfully!", false, 1000);
    });

    settings.addButton("reset-custom-apis", "Reset Custom APIs", "Reset to Default", () => {
        settings.setFieldValue("custom-lyrics-api", Defaults.lyrics.api.url);
        settings.setFieldValue("lyrics-api-access-token", Defaults.lyrics.api.accessToken);

        storage.set("customLyricsApi", Defaults.lyrics.api.url)
        storage.set("lyricsApiAccessToken", Defaults.lyrics.api.accessToken)

        settings.rerender();

        Spicetify.showNotification("Custom APIs Reset Successfully!", false, 3000);
    }); */

    settings.addButton("remove-cached-lyrics", "Remove Cached Lyrics (Lyrics Stay in Cache for 7 days*)", "Remove Cached Lyrics", () => {
        LyricsStore.Destroy();
        Spicetify.showNotification("Cache Destroyed Successfully!", false, 5000);
    });

    settings.addButton("remove-current-song-lyrics-from-localStorage", "Remove Current Song Lyrics from LocalStorage", "Remove Current Lyrics", () => { 
        storage.set("currentLyricsData", null);
        Spicetify.showNotification("Current Lyrics Removed Successfully!", false, 5000);
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

    /* settings.addToggle("low-q-mode", "Low Quality Mode (Leaving Soon)", Defaults.lowQualityMode, () => {
        storage.set("lowQMode", settings.getFieldValue("low-q-mode") as string)
    }); */

    settings.addToggle("skip-spicy-font", "Skip Spicy Font**", Defaults.SkipSpicyFont, () => {
        storage.set("skip-spicy-font", settings.getFieldValue("skip-spicy-font") as string)
    });

    settings.addToggle("old-style-font", "Old Style Font (Gets Overriden by the previous option)", Defaults.OldStyleFont, () => {
        storage.set("old-style-font", settings.getFieldValue("old-style-font") as string)
    });

    /* settings.addToggle("force-cover-bg_in-lowqmode", "Force Image Cover (as the background) in Low Quality Mode (Leaving Soon)", Defaults.ForceCoverImage_InLowQualityMode, () => {
        storage.set("force-cover-bg_in-lowqmode", settings.getFieldValue("force-cover-bg_in-lowqmode") as string)
    }); */

    settings.addToggle("show_topbar_notifications", "Show Topbar Notifications", Defaults.show_topbar_notifications, () => {
        storage.set("show_topbar_notifications", settings.getFieldValue("show_topbar_notifications") as string)
    });

    /* settings.addDropDown("lyrics_spacing", "Line Spacing", ["None", "Small", "Medium", "Large", "Extra Large"], Defaults.lyrics_spacing, () => {
        storage.set("lyrics_spacing", settings.getFieldValue("lyrics_spacing") as string);
    }); */

    /* settings.addToggle("prefers_reduced_motion", "Prefers Reduced Motion", false, () => {
        storage.set("prefers_reduced_motion", settings.getFieldValue("prefers_reduced_motion") as string);
    }); */

    settings.addButton("save-n-reload", "Save your current settings and reload.", "Save & Reload", () => {
        window.location.reload();
    });
    

    settings.pushSettings()
}

function infos() {
    const settings = new SettingsSection("Spicy Lyrics - Info", "spicy-lyrics-settings-info");

    settings.addButton("more-info", "*Only if you're online", "", () => {});
    settings.addButton("more-info2", "**If you're using a custom font modification, turn that on", "", () => {});

    settings.pushSettings();

}