// src/providers/lrclib.ts
// Minimal LRCLIB provider for Spicy Lyrics
// NOTE: adapt types & registration to the project's provider interface.

const LRCLIB_BASE = "https://lrclib.net/api";

function q(v?: string) {
  return encodeURIComponent((v || "").trim());
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`LRCLIB request failed: ${res.status}`);
  return res.json();
}

/**
 * Try to find synced lyrics for given metadata.
 * info: { artist?: string, track?: string, durationMs?: number, id?: string }
 */
export async function getLrclibLyrics(info: { artist?: string; track?: string; durationMs?: number; id?: string }) {
  try {
    // primary lookup by artist + track
    const artist = q(info.artist);
    const track = q(info.track);
    const dur = info.durationMs ? `&duration=${Math.round(info.durationMs)}` : "";

    const url = `${LRCLIB_BASE}/get?artist_name=${artist}&track_name=${track}${dur}`;
    const json = await fetchJson(url);

    // LRCLIB responses vary; attempt common shapes:
    // - { plainLyrics: "...", syncedLyrics: [...] }
    // - or array of matches: [{ plainLyrics, syncedLyrics }]
    if (!json) return null;

    // If it's an array, take first
    const item = Array.isArray(json) ? json[0] : json;

    // syncedLyrics may be array of {time, text} or LRC plaintext
    if (item?.syncedLyrics && item.syncedLyrics.length) {
      return { type: "synced", payload: item.syncedLyrics };
    }
    // fallback to plain lyrics field
    if (item?.plainLyrics || item?.lyrics || item?.raw) {
      const plain = item.plainLyrics ?? item.lyrics ?? item.raw;
      // convert to simple line array
      const lines = String(plain).split(/\r?\n/).map((l: string) => ({ time: null, text: l }));
      return { type: "unsynced", payload: lines };
    }

    return null;
  } catch (err) {
    console.warn("LRCLIB provider error:", err);
    return null;
  }
}

/**
 * Optional: a search helper
 */
export async function searchLrclib(query: string) {
  const url = `${LRCLIB_BASE}/search?query=${encodeURIComponent(query)}`;
  const json = await fetchJson(url);
  return json;
}
