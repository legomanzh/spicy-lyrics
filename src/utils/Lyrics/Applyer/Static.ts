import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from "../../../components/Addons";
import Defaults from "../../../components/Defaults";
import { applyStyles, removeAllStyles } from "../../CSS/Styles";
import { ClearScrollSimplebar, MountScrollSimplebar, RecalculateScrollSimplebar, ScrollSimplebar } from "../../Scrolling/Simplebar/ScrollSimplebar";
import { ClearLyricsContentArrays, LyricsObject } from "../lyrics";
import { ApplyLyricsCredits } from "./Credits/ApplyLyricsCredits";


export function ApplyStaticLyrics(data) {
    if (!Defaults.LyricsContainerExists) return
    const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
    if (LyricsContainer.classList.contains("offline")) {
      LyricsContainer.classList.remove("offline");
    }

    ClearLyricsContentArrays();
    ClearScrollSimplebar();

    if (data.offline) {
      LyricsContainer.classList.add("offline");
    }

    removeAllStyles(LyricsContainer)

    if (data.classes) {
      LyricsContainer.className = data.classes;
    }

    if (data.styles) {
      applyStyles(LyricsContainer, data.styles);
    }

    TOP_ApplyLyricsSpacer(LyricsContainer)
    data.Lines.forEach(line => {
      const lineElem = document.createElement("div")
      
      if (line.Text.includes("[DEF=font_size:small]")) {
        lineElem.style.fontSize = "35px"
        lineElem.textContent = line.Text.replace("[DEF=font_size:small]", "")
      } else {
        lineElem.textContent = line.Text
      }
      
      lineElem.classList.add("line")
      lineElem.classList.add("static")

      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn")
      }

      LyricsObject.Types.Static.Lines.push({
        HTMLElement: lineElem,
      })
      
      LyricsContainer.appendChild(lineElem)
    })
    ApplyLyricsCredits(data);

    BOTTOM_ApplyLyricsSpacer(LyricsContainer)

    if (ScrollSimplebar) RecalculateScrollSimplebar();
      else MountScrollSimplebar();
}

