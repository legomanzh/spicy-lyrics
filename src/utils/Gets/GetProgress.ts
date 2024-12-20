/* export default function GetProgress() {
    const state = Spicetify?.Player?.data;

    if (!state) return 0;

    // Extract necessary fields from the state
    const { isPaused, timestamp, positionAsOfTimestamp } = state;

    // Calculate progress
    if (isPaused) {
        return positionAsOfTimestamp;
    }
    return (Date.now() - timestamp) + positionAsOfTimestamp;
} */

let syncedPosition;
const syncTimings = [0.05, 0.1, 0.15, 0.75];
let canSyncNonLocalTimestamp = (Spicetify.Player.isPlaying() ? syncTimings.length : 0);

export const requestPositionSync = () => {
  const SpotifyPlatform = Spicetify.Platform;
  const startedAt = performance.now();
  const isLocallyPlaying = SpotifyPlatform.PlaybackAPI._isLocal;

  const getLocalPosition = () => {
    return SpotifyPlatform.PlayerAPI._contextPlayer
      .getPositionState({})
      .then(({ position }) => ({
        StartedSyncAt: startedAt,
        Position: Number(position),
      }));
  };

  const getNonLocalPosition = () => {
    return (canSyncNonLocalTimestamp > 0
      ? SpotifyPlatform.PlayerAPI._contextPlayer.resume({})
      : Promise.resolve()
    ).then(() => {
      canSyncNonLocalTimestamp = Math.max(0, canSyncNonLocalTimestamp - 1);
      return {
        StartedSyncAt: startedAt,
        Position:
          SpotifyPlatform.PlayerAPI._state.positionAsOfTimestamp +
          (Date.now() - SpotifyPlatform.PlayerAPI._state.timestamp),
      };
    });
  };

  const sync = isLocallyPlaying ? getLocalPosition() : getNonLocalPosition();

  sync
    .then((position) => {
      syncedPosition = position;
    })
    .then(() => {
      const delay = isLocallyPlaying
        ? 1 / 60 // 60 FPS for local playback
        : canSyncNonLocalTimestamp === 0
        ? 1 / 60
        : syncTimings[syncTimings.length - canSyncNonLocalTimestamp];

      setTimeout(requestPositionSync, delay * 1000);
    });
};

/* export default function GetProgress() {
    // Ensure Spicetify is loaded and state is available
    if (!Spicetify?.Player?.origin?._state) {
        console.error("Spicetify Player state is not available.");
        return null;
    }

    const state = Spicetify.Player.origin._state;

    // Extract necessary properties from Spicetify Player state
    const positionAsOfTimestamp = state.positionAsOfTimestamp; // Last known position in ms
    const timestamp = state.timestamp;                         // Last known timestamp
    const isPaused = state.isPaused;                           // Playback state

    // Validate data integrity
    if (positionAsOfTimestamp == null || timestamp == null) {
        console.error("Playback state is incomplete.");
        return null;
    }

    const now = Date.now();

    // Calculate and return the current track position
    if (isPaused) {
        return positionAsOfTimestamp; // Position remains static when paused
    } else {
        return positionAsOfTimestamp + (now - timestamp);
    }
} */



// Function to get the current progress
export default function GetProgress() {
  if (!syncedPosition) {
    console.error("No synced position available.");
    return null;
  }

  const { StartedSyncAt, Position } = syncedPosition;
  const now = performance.now();
  const deltaTime = now - StartedSyncAt;

  // Calculate and return the current track position
  if (!Spicetify.Player.isPlaying()) {
    return Spicetify.Platform.PlayerAPI._state.positionAsOfTimestamp; // Position remains static when paused
  }

  // Calculate and return the current track position
  return Position + deltaTime;
}