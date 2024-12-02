import CSSFilter from "../functions/CSSFilter";
import storage from "../functions/storage";


export default function ApplyDynamicBackground(element) {
    if (!element) return
    const currentImgCover = Spicetify.Player.data?.item.metadata.image_url
    
    const lowQMode = storage.get("lowQMode");
    const lowQModeEnabled = lowQMode && lowQMode === "true";

    /* Spicetify.colorExtractor(Spicetify.Player.data.item.uri).then(colors => {
        if (lowQModeEnabled) {
            element.style.backgroundColor = colors.DESATURATED;
        }
    }).catch(err => {
        console.error("Error extracting color:", err);
    }); */
    if (element?.querySelector(".spicy-dynamic-bg")) {
        element.querySelector(".spicy-dynamic-bg").remove();
    }
    const dynamicBg = document.createElement("div")
    dynamicBg.classList.add("spicy-dynamic-bg")

    if (lowQModeEnabled) {
        CSSFilter({ blur: "20px" }, currentImgCover).then(url => {
            dynamicBg.innerHTML = `
                <img class="Front NoEffect" src="${url}" />
                <img class="Back NoEffect" src="${url}" />
                <img class="BackCenter NoEffect" src="${url}" />
            `
        })
    } else {   
        dynamicBg.innerHTML = `
            <img class="Front" src="${currentImgCover}" />
            <img class="Back" src="${currentImgCover}" />
            <img class="BackCenter" src="${currentImgCover}" />
        `
    }
    
    element.appendChild(dynamicBg)
}