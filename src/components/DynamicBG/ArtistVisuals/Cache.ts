import { GetExpireStore } from "@spikerko/tools/Cache";

const CacheStore = GetExpireStore(
    "SpicyLyrics_ArtistVisuals",
    1,
    {
        Unit: "Days",
        Duration: 3
    }
)
export default CacheStore;