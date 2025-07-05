import { SendJob } from "../../utils/API/SendJob";
import fetchLyrics from "../../utils/Lyrics/fetchLyrics";
import ApplyLyrics from "../../utils/Lyrics/Global/Applyer";
import storage from "../../utils/storage";
import Global from "../Global/Global";
import { SpotifyPlayer } from "../Global/SpotifyPlayer";
import { ShowNotification } from "../Pages/PageView";

Global.SetScope("execute", (command: string) => {
    switch (command) {
        case "upload-ttml":
            // console.log("Upload TTML");
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.ttml';
            fileInput.onchange = (event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const ttml = e.target?.result as string;
                        // console.log("TTML file loaded:", ttml);
                        ShowNotification("Found TTML, Parsing...", "info", 5000);
                        ParseTTML(ttml)
                            .then(async (result) => {
                                const dataToSave = JSON.stringify({
                                    ...result?.Result,
                                    id: SpotifyPlayer.GetId()
                                })
                                storage.set("currentLyricsData", dataToSave);
                                setTimeout(() => {
                                    fetchLyrics(SpotifyPlayer.GetUri() ?? "").then((lyrics) => {
                                        ApplyLyrics(lyrics);
                                        ShowNotification("Lyrics Parsed and Applied!", "success", 5000);
                                    }).catch((err) => {
                                        ShowNotification("Error applying lyrics", "error", 5000);
                                        console.error("Error applying lyrics:", err);
                                    });
                                }, 25)
                            })
                    };
                    reader.onerror = (e) => {
                        console.error("Error reading file:", e.target?.error);
                        ShowNotification("Error reading TTML file.", "error", 5000);
                    }
                    reader.readAsText(file);
                }
            };
            fileInput.click();
            break;
        case "reset-ttml":
            // console.log("Reset TTML");
            storage.set("currentLyricsData", "");
            ShowNotification("TTML has been reset.", "info", 5000);
            setTimeout(() => {
                fetchLyrics(SpotifyPlayer.GetUri() ?? "").then(ApplyLyrics).catch((err) => {
                    ShowNotification("Error applying lyrics", "error", 5000);
                    console.error("Error applying lyrics:", err);
                });
            }, 25);
            break;
    }
})

async function ParseTTML(ttml: string): Promise<any | null> {
    try {
        const jobResponse = await SendJob([{
            handler: "PARSE_TTML",
            args: {
                ttml
            }
        }])
        const job = jobResponse.get("PARSE_TTML");
        if (!job) {
            return null;
        }
        
        if (job.status !== 200) {
            return null;
        }

        if (!job.responseData) {
            return null;
        }

        if (job.type !== "json") {
            return null;
        }

        if (job.responseData.error) {
            return null;
        }

        return job.responseData;
    } catch (error) {
        console.error("Error parsing TTML:", error);
        ShowNotification("Error parsing TTML", "error", 5000);
        return null;
    }
}