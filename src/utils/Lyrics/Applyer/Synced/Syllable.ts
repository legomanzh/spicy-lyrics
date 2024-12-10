import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from "../../../Addons";
import Defaults from "../../../../components/Global/Defaults";
import { applyStyles, removeAllStyles } from "../../../CSS/Styles";
import { ClearScrollSimplebar, MountScrollSimplebar, RecalculateScrollSimplebar, ScrollSimplebar } from "../../../Scrolling/Simplebar/ScrollSimplebar";
import { ConvertTime } from "../../ConvertTime";
import { ClearLyricsContentArrays, CurrentLineLyricsObject, lyricsBetweenShow, LyricsObject, SetWordArrayInCurentLine } from "../../lyrics";
import { ApplyLyricsCredits } from "../Credits/ApplyLyricsCredits";


export function ApplySyllableLyrics(data) {
  if (!Defaults.LyricsContainerExists) return;
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
    LyricsObject.Types.Syllable.Lines.push({
      HTMLElement: musicalLine,
      StartTime: 0,
      EndTime: ConvertTime(data.StartTime),
      TotalTime: ConvertTime(data.StartTime)
    })

    SetWordArrayInCurentLine();

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

    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: musicalDots1,
      StartTime: 0,
      EndTime: dotTime,
      TotalTime: dotTime,
      Dot: true
    })

    musicalDots2.classList.add("word");
    musicalDots2.classList.add("dot");
    musicalDots2.textContent = "•";

    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: musicalDots2,
      StartTime: dotTime,
      EndTime: dotTime * 2,
      TotalTime: dotTime,
      Dot: true
    })

    musicalDots3.classList.add("word");
    musicalDots3.classList.add("dot");
    musicalDots3.textContent = "•";

    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: musicalDots3,
      StartTime: dotTime * 2,
      EndTime: ConvertTime(data.StartTime) - 400,
      TotalTime: dotTime,
      Dot: true
    })

    dotGroup.appendChild(musicalDots1);
    dotGroup.appendChild(musicalDots2);
    dotGroup.appendChild(musicalDots3);

    musicalLine.appendChild(dotGroup);
    LyricsContainer.appendChild(musicalLine)
  }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div")
      lineElem.classList.add("line")

      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: lineElem,
        StartTime: ConvertTime(line.Lead.StartTime),
        EndTime: ConvertTime(line.Lead.EndTime),
        TotalTime: ConvertTime(line.Lead.EndTime) - ConvertTime(line.Lead.StartTime)
      });

      SetWordArrayInCurentLine();
  
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned")
      }

      
      LyricsContainer.appendChild(lineElem)
      

      line.Lead.Syllables.forEach((lead, iL, aL) => {
        let word = document.createElement("span")

        const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);

        const letterLength = lead.Text.split("").length;

        const IfLetterCapable = letterLength <= 12 && totalDuration >= 1000;

        if (IfLetterCapable) {
          
          word = document.createElement("div")
          const letters = lead.Text.split(""); // Split word into individual letters
          const letterDuration = (totalDuration - 70) / letters.length; // Duration per letter

          let Letters = [];

          letters.forEach((letter, index, lA) => {
            const letterElem = document.createElement("span");
            letterElem.textContent = letter;
            letterElem.classList.add("letter");
            letterElem.classList.add("Emphasis");
  
            // Calculate start and end time for each letter
            const letterStartTime = ConvertTime(lead.StartTime) + index * letterDuration;
            const letterEndTime = letterStartTime + letterDuration;

            index === lA.length - 1 ? lead.IsPartOfWord ? letterElem.classList.add("PartOfWord") : null : letterElem.classList.add("PartOfWord"); 

            if (ArabicPersianRegex.test(lead.Text)) {
              word.setAttribute("font", "Vazirmatn")
            }

           Letters.push({
              HTMLElement: letterElem,
              StartTime: letterStartTime,
              EndTime: letterEndTime,
              TotalTime: letterDuration,
              Emphasis: true
            })

            word.appendChild(letterElem);
          });
          word.classList.add("letterGroup");
          if (lead.IsPartOfWord) {
            word.classList.add("PartOfWord");
          }
          
          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: word,
            StartTime: ConvertTime(lead.StartTime),
            EndTime: ConvertTime(lead.EndTime),
            TotalTime: totalDuration,
            LetterGroup: true,
            Letters
          })

          Letters = []

          lineElem.appendChild(word);
          
        } else {
          word.textContent = lead.Text;

          if (ArabicPersianRegex.test(lead.Text)) {
            word.setAttribute("font", "Vazirmatn")
          }
  
          word.classList.add("word");

          if (lead.IsPartOfWord) {
            word.classList.add("PartOfWord");
          }
  
          lineElem.appendChild(word);

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: word,
            StartTime: ConvertTime(lead.StartTime),
            EndTime: ConvertTime(lead.EndTime),
            TotalTime: totalDuration
          })
        }
        
      })

      if (line.Background) {
        line.Background.forEach((bg) => {
          const lineE = document.createElement("div");
          lineE.classList.add("line")
    
          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: lineE,
            StartTime: ConvertTime(bg.StartTime),
            EndTime: ConvertTime(bg.EndTime),
            TotalTime: ConvertTime(bg.EndTime) - ConvertTime(bg.StartTime),
            BGLine: true
          })
          SetWordArrayInCurentLine();

          if (line.OppositeAligned) {
              lineE.classList.add("OppositeAligned")
          }
          LyricsContainer.appendChild(lineE)
          bg.Syllables.forEach(bw => {
            const bwE = document.createElement("span")
            bwE.textContent = bw.Text

            if (ArabicPersianRegex.test(bw.Text)) {
              bwE.setAttribute("font", "Vazirmatn")
            }

            LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
              HTMLElement: bwE,
              StartTime: ConvertTime(bw.StartTime),
              EndTime: ConvertTime(bw.EndTime),
              TotalTime: ConvertTime(bw.EndTime) - ConvertTime(bw.StartTime),
              BGWord: true
            })

            bwE.classList.add("bg-word")
            bwE.classList.add("word")

            if (bw.IsPartOfWord) {
              bwE.classList.add("PartOfWord");
            }
            lineE.appendChild(bwE)
          })
        })
      }
        if (arr[index + 1] && arr[index + 1].Lead.StartTime - line.Lead.EndTime >= lyricsBetweenShow) {
          const musicalLine = document.createElement("div")
          musicalLine.classList.add("line")
          musicalLine.classList.add("musical-line")

          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: musicalLine,
            StartTime: ConvertTime(line.Lead.EndTime),
            EndTime: ConvertTime(arr[index + 1].Lead.StartTime),
            TotalTime: ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime)
          })

          SetWordArrayInCurentLine();

          if (line.OppositeAligned) {
            musicalLine.classList.add("OppositeAligned")
          }
      
          const dotGroup = document.createElement("div");
          dotGroup.classList.add("dotGroup");
      
          const musicalDots1 = document.createElement("span");
          const musicalDots2 = document.createElement("span");
          const musicalDots3 = document.createElement("span");
      
          const totalTime = ConvertTime(arr[index + 1].Lead.StartTime) - ConvertTime(line.Lead.EndTime);
          const dotTime = totalTime / 3; 
      
          musicalDots1.classList.add("word");
          musicalDots1.classList.add("dot");
          musicalDots1.textContent = "•";

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots1,
            StartTime: ConvertTime(line.Lead.EndTime),
            EndTime: ConvertTime(line.Lead.EndTime) + dotTime,
            TotalTime: dotTime,
            Dot: true
          })
      
          musicalDots2.classList.add("word");
          musicalDots2.classList.add("dot");
          musicalDots2.textContent = "•";

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots2,
            StartTime: ConvertTime(line.Lead.EndTime) + dotTime,
            EndTime: ConvertTime(line.Lead.EndTime) + (dotTime * 2),
            TotalTime: dotTime,
            Dot: true
          })
      
          musicalDots3.classList.add("word");
          musicalDots3.classList.add("dot");
          musicalDots3.textContent = "•";

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots3,
            StartTime: ConvertTime(line.Lead.EndTime) + (dotTime * 2),
            EndTime: ConvertTime(arr[index + 1].Lead.StartTime) - 400,
            TotalTime: dotTime,
            Dot: true
          })
      
          dotGroup.appendChild(musicalDots1);
          dotGroup.appendChild(musicalDots2);
          dotGroup.appendChild(musicalDots3);
      
          musicalLine.appendChild(dotGroup);
          LyricsContainer.appendChild(musicalLine)
        }
  });

  ApplyLyricsCredits(data);

  BOTTOM_ApplyLyricsSpacer(LyricsContainer)

  if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();
}

