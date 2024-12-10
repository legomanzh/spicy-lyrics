export default function GetProgress() {
    const state = Spicetify?.Player?.data;

    if (!state) return 0;

    // Extract necessary fields from the state
    const { isPaused, timestamp, positionAsOfTimestamp } = state;

    // Calculate progress
    if (isPaused) {
        return positionAsOfTimestamp;
    }
    return (Date.now() - timestamp) + positionAsOfTimestamp;
}