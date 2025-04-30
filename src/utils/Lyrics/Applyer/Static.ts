import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from "../../Addons";
import Defaults from "../../../components/Global/Defaults";
import { applyStyles, removeAllStyles, StyleProperties } from "../../CSS/Styles";
import { ClearScrollSimplebar, MountScrollSimplebar, RecalculateScrollSimplebar, ScrollSimplebar } from "../../Scrolling/Simplebar/ScrollSimplebar";
import { ClearLyricsContentArrays, LyricsObject, LyricsStatic } from "../lyrics";
import { ApplyLyricsCredits } from "./Credits/ApplyLyricsCredits";
import isRtl from "../isRtl";
import { ClearLyricsPageContainer } from "../fetchLyrics";
import { EmitApply, EmitNotApplyed } from "./OnApply";

/**
 * Interface for static lyrics data
 */
export interface StaticLyricsData {
    Type: string;
    Content?: any;
    Lines: Array<{
        Text: string;
    }>;
    offline?: boolean;
    classes?: string;
    styles?: StyleProperties;
}

/**
 * Apply static lyrics to the lyrics container
 * @param data - Static lyrics data
 */
export function ApplyStaticLyrics(data: StaticLyricsData): void {
    if (!Defaults.LyricsContainerExists) return;

    EmitNotApplyed();
    const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent");

    if (!LyricsContainer) {
        console.error("Cannot apply static lyrics: LyricsContainer not found");
        return;
    }

    LyricsContainer.setAttribute("data-lyrics-type", "Static");

    ClearLyricsContentArrays();
    ClearScrollSimplebar();
    ClearLyricsPageContainer();

    TOP_ApplyLyricsSpacer(LyricsContainer);

    data.Lines.forEach(line => {
        const lineElem = document.createElement("div");

        if (line.Text.includes("[DEF=font_size:small]")) {
            lineElem.style.fontSize = "35px";
            lineElem.textContent = line.Text.replace("[DEF=font_size:small]", "");
        } else {
            lineElem.textContent = line.Text;
        }

        if (isRtl(line.Text) && !lineElem.classList.contains("rtl")) {
            lineElem.classList.add("rtl");
        }

        lineElem.classList.add("line");
        lineElem.classList.add("static");

        if (ArabicPersianRegex.test(line.Text)) {
            lineElem.setAttribute("font", "Vazirmatn");
        }

        // Add the line element to the lyrics object
        const staticLine: LyricsStatic = {
            HTMLElement: lineElem
        };

        LyricsObject.Types.Static.Lines.push(staticLine);
        LyricsContainer.appendChild(lineElem);
    });

    ApplyLyricsCredits(data);
    BOTTOM_ApplyLyricsSpacer(LyricsContainer);

    // Handle scrollbar
    if (ScrollSimplebar) {
        RecalculateScrollSimplebar();
    } else {
        MountScrollSimplebar();
    }

    // Apply styling to the content container
    const LyricsStylingContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content");

    if (LyricsStylingContainer) {
        if (data.offline) {
            LyricsStylingContainer.classList.add("offline");
        }

        removeAllStyles(LyricsStylingContainer);

        if (data.classes) {
            LyricsStylingContainer.className = data.classes;
        }

        if (data.styles) {
            applyStyles(LyricsStylingContainer, data.styles);
        }
    }

    EmitApply(data.Type, data.Content);
}