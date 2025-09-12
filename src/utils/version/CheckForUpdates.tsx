import React from "react";
import { Spicetify } from "@spicetify/bundler";
import { isDev } from "../../components/Global/Defaults.ts";
import Session from "../../components/Global/Session.ts";

let ShownUpdateNotice = false;

export async function CheckForUpdates(force: boolean = false) {
  if (isDev) return;
  const IsOutdated = await Session.SpicyLyrics.IsOutdated();
  if (IsOutdated) {
    if (!force && ShownUpdateNotice) return;
    const currentVersion = Session.SpicyLyrics.GetCurrentVersion();
    const latestVersion = await Session.SpicyLyrics.GetLatestVersion();
    Spicetify.PopupModal.display({
      title: "New Update - Spicy Lyrics",
      content: (
        <div className="update-card-wrapper">
          <div className="card">
            <div>Your Spicy Lyrics version is outdated.</div>
            <div>To update, click on the "Update" button.</div>
          </div>
          <div className="card">
            Version: From: {currentVersion?.Text || "Unknown"} → To:{" "}
            {latestVersion?.Text || "Unknown"}
          </div>
          <button
            onClick={() =>
              window._spicy_lyrics_session.Navigate({ pathname: "/SpicyLyrics/Update" })
            }
            className="btn-release"
            data-encore-id="buttonSecondary"
          >
            Update
          </button>
        </div>
      ),
    });
    ShownUpdateNotice = true;
  }
}
