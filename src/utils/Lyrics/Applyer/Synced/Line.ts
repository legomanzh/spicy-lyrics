import Defaults from "../../../../components/Global/Defaults";
import { applyStyles, removeAllStyles } from "../../../CSS/Styles";
import { ClearScrollSimplebar, MountScrollSimplebar, RecalculateScrollSimplebar, ScrollSimplebar } from "../../../Scrolling/Simplebar/ScrollSimplebar";
import { ConvertTime } from "../../ConvertTime";
import { ClearLyricsContentArrays, LINE_SYNCED_CurrentLineLyricsObject, lyricsBetweenShow, LyricsObject, SetWordArrayInCurentLine_LINE_SYNCED } from "../../lyrics";
import { ApplyLyricsCredits } from "../Credits/ApplyLyricsCredits";
import isRtl from "../../isRtl";
import { ClearLyricsPageContainer } from "../../fetchLyrics";
import { EmitApply, EmitNotApplyed } from "../OnApply";
import { CreateLyricsContainer, DestroyAllLyricsContainers } from "../CreateLyricsContainer";

// Define the data structure for lyrics
interface LyricsLineData {
  Text: string;
  StartTime: number;
  EndTime: number;
  OppositeAligned?: boolean;
}

interface LyricsData {
  Type: string;
  Content: LyricsLineData[];
  StartTime: number;
  SongWriters?: string[];
  classes?: string;
  styles?: Record<string, string>;
}


export function ApplyLineLyrics(data: LyricsData): void {
    if (!Defaults.LyricsContainerExists) return;
    EmitNotApplyed();

    DestroyAllLyricsContainers();

    const LyricsContainerParent = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent");
    const LyricsContainerInstance = CreateLyricsContainer();
    const LyricsContainer = LyricsContainerInstance.Container;

    // Check if LyricsContainer exists
    if (!LyricsContainer) {
        console.error("LyricsContainer not found");
        return;
    }

    LyricsContainer.setAttribute("data-lyrics-type", "Line");

    ClearLyricsContentArrays();

    ClearScrollSimplebar();

    ClearLyricsPageContainer();


    if (data.StartTime >= lyricsBetweenShow) {
        const musicalLine = document.createElement("div")
        musicalLine.classList.add("line")
        musicalLine.classList.add("musical-line")

        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: 0,
          EndTime: ConvertTime(data.StartTime),
          TotalTime: ConvertTime(data.StartTime),
          DotLine: true
        })

        SetWordArrayInCurentLine_LINE_SYNCED();

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

        // Check if Syllables.Lead exists
        if (LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject]?.Syllables?.Lead) {
          LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
            HTMLElement: musicalDots1,
            StartTime: 0,
            EndTime: dotTime,
            TotalTime: dotTime,
            Dot: true
          });
        } else {
          console.warn("Syllables.Lead is undefined for LINE_SYNCED_CurrentLineLyricsObject");
        }

        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "•";

        // Check if Syllables.Lead exists
        if (LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject]?.Syllables?.Lead) {
          LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
            HTMLElement: musicalDots2,
            StartTime: dotTime,
            EndTime: dotTime * 2,
            TotalTime: dotTime,
            Dot: true
          });
        } else {
          console.warn("Syllables.Lead is undefined for LINE_SYNCED_CurrentLineLyricsObject");
        }

        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "•";

        // Check if Syllables.Lead exists
        if (LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject]?.Syllables?.Lead) {
          LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
            HTMLElement: musicalDots3,
            StartTime: dotTime * 2,
            EndTime: ConvertTime(data.StartTime) - 400,
            TotalTime: dotTime,
            Dot: true
          });
        } else {
          console.warn("Syllables.Lead is undefined for LINE_SYNCED_CurrentLineLyricsObject");
        }

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

      if (isRtl(line.Text) && !lineElem.classList.contains("rtl")) {
        lineElem.classList.add("rtl")
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
              TotalTime: ConvertTime(arr[index + 1].StartTime) - ConvertTime(line.EndTime),
              DotLine: true
            })

            SetWordArrayInCurentLine_LINE_SYNCED();

            if (arr[index + 1].OppositeAligned) {
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

            // Check if Syllables.Lead exists
            if (LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject]?.Syllables?.Lead) {
              LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
                HTMLElement: musicalDots1,
                StartTime: ConvertTime(line.EndTime),
                EndTime: ConvertTime(line.EndTime) + dotTime,
                TotalTime: dotTime,
                Dot: true
              });
            } else {
              console.warn("Syllables.Lead is undefined for LINE_SYNCED_CurrentLineLyricsObject");
            }

            musicalDots2.classList.add("word");
            musicalDots2.classList.add("dot");
            musicalDots2.textContent = "•";

            LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
              HTMLElement: musicalDots2,
              StartTime: ConvertTime(line.EndTime) + dotTime,
              EndTime: ConvertTime(line.EndTime) + (dotTime * 2),
              TotalTime: dotTime,
              Dot: true
            })

            musicalDots3.classList.add("word");
            musicalDots3.classList.add("dot");
            musicalDots3.textContent = "•";

            LyricsObject.Types.Line.Lines[LINE_SYNCED_CurrentLineLyricsObject].Syllables?.Lead.push({
              HTMLElement: musicalDots3,
              StartTime: ConvertTime(line.EndTime) + (dotTime * 2),
              EndTime: ConvertTime(arr[index + 1].StartTime) - 400,
              TotalTime: dotTime,
              Dot: true
            })

            dotGroup.appendChild(musicalDots1);
            dotGroup.appendChild(musicalDots2);
            dotGroup.appendChild(musicalDots3);

            musicalLine.appendChild(dotGroup);
            LyricsContainer.appendChild(musicalLine)
        }
    })

   ApplyLyricsCredits(data, LyricsContainer);

   
  if (LyricsContainerParent) {
    LyricsContainerInstance.Append(LyricsContainerParent);
  }

   if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();

  const LyricsStylingContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent .simplebar-content");

  // Check if LyricsStylingContainer exists
  if (LyricsStylingContainer) {
    removeAllStyles(LyricsStylingContainer);

    if (data.classes) {
      LyricsStylingContainer.className = data.classes;
    }

    if (data.styles) {
      applyStyles(LyricsStylingContainer, data.styles);
    }
  } else {
    console.warn("LyricsStylingContainer not found");
  }


  EmitApply(data.Type, data.Content)
}
