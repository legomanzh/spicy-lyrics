import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from "../../../Addons";
import Defaults from "../../../../components/Global/Defaults";
import { applyStyles, removeAllStyles } from "../../../CSS/Styles";
import { ClearScrollSimplebar, MountScrollSimplebar, RecalculateScrollSimplebar, ScrollSimplebar } from "../../../Scrolling/Simplebar/ScrollSimplebar";
import { ConvertTime } from "../../ConvertTime";
import { ClearLyricsContentArrays, lyricsBetweenShow, LyricsObject } from "../../lyrics";
import { ApplyLyricsCredits } from "../Credits/ApplyLyricsCredits";


export function ApplyLineLyrics(data) {
    if (!Defaults.LyricsContainerExists) return
    const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");

    ClearLyricsContentArrays();

    ClearScrollSimplebar();

    removeAllStyles(LyricsContainer)

    if (data.classes) {
      LyricsContainer.className = data.classes;
    }

    if (data.styles) {
      applyStyles(LyricsContainer, data.styles);
    }

    TOP_ApplyLyricsSpacer(LyricsContainer)
    if (data.StartTime >= lyricsBetweenShow) {
        const musicalLine = document.createElement("div")
        musicalLine.classList.add("line")
        musicalLine.classList.add("musical-line")

        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: 0,
          EndTime: ConvertTime(data.StartTime),
          TotalTime: ConvertTime(data.StartTime)
        })
    

        if (data.Content[0].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned")
        }
    
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
    
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
    
        const totalTime = ConvertTime(data.StartTime);
        const dotTime = totalTime / 3; 
    
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "•";

        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "•";

        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "•";
 
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
    
        musicalLine.appendChild(dotGroup);
        LyricsContainer.appendChild(musicalLine)
      }


    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div")
      lineElem.textContent = line.Text
      lineElem.classList.add("line")

      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn")
      }

      LyricsObject.Types.Line.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.StartTime),
        EndTime: ConvertTime(line.EndTime),
        TotalTime: ConvertTime(line.EndTime) - ConvertTime(line.StartTime)
      })
  

      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned")
      }


      LyricsContainer.appendChild(lineElem)
        if (arr[index + 1] && arr[index + 1].StartTime - line.EndTime >= lyricsBetweenShow) {
            const musicalLine = document.createElement("div")
            musicalLine.classList.add("line")
            musicalLine.classList.add("musical-line")

            LyricsObject.Types.Line.Lines.push({
                HTMLElement: musicalLine,
                StartTime: ConvertTime(line.EndTime),
                EndTime: ConvertTime(arr[index + 1].StartTime),
                TotalTime: ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime)
            })

            if (line.OppositeAligned) {
                musicalLine.classList.add("OppositeAligned")
            }

            const dotGroup = document.createElement("div");
            dotGroup.classList.add("dotGroup");

            const musicalDots1 = document.createElement("span");
            const musicalDots2 = document.createElement("span");
            const musicalDots3 = document.createElement("span");

            const totalTime = ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime);
            const dotTime = totalTime / 3; 

            musicalDots1.classList.add("word");
            musicalDots1.classList.add("dot");
            musicalDots1.textContent = "•";

            musicalDots2.classList.add("word");
            musicalDots2.classList.add("dot");
            musicalDots2.textContent = "•";

            musicalDots3.classList.add("word");
            musicalDots3.classList.add("dot");
            musicalDots3.textContent = "•";

            dotGroup.appendChild(musicalDots1);
            dotGroup.appendChild(musicalDots2);
            dotGroup.appendChild(musicalDots3);

            musicalLine.appendChild(dotGroup);
            LyricsContainer.appendChild(musicalLine)
        }
    })

   ApplyLyricsCredits(data);

   BOTTOM_ApplyLyricsSpacer(LyricsContainer)

   if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();
}
