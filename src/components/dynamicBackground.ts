import storage from "../functions/storage";


export default function ApplyDynamicBackground(element) {
    if (!element) return
    const currentImgCover = Spicetify.Player.data?.item.metadata.image_url
    /* Spicetify.Player.addEventListener("songchange", (event) => {
        const cover = event.data.item.metadata.image_url;
        currentImgCover = cover;
    }); */
    
    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";
/* 
    if (lowQModeEnabled) {
        if (document.querySelector<HTMLElement>(".spicy-single-bg")) {
            try { */
    //const [extractedColor, setExtractedColor] = useState<any>(null);
    
   
        Spicetify.colorExtractor(Spicetify.Player.data.item.uri).then(colors => {
            //setExtractedColor(colors);
            if (lowQModeEnabled) {
                element.style.backgroundColor = colors.DESATURATED;
            }

            //document.querySelector<HTMLElement>("#LyricsPageContainer .lyricsParent .lyrics").style.setProperty("--ScrollbarScrollerColor", darkenColor(colors.VIBRANT, 15));

        }).catch(err => {
            console.error("Error extracting color:", err);
        });


/*                 document.querySelector<HTMLElement>(".spicy-single-bg").style.backgroundColor = extractedColor.VIBRANT_NON_ALARMING;
            } catch (error) {
                console.error("Error extracting color:", error);
            }
        }
    } */

    if (lowQModeEnabled) return;

    const dynamicBg = document.createElement("div")
    dynamicBg.classList.add("spicy-dynamic-bg")
    dynamicBg.innerHTML = `
        <img class="Front" src="${currentImgCover}" />
        <img class="Back" src="${currentImgCover}" />
        <img class="BackCenter" src="${currentImgCover}" />
    `

    element.appendChild(dynamicBg)  
}