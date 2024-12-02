import storage from './storage';
import { Maid } from '@spikerko/web-modules/Maid';
import { IntervalManager } from './IntervalManager';
import Defaults from '../components/Defaults';
import { ArabicPersianRegex, BOTTOM_ApplyLyricsSpacer, TOP_ApplyLyricsSpacer } from '../components/Addons';
import { SpotifyPlayer } from '../components/SpotifyPlayer';
import SimpleBar from 'simplebar';
import { GetElementHeight } from './GetElementHeight';
import { Timeout } from '@spikerko/web-modules/Scheduler';

export const ScrollingIntervalTime = 0.1;

function convertTime(time: any): any { 
  return time * 1000;
}

const lyricsBetweenShow = 5;
const timeOffset = 0;
const DurationTimeOffset = 0;

export let ScrollSimplebar: SimpleBar;

let IsMouseInLyricsPage = false;

function LyricsPageMouseEnter() {
  IsMouseInLyricsPage = true;
}

function LyricsPageMouseLeave() {
  IsMouseInLyricsPage = false;
}

function MountScrollSimplebar() {
  const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");

  LyricsContainer.style.height = `${GetElementHeight(LyricsContainer)}px`

  ScrollSimplebar = new SimpleBar(LyricsContainer, { autoHide: false });

  document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics")?.addEventListener("mouseenter", LyricsPageMouseEnter)

  document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics")?.addEventListener("mouseleave", LyricsPageMouseLeave)
}

function ClearScrollSimplebar() {
  ScrollSimplebar?.unMount();
  ScrollSimplebar = null;
  IsMouseInLyricsPage = false;
  document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics")?.removeEventListener("mouseenter", LyricsPageMouseEnter)
  document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics")?.removeEventListener("mouseleave", LyricsPageMouseLeave)
}

function RecalculateScrollSimplebar() {
  ScrollSimplebar?.recalculate();
}

new IntervalManager(Infinity, () => {
  const LyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
  if (!LyricsContainer) return;
  if (IsMouseInLyricsPage) {
    LyricsContainer.classList.remove("hide-scrollbar")
  } else {
    if (ScrollSimplebar.isDragging) {
      LyricsContainer.classList.remove("hide-scrollbar")
    } else {
      LyricsContainer.classList.add("hide-scrollbar")
    }
  }
}).Start();

/* 
OLD!!
const WordBlurs = {
  Emphasis: {
    min: 4,
    max: 14,
    LowQualityMode: {
      min: 2,
      max: 6
    }
  },
  min: 6,
  max: 16,
  LowQualityMode: {
    min: 4,
    max: 8
  }
} */

// Adjust blur levels in low-quality mode for better performance
const WordBlurs = {
  Emphasis: {
      min: 4,
      max: 14,
      LowQualityMode: {
          min: 1, // Lowered from 2 for better performance
          max: 3  // Lowered from 6
      }
  },
  min: 3,
  max: 9,
  LowQualityMode: {
      min: 2, // Lowered from 4
      max: 6  // Lowered from 8
  }
};


/* const musicalEmoji = "♪"

const lyricsBlur = "none"
let textGlowDef = "rgba(255,255,255,0.15) 0px 0px 6px"
let activeTextGlowDef = "rgba(255,255,255,0.4) 0px 0px 14px"
const globalOpacityLyr = "0.65"

const gradientAlpha = "0.85";
const gradientAlphaEnd = "0.4"; */

export function checkLowQStatus() {
  const lowQMode = storage.get("lowQMode");

  if (lowQMode && lowQMode == "true") {

    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").style.setProperty("--TextGlowDef", "rgba(255,255,255,0.07) 0px 0px 2px")
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").style.setProperty("--ActiveTextGlowDef", "rgba(255,255,255,0.24) 0px 0px 5px")
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").style.setProperty("--StrongTextGlowDef", "rgba(255,255,255,0.35) 0px 0px 5.3px")
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").style.setProperty("--StrongerTextGlowDef", "rgba(255,255,255,0.4) 0px 0px 4.9px")
    /* textGlowDef = "rgba(255,255,255,0.07) 0px 0px 2px"
    activeTextGlowDef = "rgba(255,255,255,0.24) 0px 0px 5px" */
  }
}

let LyricsObject = {
  Types: {
    Syllable: {
      Lines: []
    },
    Line: {
      Lines: []
    },
    Static: {
      Lines: []
    }
  }
}

let CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;

function SetWordArrayInAllLines() {
  LyricsObject.Types.Syllable.Lines.forEach((_, i) => {
    LyricsObject.Types.Syllable.Lines[i].Syllables = {};
    LyricsObject.Types.Syllable.Lines[i].Syllables.Lead = [];
  })
}

function SetWordArrayInCurentLine() {
  CurrentLineLyricsObject = LyricsObject.Types.Syllable.Lines.length - 1;

  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables = {};
  LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead = [];
}

function ClearLyricsContentArrays() {
  LyricsObject.Types.Syllable.Lines = []
  LyricsObject.Types.Line.Lines = []
  LyricsObject.Types.Static.Lines = []
}

/* function Lyrics_CalculateYPositions() {
  const container = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");

  if (!container || Defaults.CurrentLyricsType === "None") return;

  const lines = LyricsObject.Types[Defaults.CurrentLyricsType].Lines;

  // Scrollable container dimensions
  const containerScrollHeight = container.scrollHeight;
  const containerVisibleHeight = container.offsetHeight;

  // Base container position (top of the scrollable area)
  const containerRect = container.getBoundingClientRect();

  lines.forEach((line, i, arr) => {
      if (line.HTMLElement) {
          const lineRect = line.HTMLElement.getBoundingClientRect();
          const linePositionInContainer = lineRect.top - containerRect.top + container.scrollTop;

          // Ensure YPosition accounts for current scroll state and total scrollable height
          line.YPosition = Math.min(
              Math.max(0, linePositionInContainer - containerVisibleHeight / 2), // Center line in view
              containerScrollHeight - containerVisibleHeight // Avoid overscrolling at the bottom
          ) - (containerScrollHeight - linePositionInContainer);
      }
  });
} */


function ApplyLyricsCredits(data) {
  const LyricsContainer = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics");
  if (!data?.SongWriters) return;
  const CreditsElement = document.createElement("div");
  CreditsElement.classList.add("Credits");

  const SongWriters = data.SongWriters.join(", ");
  CreditsElement.textContent = `Song Writers: ${SongWriters}`
  LyricsContainer.appendChild(CreditsElement);
}


export function syllableLyrics(data) {
  if (!Defaults.LyricsContainerExists) return
  ClearLyricsContentArrays();

  ClearScrollSimplebar();

  removeAllStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

  if (data.classes) {
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").className = data.classes;
  }

  if (data.styles) {
    applyStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"), data.styles);
  }
/*   const topSpace = document.createElement("div")
  topSpace.classList.add("topSpace")
  document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(topSpace) */
  TOP_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))
  if (data.StartTime >= lyricsBetweenShow) {
    const musicalLine = document.createElement("div")
    musicalLine.classList.add("line")
    musicalLine.classList.add("musical-line")
    /* musicalLine.setAttribute("start", "0")
    musicalLine.setAttribute("end", convertTime(data.StartTime))
    musicalLine.setAttribute("total", convertTime(data.StartTime)) */
    LyricsObject.Types.Syllable.Lines.push({
      HTMLElement: musicalLine,
      StartTime: 0,
      EndTime: convertTime(data.StartTime),
      TotalTime: convertTime(data.StartTime)
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

    const totalTime = convertTime(data.StartTime);
    const dotTime = totalTime / 3; 

    musicalDots1.classList.add("word");
    musicalDots1.classList.add("dot");
    musicalDots1.textContent = "•";
    /* musicalDots1.setAttribute("start", 0);
    musicalDots1.setAttribute("end", dotTime);
    musicalDots1.setAttribute("total", dotTime); */
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
    /* musicalDots2.setAttribute("start", dotTime);
    musicalDots2.setAttribute("end", dotTime * 2);
    musicalDots2.setAttribute("total", dotTime); */
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
    /* musicalDots3.setAttribute("start", dotTime * 2);
    musicalDots3.setAttribute("end", convertTime(data.StartTime) - 400);
    musicalDots3.setAttribute("total", dotTime); */

    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
      HTMLElement: musicalDots3,
      StartTime: dotTime * 2,
      EndTime: convertTime(data.StartTime) - 400,
      TotalTime: dotTime,
      Dot: true
    })

    dotGroup.appendChild(musicalDots1);
    dotGroup.appendChild(musicalDots2);
    dotGroup.appendChild(musicalDots3);

    musicalLine.appendChild(dotGroup);
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(musicalLine)
  }
    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div")
      lineElem.classList.add("line")
      //const lastWordEndTime = line.Lead.Syllables[line.Lead.Syllables.length - 1].EndTime;
      /* lineElem.setAttribute("start", convertTime(line.Lead.StartTime))
      lineElem.setAttribute("end", convertTime(line.Lead.EndTime))
      lineElem.setAttribute("total", convertTime(line.Lead.EndTime) - convertTime(line.Lead.StartTime)) */

      LyricsObject.Types.Syllable.Lines.push({
        HTMLElement: lineElem,
        StartTime: convertTime(line.Lead.StartTime),
        EndTime: convertTime(line.Lead.EndTime),
        TotalTime: convertTime(line.Lead.EndTime) - convertTime(line.Lead.StartTime)
      });

      SetWordArrayInCurentLine();
  
      //
      //lineElem.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
      /* lineElem.style.setProperty("--gradient-position", "100%")
      lineElem.style.setProperty("--gradient-alpha", "0.4")
      lineElem.style.setProperty("--gradient-alpha-end", "0.4")
      lineElem.style.setProperty("--gradient-degrees", "90deg") */
      //lineElem.style.opacity = globalOpacityLyr
  
      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned")
      }

      

      /* if (index === 0) {
        const topSpace = document.createElement("div")
        topSpace.classList.add("topSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(topSpace)
      } */

      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineElem)
      
      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild("<br>")
  
      
  
      line.Lead.Syllables.forEach((lead, iL, aL) => {
        let word = document.createElement("span")
        //word.textContent = lead.Text
        const totalDuration = convertTime(lead.EndTime) - convertTime(lead.StartTime);

        const letterLength = lead.Text.split("").length;

        const IfLetterCapable = letterLength <= 12 && totalDuration >= 1000;//lead.Text.split("").length <= 3 && totalDuration >= 850 ? true : false;//totalDuration >= 1620 && lead.Text.split("").length < 12;

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
            //letterElem.style.setProperty("--Duration", `${letterDuration + DurationTimeOffset}ms`)
  
            // Calculate start and end time for each letter
            const letterStartTime = convertTime(lead.StartTime) + index * letterDuration;
            const letterEndTime = letterStartTime + letterDuration;
  
            /* letterElem.setAttribute("start", letterStartTime);
            letterElem.setAttribute("end", letterEndTime);
            letterElem.setAttribute("total", letterDuration); */

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
            StartTime: convertTime(lead.StartTime),
            EndTime: convertTime(lead.EndTime),
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
  
          /* word.setAttribute("start", convertTime(lead.StartTime))
          word.setAttribute("end", convertTime(lead.EndTime))
          word.setAttribute("total", totalDuration) */

          

          //word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
         /*  word.style.setProperty("--gradient-position", "100%")
          word.style.setProperty("--gradient-alpha", "0.4")
          word.style.setProperty("--gradient-alpha-end", "0.4")
          word.style.setProperty("--gradient-degrees", "90deg")  */
          //word.style.opacity = globalOpacityLyr
          //lineElem.appendChild(word)
          
    
          
    
          word.classList.add("word");
          //word.style.setProperty("--Duration", `${totalDuration + DurationTimeOffset}ms`)

          if (lead.IsPartOfWord) {
            word.classList.add("PartOfWord");
          }
  
          lineElem.appendChild(word);

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: word,
            StartTime: convertTime(lead.StartTime),
            EndTime: convertTime(lead.EndTime),
            TotalTime: totalDuration
          })
        }
  
       
  
       /*  document.querySelector('#SpicyLyricsPage .lyricsParent .lyrics').style.ponterEvents = null
  
        document.querySelector('#SpicyLyricsPage .lyricsParent .llparent').style.display = 'none'
        document.querySelector('#SpicyLyricsPage .lyricsParent .bgcover').style.display = 'none' */
  
        //if (lyricsInt !== false) {
          /* clearInterval(lyricsInt)
          lyricsInt = null; */
        //}
  
        
        
      })
      if (line.Background) {
        line.Background.forEach((bg) => {
          const lineE = document.createElement("div");
          lineE.classList.add("line")
          /* lineE.setAttribute("start", convertTime(bg.StartTime))
          lineE.setAttribute("end", convertTime(bg.EndTime))
          lineE.setAttribute("total", convertTime(bg.EndTime) - convertTime(bg.StartTime)) */
          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: lineE,
            StartTime: convertTime(bg.StartTime),
            EndTime: convertTime(bg.EndTime),
            TotalTime: convertTime(bg.EndTime) - convertTime(bg.StartTime),
            BGLine: true
          })
          SetWordArrayInCurentLine();
          //lineE.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
          /* lineE.style.setProperty("--gradient-position", "100%")
          lineE.style.setProperty("--gradient-alpha", "0.4")
          lineE.style.setProperty("--gradient-alpha-end", "0.4")
          lineE.style.setProperty("--gradient-degrees", "90deg") */
          //lineE.style.opacity = globalOpacityLyr
          if (line.OppositeAligned) {
              lineE.classList.add("OppositeAligned")
          }
          document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineE)
          bg.Syllables.forEach(bw => {
            const bwE = document.createElement("span")
            bwE.textContent = bw.Text

            if (ArabicPersianRegex.test(bw.Text)) {
              bwE.setAttribute("font", "Vazirmatn")
            }
            /* bwE.setAttribute("start", convertTime(bw.StartTime))
            bwE.setAttribute("end", convertTime(bw.EndTime))
            bwE.setAttribute("total", convertTime(bw.EndTime) - convertTime(bw.StartTime)) */

            LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
              HTMLElement: bwE,
              StartTime: convertTime(bw.StartTime),
              EndTime: convertTime(bw.EndTime),
              TotalTime: convertTime(bw.EndTime) - convertTime(bw.StartTime),
              BGWord: true
            })

            bwE.classList.add("bg-word")
            bwE.classList.add("word")
            bwE.style.setProperty("--Duration", `${(bg.EndTime - bg.StartTime) + DurationTimeOffset}ms`)
            //bwE.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
            /* bwE.style.setProperty("--gradient-position", "100%")
            bwE.style.setProperty("--gradient-alpha", "0.4")
            bwE.style.setProperty("--gradient-alpha-end", "0.4")
            bwE.style.setProperty("--gradient-degrees", "90deg") */
           // bwE.style.opacity = globalOpacityLyr

            if (bw.IsPartOfWord) {
              bwE.classList.add("PartOfWord");
            }
            lineE.appendChild(bwE)
          })
        })
      }
      try {
        if (arr[index + 1].Lead.StartTime - line.Lead.EndTime >= lyricsBetweenShow) {
          const musicalLine = document.createElement("div")
          musicalLine.classList.add("line")
          musicalLine.classList.add("musical-line")
          //musicalLine.textContent = musicalEmoji
          /* musicalLine.style.setProperty("--gradient-position", "100%")
          musicalLine.style.setProperty("--gradient-alpha", "0.4")
          musicalLine.style.setProperty("--gradient-alpha-end", "0.4")
          musicalLine.style.setProperty("--gradient-degrees", "90deg") */
          //musicalLine.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
          /* musicalLine.setAttribute("start", convertTime(line.Lead.EndTime))
          musicalLine.setAttribute("end", convertTime(arr[index + 1].Lead.StartTime))
          musicalLine.setAttribute("total", convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime)) */

          LyricsObject.Types.Syllable.Lines.push({
            HTMLElement: musicalLine,
            StartTime: convertTime(line.Lead.EndTime),
            EndTime: convertTime(arr[index + 1].Lead.StartTime),
            TotalTime: convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime)
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
      
          const totalTime = convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime);
          const dotTime = totalTime / 3; 
      
          musicalDots1.classList.add("word");
          musicalDots1.classList.add("dot");
          musicalDots1.textContent = "•";
          /* musicalDots1.setAttribute("start", convertTime(line.Lead.EndTime));
          musicalDots1.setAttribute("end", convertTime(line.Lead.EndTime) + dotTime);
          musicalDots1.setAttribute("total", dotTime); */

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots1,
            StartTime: convertTime(line.Lead.EndTime),
            EndTime: convertTime(line.Lead.EndTime) + dotTime,
            TotalTime: dotTime,
            Dot: true
          })
      
          musicalDots2.classList.add("word");
          musicalDots2.classList.add("dot");
          musicalDots2.textContent = "•";
          /* musicalDots2.setAttribute("start", convertTime(line.Lead.EndTime) + dotTime);
          musicalDots2.setAttribute("end", convertTime(line.Lead.EndTime) + (dotTime * 2));
          musicalDots2.setAttribute("total", dotTime); */

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots2,
            StartTime: convertTime(line.Lead.EndTime) + dotTime,
            EndTime: convertTime(line.Lead.EndTime) + (dotTime * 2),
            TotalTime: dotTime,
            Dot: true
          })
      
          musicalDots3.classList.add("word");
          musicalDots3.classList.add("dot");
          musicalDots3.textContent = "•";
          /* musicalDots3.setAttribute("start", convertTime(line.Lead.EndTime) + (dotTime * 2));
          musicalDots3.setAttribute("end", convertTime(arr[index + 1].Lead.StartTime) - 400);
          musicalDots3.setAttribute("total", dotTime); */

          LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
            HTMLElement: musicalDots3,
            StartTime: convertTime(line.Lead.EndTime) + (dotTime * 2),
            EndTime: convertTime(arr[index + 1].Lead.StartTime) - 400,
            TotalTime: dotTime,
            Dot: true
          })
      
          dotGroup.appendChild(musicalDots1);
          dotGroup.appendChild(musicalDots2);
          dotGroup.appendChild(musicalDots3);
      
          musicalLine.appendChild(dotGroup);
          document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(musicalLine)
        }
      } catch (error) {
        
      }
    });
    

    //Lyrics_CalculateYPositions()

    /* data.Content.forEach(line => {
      if (line.Background) {
        line.Background.forEach(bg => {
          const lineE = document.createElement("div");
          lineE.classList.add("line")
          lineE.setAttribute("start", convertTime(bg.StartTime))
          lineE.setAttribute("end", convertTime(bg.EndTime))
          document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineE)
          bg.Syllables.forEach(bw => {
            const bwE = document.createElement("span")
            bwE.textContent = bw.Text
            lineE.setAttribute("start", convertTime(bw.StartTime))
            lineE.setAttribute("end", convertTime(bw.EndTime))
            bwE.classList.add("bg-word")
            bwE.classList.add("word")
            lineE.appendChild(bwE)
            if (!bw.IsPartOfWord) {
              lineE.append(" ")
            }
          })
        })
      }
    }) */
      //startLyricsInInt("Syllable")

  //}) 
  ApplyLyricsCredits(data);

  BOTTOM_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

  if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();
}
  
  export function lineLyrics(data) {
    if (!Defaults.LyricsContainerExists) return

    ClearLyricsContentArrays();

    ClearScrollSimplebar();

    removeAllStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

    if (data.classes) {
      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").className = data.classes;
    }

    if (data.styles) {
      applyStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"), data.styles);
    }

/*     const topSpace = document.createElement("div")
    topSpace.classList.add("topSpace")
    document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(topSpace) */
    TOP_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))
      if (data.StartTime >= lyricsBetweenShow) {
        const musicalLine = document.createElement("div")
        musicalLine.classList.add("line")
        musicalLine.classList.add("musical-line")
        /* musicalLine.setAttribute("start", "0")
        musicalLine.setAttribute("end", convertTime(data.StartTime))
        musicalLine.setAttribute("total", convertTime(data.StartTime)) */

        LyricsObject.Types.Line.Lines.push({
          HTMLElement: musicalLine,
          StartTime: 0,
          EndTime: convertTime(data.StartTime),
          TotalTime: convertTime(data.StartTime)
        })
    

        if (data.Content[0].OppositeAligned) {
          musicalLine.classList.add("OppositeAligned")
        }
    
        const dotGroup = document.createElement("div");
        dotGroup.classList.add("dotGroup");
    
        const musicalDots1 = document.createElement("span");
        const musicalDots2 = document.createElement("span");
        const musicalDots3 = document.createElement("span");
    
        const totalTime = convertTime(data.StartTime);
        const dotTime = totalTime / 3; 
    
        musicalDots1.classList.add("word");
        musicalDots1.classList.add("dot");
        musicalDots1.textContent = "•";
        /* musicalDots1.setAttribute("start", 0);
        musicalDots1.setAttribute("end", dotTime);
        musicalDots1.setAttribute("total", dotTime); */

        musicalDots2.classList.add("word");
        musicalDots2.classList.add("dot");
        musicalDots2.textContent = "•";
        /* musicalDots2.setAttribute("start", dotTime);
        musicalDots2.setAttribute("end", dotTime * 2);
        musicalDots2.setAttribute("total", dotTime); */

        musicalDots3.classList.add("word");
        musicalDots3.classList.add("dot");
        musicalDots3.textContent = "•";
        /* musicalDots3.setAttribute("start", dotTime * 2);
        musicalDots3.setAttribute("end", convertTime(data.StartTime) - 400);
        musicalDots3.setAttribute("total", dotTime); */
    
        dotGroup.appendChild(musicalDots1);
        dotGroup.appendChild(musicalDots2);
        dotGroup.appendChild(musicalDots3);
    
        musicalLine.appendChild(dotGroup);
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(musicalLine)
      }


    data.Content.forEach((line, index, arr) => {
      const lineElem = document.createElement("div")
      lineElem.textContent = line.Text
      lineElem.classList.add("line")

      if (ArabicPersianRegex.test(line.Text)) {
        lineElem.setAttribute("font", "Vazirmatn")
      }

      //lineElem.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
      /* lineElem.style.setProperty("--gradient-position", "100%")
          lineElem.style.setProperty("--gradient-alpha", "0.4")
          lineElem.style.setProperty("--gradient-alpha-end", "0.4")
          lineElem.style.setProperty("--gradient-degrees", "90deg") */
      //lineElem.style.opacity = globalOpacityLyr
      /* lineElem.setAttribute("start", convertTime(line.StartTime))
      lineElem.setAttribute("end", convertTime(line.EndTime))
      lineElem.setAttribute("total", convertTime(line.EndTime) - convertTime(line.StartTime)) */

      LyricsObject.Types.Line.Lines.push({
        HTMLElement: lineElem,
        StartTime: convertTime(line.StartTime),
        EndTime: convertTime(line.EndTime),
        TotalTime: convertTime(line.EndTime) - convertTime(line.StartTime)
      })
  

      if (line.OppositeAligned) {
        lineElem.classList.add("OppositeAligned")
      }

      

      /* if (index === 0) {
        const topSpace = document.createElement("div")
        topSpace.classList.add("topSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(topSpace)
      } */

      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineElem)
  
      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild("<br>")
      
  
        /* document.querySelector('#SpicyLyricsPage .lyricsParent .lyrics').style.ponterEvents = null
  
        document.querySelector('#SpicyLyricsPage .lyricsParent .llparent').style.display = 'none'
        document.querySelector('#SpicyLyricsPage .lyricsParent .bgcover').style.display = 'none' */
  
          /* clearInterval(lyricsInt)
          lyricsInt = null; */
  

        try {
          if (arr[index + 1].StartTime - line.EndTime >= lyricsBetweenShow) {
            const musicalLine = document.createElement("div")
            musicalLine.classList.add("line")
            musicalLine.classList.add("musical-line")
            //musicalLine.textContent = musicalEmoji
            /* musicalLine.style.setProperty("--gradient-position", "100%")
            musicalLine.style.setProperty("--gradient-alpha", "0.4")
            musicalLine.style.setProperty("--gradient-alpha-end", "0.4")
            musicalLine.style.setProperty("--gradient-degrees", "90deg") */
            //musicalLine.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
            /* musicalLine.setAttribute("start", convertTime(line.Lead.EndTime))
            musicalLine.setAttribute("end", convertTime(arr[index + 1].Lead.StartTime))
            musicalLine.setAttribute("total", convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime)) */

            LyricsObject.Types.Line.Lines.push({
              HTMLElement: lineElem,
              StartTime: convertTime(line.Lead.EndTime),
              EndTime: convertTime(arr[index + 1].Lead.StartTime),
              TotalTime: convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime)
            })

            if (line.OppositeAligned) {
              musicalLine.classList.add("OppositeAligned")
            }
        
            const dotGroup = document.createElement("div");
            dotGroup.classList.add("dotGroup");
        
            const musicalDots1 = document.createElement("span");
            const musicalDots2 = document.createElement("span");
            const musicalDots3 = document.createElement("span");
        
            const totalTime = convertTime(arr[index + 1].Lead.StartTime) - convertTime(line.Lead.EndTime);
            const dotTime = totalTime / 3; 
        
            musicalDots1.classList.add("word");
            musicalDots1.classList.add("dot");
            musicalDots1.textContent = "•";
            /* musicalDots1.setAttribute("start", convertTime(line.Lead.EndTime));
            musicalDots1.setAttribute("end", convertTime(line.Lead.EndTime) + dotTime);
            musicalDots1.setAttribute("total", dotTime); */
        
            musicalDots2.classList.add("word");
            musicalDots2.classList.add("dot");
            musicalDots2.textContent = "•";
            /* musicalDots2.setAttribute("start", convertTime(line.Lead.EndTime) + dotTime);
            musicalDots2.setAttribute("end", convertTime(line.Lead.EndTime) + (dotTime * 2));
            musicalDots2.setAttribute("total", dotTime); */
        
            musicalDots3.classList.add("word");
            musicalDots3.classList.add("dot");
            musicalDots3.textContent = "•";
            /* musicalDots3.setAttribute("start", convertTime(line.Lead.EndTime) + (dotTime * 2));
            musicalDots3.setAttribute("end", convertTime(arr[index + 1].Lead.StartTime) - 400);
            musicalDots3.setAttribute("total", dotTime); */
        
            dotGroup.appendChild(musicalDots1);
            dotGroup.appendChild(musicalDots2);
            dotGroup.appendChild(musicalDots3);
        
            musicalLine.appendChild(dotGroup);
            document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(musicalLine)
          }
        } catch (error) {
          
        }
    })
    /* data.Content.forEach(line => {
      if (line.Background) {
        line.Background.forEach(bg => {
            const lineE = document.createElement("div");
            lineE.textContent = bg.Text
            lineE.classList.add("bg-line")
            lineE.classList.add("line")
            lineE.setAttribute("start", convertTime(bg.StartTime))
            lineE.setAttribute("end", convertTime(bg.EndTime))
            document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineE)
            bg.Syllables.forEach(bw => {
              const bwE = document.createElement("span")
              bwE.textContent = bw.Text
              bwE.classList.add("bg-word")
              bwE.classList.add("word")
              lineE.appendChild(bwE)
              if (!bw.IsPartOfWord) {
                lineE.append(" ")
              }
            }) 
          })
      }
    }) */
      //startLyricsInInt("Line");
  
   //Lyrics_CalculateYPositions()
   ApplyLyricsCredits(data);

   BOTTOM_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

   if (ScrollSimplebar) RecalculateScrollSimplebar();
    else MountScrollSimplebar();
  }

function applyStyles(element, styles) {
    if (element) {
        Object.entries(styles).forEach(([key, value]) => {
            element.style[key] = value;
        });
    } else {
        console.warn("Element not found");
    }
}

function removeAllStyles(element) {
    if (element) {
        element.style = null
    } else {
        console.warn("Element not found");
    }
}


  export function staticLyrics(data) {
    if (!Defaults.LyricsContainerExists) return
    if (document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").classList.contains("offline")) {
      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").classList.remove("offline");
    }

    ClearLyricsContentArrays();

    ClearScrollSimplebar();

    if (data.offline) {
      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").classList.add("offline");
    }

    removeAllStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

    if (data.classes) {
      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").className = data.classes;
    }

    if (data.styles) {
      applyStyles(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"), data.styles);
    }
    TOP_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))
    data.Lines.forEach((line, index, arr) => {
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

      //lineElem.setAttribute("start", convertTime(line.StartTime))
      //lineElem.setAttribute("end", convertTime(line.EndTime))

      LyricsObject.Types.Static.Lines.push({
        HTMLElement: lineElem,
      })
      
      /* if (index === 0) {
        const topSpace = document.createElement("div")
        topSpace.classList.add("topSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(topSpace)
      } */

      

      document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineElem)

      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics").appendChild("<br>")
      
  
  
          /* clearInterval(lyricsInt)
          lyricsInt = null */

        //document.querySelector("#SpicyLyricsPage .lyricsParent .informationBox").textContent = "These lyrics haven't been synced yet."
  
    })
    ApplyLyricsCredits(data);

    BOTTOM_ApplyLyricsSpacer(document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"))

    if (ScrollSimplebar) RecalculateScrollSimplebar();
      else MountScrollSimplebar();
  }

 //let isScrolling = false; // Flag to track scrolling state
  //let scrollTimeout; // Define scrollTimeout outside the listener
/*   let isHovering = false;
  let moveTimeout;

  setInterval(() => {
    if (!document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics")) return;
    const lyricsContainer = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
  
    /* lyricsContainer.addEventListener('scroll', () => {
      isScrolling = true;
  
      // Reset scrolling flag after a short delay
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 1000);
    }); 
  
    lyricsContainer.addEventListener('mousemove', () => {
      isHovering = true; // Set isMoving to true on mousemove
  
      clearTimeout(moveTimeout); // Clear previous timeout
      moveTimeout = setTimeout(() => {
        isHovering = false; // Set isMoving back to false after a delay
      }, 2000); // Adjust delay as needed
    });
  }, 200) */

const lowQMode = storage.get("lowQMode");
const lowQModeEnabled = lowQMode && lowQMode === "true";
//let lastGradientPercentage = 0;
/* let lastGradientUpdate = 0;

const TransitionDurationProperties = {
  IfSmallerThan: 140,
  Use: 200
} */

const BlurMultiplier = 0.5;

function SetLyricsStatuses(PreCurrentPosition) {
  const CurrentPosition = PreCurrentPosition + timeOffset;
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  if (CurrentLyricsType && CurrentLyricsType === "None") return;
  const lines = LyricsObject.Types[CurrentLyricsType].Lines;

  if (CurrentLyricsType === "Syllable") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const lineTimes = {
        start: line.StartTime,
        end: line.EndTime,
        total: line.EndTime - line.StartTime
      }

      if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end) {
        line.Status = "Active";

        const words = line.Syllables.Lead;
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          if (word.StartTime <= CurrentPosition && CurrentPosition <= word.EndTime) {
            word.Status = "Active";
          } else if (word.StartTime >= CurrentPosition) {
            word.Status = "NotSung";
          } else if (word.EndTime <= CurrentPosition) {
            word.Status = "Sung";
          }

          if (word?.LetterGroup) {
            for (let k = 0; k < word.Letters.length; k++) {
              const letter = word.Letters[k];
              if (letter.StartTime <= CurrentPosition && CurrentPosition <= letter.EndTime) {
                letter.Status = "Active";
              } else if (letter.StartTime >= CurrentPosition) {
                letter.Status = "NotSung";
              } else if (letter.EndTime <= CurrentPosition) {
                letter.Status = "Sung";
              }
            }
          }

        }

      } else if (lineTimes.start >= CurrentPosition) {
        line.Status = "NotSung";

        const words = line.Syllables.Lead;
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          word.Status = "NotSung";

          if (word?.LetterGroup) {
            for (let k = 0; k < word.Letters.length; k++) {
              const letter = word.Letters[k];
              letter.Status = "NotSung";
            }
          }
        }
      } else if (lineTimes.end <= CurrentPosition) {
        line.Status = "Sung";

        const words = line.Syllables.Lead;
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          word.Status = "Sung";

          if (word?.LetterGroup) {
            for (let k = 0; k < word.Letters.length; k++) {
              const letter = word.Letters[k];
              letter.Status = "Sung";
            }
          }
        }
      }
    }
  } else if (CurrentLyricsType === "Line") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const lineTimes = {
        start: line.StartTime,
        end: line.EndTime,
        total: line.EndTime - line.StartTime
      }

      if (lineTimes.start <= CurrentPosition && CurrentPosition <= lineTimes.end){
        line.Status = "Active";
      } else if (lineTimes.start >= CurrentPosition) {
        line.Status = "NotSung";
      } else if (lineTimes.end <= CurrentPosition) {
        line.Status = "Sung";
      }
    }
  }
}

function _OLDstartLyricsInInt(position) {

  /* if (Spicetify.Player.data.item.mediaType === "video") {
    timeOffset = -950;
  } else {
    timeOffset = 0;
  } */
    const CurrentLyricsType = Defaults.CurrentLyricsType;
    const edtrackpos = position + timeOffset;

      if (CurrentLyricsType != null && CurrentLyricsType === "Syllable") {
        //if (lastEdTrackPos === edtrackpos) return
      //lastEdTrackPos = edtrackpos
      //if (document.querySelector('#SpicyLyricsPage').classList.contains('active')) {
        //document.querySelectorAll("#SpicyLyricsPage .lyricsParent .lyrics .line").forEach((line, index, arr) => {
          const arr = LyricsObject.Types.Syllable.Lines;
          //LyricsObject.Types.Syllable.Lines.forEach((line, index, arr) => {
          for (let index = 0; index < arr.length; index++) {
            const line = arr[index]
          /* if (edtrackpos >= line.getAttribute("end") && arr[index + 1].getAttribute("start") >= edtrackpos) {
            line.classList.add('lnc')
            line.style.color = "white"
            line.querySelectorAll("span").forEach(word => {
              word.classList.add("lnc")
              word.style.color = "white"
            })
          } else if (edtrackpos <= line.getAttribute("end") || arr[index + 1].getAttribute("start") <= edtrackpos) {
            line.classList.remove('lnc')
          } */

          /* const lineTimes = {
            start: line.getAttribute("start"),
            end: line.getAttribute("end"),
            total: line.getAttribute("total")
          } */

            /* const lineTimes = {
              start: line.StartTime,
              end: line.EndTime,
              total: line.EndTime - line.StartTime
            } */
          if (line.Status === "Active") {
            //line.style.opacity = "1"
            //line.style.color = "#FFFFFF"
            //line.style.filter = "blur(0px)"
            //line.style.textShadow = textGlowDef
             // Calculate base blur amount (can be 0 if you don't want any blur by default)
            let blurAmountMultiplier = 1; 

            if (lowQModeEnabled || !SpotifyPlayer.IsPlaying) {
              // Increase blur amount when both scrolling and hovering
              blurAmountMultiplier = 0; // Adjust this value as needed
            } 
              for (let i = index + 1; i < arr.length; i++) {
                  const blurAmount = BlurMultiplier * (i - index) * blurAmountMultiplier;
                  arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`)
              }
      
              // Apply blur to lines BEFORE the active line (in viewport)
              for (let i = index - 1; i >= 0; i--) {
                  const blurAmount = BlurMultiplier * (index - i) * blurAmountMultiplier;
                  arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`)
              }
            
            if (!line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.add("Active");
            if (line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.remove("Sung");
            if (line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.remove("NotSung")
            const words = line.Syllables.Lead;
            //line.Syllables.Lead.forEach((word, index, arr) => {
            for (let index = 0; index < words.length; index++) {
              const word = words[index];

              /* const wordTimes = {
                start: word.getAttribute("start"),
                end: word.getAttribute("end"),
                total: word.getAttribute("total")
              } */

                const wordTimes = {
                  start: word.StartTime,
                  end: word.EndTime,
                  total: word.EndTime - word.StartTime
                }

              if (line.Status === "Active" && word.Status === "Active") {
                //word.style.opacity = "1"
                //word.style.color = "#FFFFFF"
                //word.style.filter = "blur(0px)"
                //word.style.textShadow = activeTextGlowDef

                /* if (word.parentElement.classList.contains("letterGroup")) {
                  word.parentElement.querySelectorAll(".word").forEach(word1 => {
                    word1.style.opacity = "1"
                    //word.style.color = "#FFFFFF"
                    word1.style.filter = "blur(0px)"
                    word1.style.textShadow = activeTextGlowDef
                  })
                } */

                

                //if (lastGradientPercentage !== percentage) {
                 // lastGradientPercentage = percentage

                  //const lngValue = ifPlayerUsingWPSDK ? `linear-gradient(90deg, rgba(255,255,255,1) ${percentage}%, rgba(255,255,255,0.4) ${percentage + 20}%)` : `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`

                  //word.style.backgroundImage = lngValue

                  /* if (ifPlayerUsingWPSDK) {
                    const totalDuration = word.getAttribute("total");
                    const elapsedDuration = edtrackpos - word.getAttribute("start");
                    const percentage = (elapsedDuration / totalDuration) * 100;
                    //console.log("Percentage:", percentage)
                    //if (lastGradientPercentage !== percentage) {
                     // lastGradientPercentage = percentage
                      word.style.setProperty("--gradient-position", `${percentage}%`)
                      word.style.setProperty("--gradient-alpha", "1")
                      word.style.setProperty("--gradient-alpha-end", "0.4")
                      word.style.setProperty("--gradient-degrees", "90deg")
                   // }
                  } else {
                    word.style.setProperty("--gradient-position", "100%")
                    word.style.setProperty("--gradient-alpha", "1")
                    word.style.setProperty("--gradient-alpha-end", "1")
                    word.style.setProperty("--gradient-degrees", "90deg")
                  } */

                  //console.log("Updateeed")
                //}

               // if (word.classList.contains("close-to-class")) {
               // }

                if (lowQModeEnabled) {
                  word.HTMLElement.style.setProperty("--gradient-position", `100%`)
                } else {
                  const ifEmphasis = word.HTMLElement.classList.contains("Emphasis");
                  // Adjust blur values based on low-quality mode and emphasis state
                  const isLowQ = lowQModeEnabled;

                  // Extract Emphasis and Default blur values
                  const EmphasisBlur = WordBlurs.Emphasis[isLowQ ? "LowQualityMode" : null] || WordBlurs.Emphasis;
                  const DefaultBlur = WordBlurs[isLowQ ? "LowQualityMode" : null] || WordBlurs;

                  // Determine blur ranges
                  const minBlur = ifEmphasis ? EmphasisBlur.min : DefaultBlur.min;
                  const maxBlur = ifEmphasis ? EmphasisBlur.max : DefaultBlur.max;

                  // Compute durations and percentages
                  const totalDuration = wordTimes.total;
                  const elapsedDuration = edtrackpos - wordTimes.start;
                  const percentage = (elapsedDuration / totalDuration) * 100;

                  // Pre-compute reusable values to avoid redundancy
                  /* const elapsedDuration = edtrackpos - wordTimes.start;
                  const totalDuration = 1 / wordTimes.total; // Reciprocal to avoid division
                  const percentage = elapsedDuration * totalDuration * 100; */


                  const IsMusicalLine = word.HTMLElement.parentElement.classList.contains("musical-line");

                  // Throttle updates for --gradient-position
                  /* const THROTTLE_TIME = 8; // ~120 FPS for smoother updates

                  if (Date.now() - lastGradientUpdate > THROTTLE_TIME) { */
                      //word.HTMLElement.style.setProperty("--gradient-position", `${percentage}%`);
                  //if (!IsMusicalLine && totalDuration >= 500) {
                    //word.HTMLElement.style.setProperty("--Duration", `${totalDuration - DurationTimeOffset}ms`)
                   // word.HTMLElement.classList.add("DoGradientProgressWithCSS");
                  //} else {
                    //if (word?.gradientPosition !== percentage) {
                      word.HTMLElement.style.setProperty("--gradient-position", `${percentage}%`)
                     // word.gradientPosition = percentage;
                   //}
                  //}
                      //lastGradientUpdate = Date.now();
                  //}

                  // Determine condition for additional styles
                  const Condition = ifEmphasis || totalDuration >= 340;

                  if (Condition) {
                      // Compute text-shadow values
                      const textShadowBlurRadius = minBlur + (percentage / 100) * (maxBlur - minBlur);
                      const textShadowOpacityPercentage = percentage + (isLowQ ? -55 : -35);

                      // Only update styles if values have changed
                      if (
                          word.previousBlurRadius !== textShadowBlurRadius ||
                          word.previousOpacity !== textShadowOpacityPercentage
                      ) {
                          word.HTMLElement.style.cssText += `
                              --text-shadow-opacity: ${textShadowOpacityPercentage}%;
                              --text-shadow-blur-radius: ${textShadowBlurRadius}px;
                          `;

                          // Cache current values
                          word.previousBlurRadius = textShadowBlurRadius;
                          word.previousOpacity = textShadowOpacityPercentage;
                      }
                  }

                  // Set transition duration
                  const TransitionDuration = totalDuration <= 700 ? 700 : totalDuration; // Optionally modify this logic if needed
                  word.HTMLElement.style.setProperty("--TransitionDuration", `${TransitionDuration}ms`);



                }
                /* word.style.setProperty("--gradient-alpha", "1")
                word.style.setProperty("--gradient-alpha-end", "0.4")
                word.style.setProperty("--gradient-degrees", "90deg") */
                
                //word.style.setProperty("--lyr-gr-pos", `${percentage}%`)
                if (!word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.add("Active");
                if (word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.remove("Sung");
                if (word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.remove("NotSung")
              } else if (line.Status === "Active" && word.Status === "NotSung") {
                // este bude
                //if (!word.classList.contains("crepl") && !word.classList.contains("close-to-class")) {
                  //word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
                  //word.style.filter = "blur(0px)"
                  //word.style.opacity = globalOpacityLyr;
                  //word.style.textShadow = "none"
                  //word.style.setProperty("--gradient-position", "-20%")
                  /* word.style.setProperty("--gradient-position", "100%")
                  word.style.setProperty("--gradient-alpha", "0.4")
                  word.style.setProperty("--gradient-alpha-end", "0.4")
                  word.style.setProperty("--gradient-degrees", "90deg") */
                  word.HTMLElement.style.setProperty("--gradient-position", `-20%`)
                  word.HTMLElement.style.cssText += `
                              --text-shadow-opacity: 0%;
                              --text-shadow-blur-radius: 4px;
                  `;
                  if (word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.remove("Active");
                  if (!word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.add("NotSung");
                  if (word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.remove("Sung");
                //}
              } else if (line.Status === "Active" && word.Status === "Sung") {
                //uz bolo
                //if (!word.classList.contains("crepl")) {
                  //word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"

                  //word.style.setProperty("--gradient-position", "120%")

                  /* if (word.classList.contains("close-to-class")) {
                    word.classList.remove("close-to-class");
                  } */
                  /* word.style.setProperty("--gradient-alpha", "1")
                  word.style.setProperty("--gradient-alpha-end", "1")
                  word.style.setProperty("--gradient-degrees", "90deg") */

                  //word.style.filter = "blur(0px)"
                  //word.style.opacity = globalOpacityLyr;
                  //word.style.opacity = "1"
                  //word.style.textShadow = textGlowDef
                  word.HTMLElement.style.setProperty("--gradient-position", `100%`)
                  word.HTMLElement.style.cssText += `
                              --text-shadow-opacity: 0%;
                              --text-shadow-blur-radius: 4px;
                  `;
                  if (word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.remove("Active");
                  if (!word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.add("Sung");
                  if (word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.remove("NotSung");
                //}
              }
              /* if (edtrackpos >= word.getAttribute("end")) {
                if (!word.classList.contains("crepl")) {
                  word.style.opacity = "1";
                  word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
                  //word.style.color = "#FFFFFF"
                  word.style.filter = "blur(0px)"
                  word.style.textShadow = "none"
                }
              } */
            }
          } else if (line.Status === "NotSung") {
            //este bude
            //if (!line.classList.contains("crepl")) {
              //line.style.opacity = globalOpacityLyr
              //line.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
              //line.style.filter = lyricsBlur
              //line.style.textShadow = "none"
              if (line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.remove("Active");
              if (line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.remove("Sung");
              if (!line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.add("NotSung")
           // }
            /* if (line.classList.contains("musical-line")) {
              //line.style.display = "none"
              line.style.textShadow = "none"
            } */
            /* line.Syllables.Lead.forEach(word => {
              //if (!word.classList.contains("crepl")) {
                //word.style.opacity = globalOpacityLyr
                //word.style.setProperty("--gradient-position", "-20%")
                //word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
                //word.style.filter = lyricsBlur
                //word.style.textShadow = "none"
                if (word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.remove("Active");
                if (word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.remove("Sung");
                if (!word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.add("NotSung")
              //}
            }) */
          } else if (line.Status === "Sung") {
            // us bolo

           // if (!line.classList.contains("crepl")) {
              //line.style.opacity = globalOpacityLyr
              //line.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"
              //line.style.filter = lyricsBlur
              //line.style.textShadow = "none"
              if (line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.remove("Active");
              if (!line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.add("Sung");
              if (line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.remove("NotSung");
           // }
            /* if (line.classList.contains("musical-line")) {
              //line.style.display = "block"
              line.style.textShadow = "none"
            } */
            /* line.Syllables.Lead.forEach(word => {
              //if (!word.classList.contains("crepl")) {
                //word.style.opacity = globalOpacityLyr
                //word.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)"

               // word.style.setProperty("--gradient-position", "-20%")

                //word.style.filter = lyricsBlur
                //word.style.textShadow = "none"
                if (word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.remove("Active");
                if (!word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.add("Sung");
                if (word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.remove("NotSung");
             // }
            }) */

          }
        }
      //}
      } else if (CurrentLyricsType != null && CurrentLyricsType === "Line") {
        //if (lastEdTrackPos === edtrackpos) return
    //lastEdTrackPos = edtrackpos
   // if (document.querySelector('#SpicyLyricsPage').classList.contains('active')) {
        const arr = LyricsObject.Types.Line.Lines;
      //LyricsObject.Types.Line.Lines.forEach((line, index, arr) => {
      for (let index = 0; index < arr.length; index++) {
        const line = arr[index];
/*             if (edtrackpos >= line.getAttribute("end") && arr[index + 1].getAttribute("start") >= edtrackpos) {
          line.classList.add('lnc')
          line.style.color = "white"
        } else if (edtrackpos <= line.getAttribute("end") || arr[index + 1].getAttribute("start") <= edtrackpos) {
          line.classList.remove('lnc')
        } */

          /* const lineTimes = {
            start: line.StartTime,
            end: line.EndTime,
            total: line.EndTime - line.StartTime
          } */

        if (line.Status === "Active") {
         // line.style.opacity = "1"
          //line.style.color = "#FFFFFF"
          //line.style.filter = "blur(0px)"
          //line.style.textShadow = textGlowDef

        
          let blurAmountMultiplier = 1; 

          if (lowQModeEnabled || !SpotifyPlayer.IsPlaying) {
            // Increase blur amount when both scrolling and hovering
            blurAmountMultiplier = 0; // Adjust this value as needed
          } 
            for (let i = index + 1; i < arr.length; i++) {
                const blurAmount = BlurMultiplier * (i - index) * blurAmountMultiplier;
                arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`)
            }
    
            // Apply blur to lines BEFORE the active line (in viewport)
            for (let i = index - 1; i >= 0; i--) {
                const blurAmount = BlurMultiplier * (index - i) * blurAmountMultiplier;
                arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`)
            }

          /* const totalDuration = line.getAttribute("total");
          const elapsedDuration = edtrackpos - line.getAttribute("start");
          const percentage = (elapsedDuration / totalDuration) * 100;

          //if (lastGradientPercentage !== percentage) {
            lastGradientPercentage = percentage

            //const lngValue = ifPlayerUsingWPSDK ? `linear-gradient(180deg, rgba(255,255,255,1) ${percentage}%, rgba(255,255,255,0.4) ${percentage + 20}%)` : `linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 100%)`

            //line.style.backgroundImage = lngValue
            if (ifPlayerUsingWPSDK) {
              line.style.setProperty("--gradient-position", `${percentage}%`)
              line.style.setProperty("--gradient-alpha", "1")
              line.style.setProperty("--gradient-alpha-end", "0.4")
              line.style.setProperty("--gradient-degrees", "180deg")
            } else {
              line.style.setProperty("--gradient-position", "100%")
              line.style.setProperty("--gradient-alpha", "1")
              line.style.setProperty("--gradient-alpha-end", "1")
              line.style.setProperty("--gradient-degrees", "90deg")
            } */
          //}

          

          //if (lowQModeEnabled) {
            //line.style.setProperty("--gradient-position", "100%")
          /* } else {

            const totalDuration = line.getAttribute("total");
            const elapsedDuration = edtrackpos - line.getAttribute("start");
            const percentage = (elapsedDuration / totalDuration) * 100;

            line.style.setProperty("--gradient-position", `${percentage}%`)
          } */
          /* line.style.setProperty("--gradient-alpha", "1")
          line.style.setProperty("--gradient-alpha-end", "0.4") */
          //line.style.setProperty("--gradient-degrees", "180deg")

          if (!line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.add("Active");
          if (line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.remove("Sung");
          if (line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.remove("NotSung")
        } else if (line.Status === "NotSung") {
          //este bude
        //  if (!line.classList.contains("crepl")) {
            //line.style.opacity = globalOpacityLyr

            //line.style.setProperty("--gradient-position", "-20%")

            //line.style.filter = lyricsBlur
            //line.style.textShadow = "none"
            if (line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.remove("Active");
            if (line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.remove("Sung");
            if (!line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.add("NotSung")
         // }
        } else if (line.Status === "Sung") {
          //us bolo
          //if (!line.classList.contains("crepl")) {
           // line.style.backgroundImage = "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.4) 100%)"
            //line.style.setProperty("--gradient-position", "-20%")
            /* line.style.setProperty("--gradient-alpha", "1")
            line.style.setProperty("--gradient-alpha-end", "1") */
            /* line.style.setProperty("--gradient-degrees", "90deg") */
            //line.style.opacity = globalOpacityLyr
            //line.style.filter = lyricsBlur
            //line.style.textShadow = "none"
            if (line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.remove("Active");
            if (!line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.add("Sung");
            if (line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.remove("NotSung")
        //  }
        }
      }
    }
}

const IdleLyricsScale = 0.95;
const IdleEmphasisLyricsScale = 0.93;
const LyricsTextGlowDef = "0 0 var(--text-shadow-blur-radius) rgba(255,255,255,var(--text-shadow-opacity))"

function startLyricsInInt(position) {
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  const edtrackpos = position + timeOffset;

  if (!CurrentLyricsType || CurrentLyricsType === "None") return;

  const applyBlur = (arr, activeIndex, BlurMultiplier) => {
      for (let i = activeIndex + 1; i < arr.length; i++) {
          const blurAmount = BlurMultiplier * (i - activeIndex);
          if (arr[i].Status === "Active") {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            if (!SpotifyPlayer.IsPlaying) {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
            } else {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
            }
          }
      }

      for (let i = activeIndex - 1; i >= 0; i--) {
          const blurAmount = BlurMultiplier * (activeIndex - i);
          if (arr[i].Status === "Active") {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            if (!SpotifyPlayer.IsPlaying) {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
            } else {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
            }
          }
      }
  };

  if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];

          if (line.Status === "Active") {
              applyBlur(arr, index, 0.5); // Adjust BlurMultiplier as needed.

              if (!line.HTMLElement.classList.contains("Active")) {
                  line.HTMLElement.classList.add("Active");
              }

              if (line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.remove("NotSung");
              }

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }

              const words = line.Syllables.Lead;
              for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
                  const word = words[wordIndex];

                  const isLetterGroup = word?.LetterGroup;
                  const isDot = word?.Dot;

                  if (word.Status === "Active") {
                    // Calculate percentage of progress through the word
                    const totalDuration = word.EndTime - word.StartTime;
                    const elapsedDuration = edtrackpos - word.StartTime;
                    const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1

                    // Calculate opacity based on progress percentage
                    const calculateOpacity = (percentage: number): number => {
                      if (word?.BGWord) return 0;
                      if (percentage <= 0.5) {
                          // Progress 0% to 50%: Interpolate from 0% to 50% opacity
                          return percentage * 100; // Linearly scale from 0 to 50
                      } else {
                          // Progress 50% to 100%: Interpolate from 50% to 0% opacity
                          return (1 - percentage) * 100; // Linearly scale from 50 to 0
                      }
                    };


                    // Dynamic calculations based on percentage
                    const blurRadius = 4 + (16 - 4) * percentage; // From 4px to 16px
                    const emphasisBlurRadius = 8 + (24 - 8) * percentage; // From 8px to 24px 
                    const textShadowOpacity = calculateOpacity(percentage) * 1.4; // From 0% to 100%
                    const emphasisTextShadowOpacity = calculateOpacity(percentage) * 30; // From 0% to 100%
                    const translateY = -0.035 + (-0.035 - -0.01) * percentage; // From -0.005 to -0.2. (multiplied by var(--DefaultLyricsSize))
                    const scale = IdleLyricsScale + (1.025 - IdleLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                    const emphasisScale = IdleEmphasisLyricsScale + (1.028 - IdleEmphasisLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                    const gradientPosition = percentage * 100; // Gradient position based on percentage
                    
                    // Apply styles dynamically
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];

                        if (letter.Status === "Active") {
                          // Calculate percentage of progress through the letter
                          const totalDuration = letter.EndTime - letter.StartTime;
                          const elapsedDuration = edtrackpos - letter.StartTime;
                          const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1

                          const letterGradientPosition = `${percentage * 100}%`; // Gradient position based on percentage
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY * 1.4}))`;
                          letter.HTMLElement.style.scale = `${emphasisScale * 1.001}`;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${emphasisBlurRadius}px`);
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${emphasisTextShadowOpacity}%`);
                          letter.HTMLElement.style.setProperty("--gradient-position", letterGradientPosition);
                        } else if (letter.Status === "NotSung") {
                          // NotSung styles
                          letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                          letter.HTMLElement.style.scale = IdleLyricsScale;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                          letter.HTMLElement.style.setProperty("--gradient-position", "-20%");
                        } else if (letter.Status === "Sung") {
                          // Sung styles
                          const NextLetter = word.Letters[k + 1] ?? null;
                          if (NextLetter) {
                            // Calculate percentage of progress through the letter
                            const totalDuration = NextLetter.EndTime - NextLetter.StartTime;
                            const elapsedDuration = edtrackpos - NextLetter.StartTime;
                            const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1
                            const translateY = -0.035 + (-0.035 - -0.01) * percentage;
                            letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(translateY * 0.8)}))`;

                            if (NextLetter.Status === "Active") {
                              letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${(percentage * 100) * 0.85}%`);
                            } else {
                              letter.HTMLElement.style.setProperty("--text-shadow-opacity", `5%`);
                            }
                          } else {
                            letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                            letter.HTMLElement.style.setProperty("--text-shadow-opacity", `5%`);
                          }

                          letter.HTMLElement.style.scale = "1";
                          /* letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px"); */
                          letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                        }
                      }
                      
                      word.HTMLElement.style.scale = `${emphasisScale}`;
                      word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY * 1.2}))`;
                     /*  word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${emphasisBlurRadius * 0.8}px`);
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", `${emphasisTextShadowOpacity * 0.8}%`); */
                    } else {
                      if (isDot) {
                        word.HTMLElement.classList.add("Active");
                        word.HTMLElement.classList.remove("Sung", "NotSung");
                      } else {
                        word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                        word.HTMLElement.style.scale = `${scale}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                      }
                      word.HTMLElement.style.setProperty("--gradient-position", `${gradientPosition}%`);
                    }
                } else if (word.Status === "NotSung") {
                    // NotSung styles
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                        letter.HTMLElement.style.scale = IdleEmphasisLyricsScale;
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                        letter.HTMLElement.style.setProperty("--gradient-position", "-20%");
                      }
                    }
                    word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                    word.HTMLElement.style.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                    word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                    word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                    word.HTMLElement.style.setProperty("--gradient-position", "-20%");
                    if (isDot) {
                      word.HTMLElement.classList.add("NotSung");
                      word.HTMLElement.classList.remove("Sung", "Active");
                    }
                } else if (word.Status === "Sung") {
                    // Sung styles
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                        letter.HTMLElement.style.scale = "1";
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                        letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                      }
                    }
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                    word.HTMLElement.style.scale = "1";
                    word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                    word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                    word.HTMLElement.style.setProperty("--gradient-position", "100%");
                    if (isDot) {
                      word.HTMLElement.classList.add("Sung");
                      word.HTMLElement.classList.remove("Active", "NotSung");
                    }
                }
              }
          } else if (line.Status === "NotSung") {
              line.HTMLElement.classList.add("NotSung");
              line.HTMLElement.classList.remove("Active", "Sung");
          } else if (line.Status === "Sung") {
              line.HTMLElement.classList.add("Sung");
              line.HTMLElement.classList.remove("Active", "NotSung");
          }
      }
  } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];

          if (line.Status === "Active") {
              applyBlur(arr, index, 0.5);

              // Calculate percentage of progress through the word
              const totalDuration = line.EndTime - line.StartTime;
              const elapsedDuration = edtrackpos - line.StartTime;
              const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1
              const gradientPercentage = `${percentage * 100}%`; // Convert percentage to a percentage value

              line.HTMLElement.style.setProperty("--gradient-position", gradientPercentage);
              line.HTMLElement.style.setProperty("--gradient-degrees", "180deg");

              if (!line.HTMLElement.classList.contains("Active")) {
                  line.HTMLElement.classList.add("Active");
              }

              if (line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.remove("NotSung");
              }

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }
          } else if (line.Status === "NotSung") {
              if (!line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.add("NotSung");
              }
              line.HTMLElement.classList.remove("Active", "Sung");
          } else if (line.Status === "Sung") {
              if (!line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.add("Sung");
              }
              line.HTMLElement.classList.remove("Active", "NotSung");
          }
      }
  }
}




export function isElementInViewport(el, scr) {
    const rect = el.getBoundingClientRect();
    const scrollable = scr
    const scrollableRect = scrollable.getBoundingClientRect();
  
    return (
      rect.top >= scrollableRect.top &&
      rect.left >= scrollableRect.left &&
      rect.bottom <= scrollableRect.bottom &&
      rect.right <= scrollableRect.right
    );
}




/* export function runLiiInt() {
  if (storage.get("intRunning") === "true") return
    
  storage.set("intRunning", "true")

  runLyricsInInt();
} */

let lastLine = null;
//const lyricsContainer = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics");

export function scrollToActiveLine() {
  //const edtrackpos = Spicetify.Player.getProgress();
  /* if (!Defaults.LyricsContainerExists) return
  if (Spicetify.Platform.History.location.pathname === "/spicy-lyrics") {
      document.querySelectorAll("#SpicyLyricsPage .lyricsParent .lyrics .line").forEach(line => {
        if (line.classList.contains("Active")) {
          const container = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics");

          scrollElementIntoView(container, line);
        }
      })
    } */
    const def = !SpotifyPlayer.IsPlaying;//!Spicetify.Player.isPlaying();
    if (def) return;
    //const edtrackpos = Spicetify.Player.getProgress();
    if (!Defaults.LyricsContainerExists) return;

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {

      const CurrentLyricsType = Defaults.CurrentLyricsType;

      if (CurrentLyricsType === "Syllable") {
        const lines = LyricsObject.Types.Syllable.Lines

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.Status === "Active") {
            const currentLine = line;
            Continue(currentLine)
            return; // Exit the loop once a line is found
          }
        }
      } else if (CurrentLyricsType === "Line") {
        const lines = LyricsObject.Types.Line.Lines

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.Status === "Active") {
            const currentLine = line;
            Continue(currentLine)
            return; // Exit the loop once a line is found
          }
        }
      }

      /* for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.classList.contains("Active")) {
          currentLine = line;
          break; // Exit the loop once a line is found
        }
      } */
      function Continue(currentLine) {
        if (currentLine) {
          const LineElem = currentLine.HTMLElement
          const container = ScrollSimplebar?.getScrollElement() as HTMLElement;//document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
          if (!container) return;
          if (lastLine && lastLine === LineElem) return;
          lastLine = LineElem
          scrollElementIntoView(container, currentLine.HTMLElement, 200, document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics"), ScrollSimplebar);
          //LineScroll(yPosition, container)
        }
      }
    }
}

/* function LineScroll(yPosition: number, container: HTMLElement) {
  console.log(yPosition)
  gsap.to(container, {
    duration: 0.15, // 0.15-second scroll duration
    scrollTo: {
      y: yPosition, 
      autoKill: true 
    },
    ease: "none" // Good: back.out(1.4)
  });
} */
type ContainerScrollData = {
  ContainerRect: DOMRect | null;
  ScrollOffset: number | null;
}

const CurrentContainerScrollData: ContainerScrollData = {
  ContainerRect: null,
  ScrollOffset: 0
}

/* export function scrollElementIntoView(container, element) {
  const containerRect = CurrentContainerScrollData.ContainerRect ?? container.getBoundingClientRect();
  const elementRect =  element.getBoundingClientRect();
  const offsetTop = elementRect.top - containerRect.top + container.scrollTop;

  CurrentContainerScrollData.ContainerRect = containerRect;

  gsap.to(container, {
    duration: 0.15, // 0.15-second scroll duration
    scrollTo: {
      y: offsetTop - container.clientHeight / 2 + element.clientHeight / 2 + CurrentContainerScrollData.ScrollOffset, 
      autoKill: true 
    },
    ease: "none" // Good: back.out(1.4)
  });
} */

/* export function scrollElementIntoView(container: HTMLElement, element: HTMLElement) {
  const containerRect = CurrentContainerScrollData.ContainerRect ?? container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop = elementRect.top - containerRect.top + container.scrollTop;

  CurrentContainerScrollData.ContainerRect = containerRect;

  container.scrollTo({
      top: offsetTop - container.clientHeight / 2 + element.clientHeight / 2 + CurrentContainerScrollData.ScrollOffset, // Use the value here
      behavior: 'smooth'
  });
} */



export function scrollElementIntoView(
  container: HTMLElement,
  element: HTMLElement,
  duration: number = 150, // Duration in milliseconds
  topContentContainer: HTMLElement, // Is the top scrollable Container,
  SimpleBar: SimpleBar
) {
  const containerRect = CurrentContainerScrollData.ContainerRect ?? container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetScrollTop =
    elementRect.top - containerRect.top + container.scrollTop -
    (container.clientHeight / 2 - element.clientHeight / 2) +
    CurrentContainerScrollData.ScrollOffset;

  CurrentContainerScrollData.ContainerRect = containerRect;

  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  const startTime = performance.now();

  function smoothScroll(currentTime: number) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1); // Progress between 0 and 1
    const easing = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2; // Smooth cubic easing in-out
    const newScrollTop = startScrollTop + distance * easing;

    container.scrollTop = newScrollTop;

    if (progress < 1) {
      requestAnimationFrame(smoothScroll);
    }
  }

  requestAnimationFrame(smoothScroll);
}




/* export function scrollElementIntoView(container, element) {
  const containerRect = 
    CurrentContainerScrollData.ContainerRect ?? container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop = elementRect.top - containerRect.top + container.scrollTop;

  // Cache container rect for future calls
  CurrentContainerScrollData.ContainerRect = containerRect;

  const targetScroll =
    offsetTop - container.clientHeight / 2 + element.clientHeight / 2 + CurrentContainerScrollData.ScrollOffset;

  // Smooth scrolling function
  function smoothScrollTo(container, targetOffset, duration = 150) {
    const start = container.scrollTop;
    const distance = targetOffset - start;
    let startTime = null;

    function animationStep(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easing = progress; // Linear easing, can be customized
      container.scrollTop = start + distance * easing;

      if (progress < 1) {
        requestAnimationFrame(animationStep);
      }
    }

    requestAnimationFrame(animationStep);
  }

  // Trigger the scroll
  smoothScrollTo(container, targetScroll, 150); // Duration in ms
} */


export function ClearCurrrentContainerScrollData() {
  CurrentContainerScrollData.ContainerRect = null;
}

/* let intForScrollFirst = null;

// Main function to scroll to the active line
export function scrollToActiveLine(firstScroll = false) {
    const lyricsContainer = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics");
    if (!lyricsContainer) return;

    if (Spicetify.Platform.History.location.pathname !== "/spicy-lyrics") return;

    let lines = document.querySelectorAll("#SpicyLyricsPage .lyricsParent .lyrics .line");

    // Find the current active line
    let currentLine = Array.from(lines).find(line => line.classList.contains("Active"));

    // Scroll to the active line if it’s different from the last and if user hasn’t scrolled
      console.log("First Scroll", firstScroll)
    if (firstScroll) {
      //if (!currentLine) {
        intForScrollFirst = setInterval(() => {
          console.log("yes")
          const lines = document.querySelectorAll("#SpicyLyricsPage .lyricsParent .lyrics .line");
          const currentLine = Array.from(lines).find(line => line.classList.contains("Active"));
          if (currentLine) {
            console.log("ultra yes")
              scrollElementIntoView(lyricsContainer, currentLine); // Scroll to active line
              console.log("Should've scrolled 1")
              clearInterval(intForScrollFirst)
              intForScrollFirst = null;
          }
        }, 100)

    }
    if (currentLine && currentLine !== lastLine && !userScrolled) {
        if (!isElementInViewport(currentLine, lyricsContainer)) return
        scrollElementIntoView(lyricsContainer, currentLine); // Scroll to active line
        lastLine = currentLine;  // Update the last line
    }

    // Set up scroll event listener to detect user scrolling away, if not already set
    if (!lyricsContainer.hasScrollListener) {
        lyricsContainer.addEventListener('scroll', handleUserScroll);
        lyricsContainer.hasScrollListener = true; // Track listener addition
    }
} */

/* // Handle user scrolling
function handleUserScroll() {
    userScrolled = true; // Mark that the user has scrolled away

    const lyricsContainer = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics");

    // Clear any existing timeout if the user is actively scrolling
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }

    // Start a new timeout to scroll back to the active line if the user stops scrolling for 3 seconds
    scrollTimeout = setTimeout(() => {
        const activeLine = document.querySelector("#SpicyLyricsPage .lyricsParent .lyrics .line.Active");
        if (activeLine) {
            if (!isElementInViewport(activeLine, lyricsContainer)) return
            scrollElementIntoView(lyricsContainer, activeLine); // Scroll back to the active line
            userScrolled = false; // Reset user scroll flag after auto-scroll
        }
    }, 3000);
} */

/* // Function to smoothly scroll the element into view
export function scrollElementIntoView(container, element) {
    const containerTop = container.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;
    const offset = elementTop - containerTop - container.clientHeight / 2 + element.clientHeight / 2;
    container.scrollBy({ top: offset, behavior: "smooth" });
} */

const THROTTLE_TIME = 0;

/* const THROTTLE_TIME = 4;

// Add a throttle utility function
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function () {
      const context = this;
      const args = arguments;
      if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
      } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(() => {
              if ((Date.now() - lastRan) >= limit) {
                  func.apply(context, args);
                  lastRan = Date.now();
              }
          }, limit - (Date.now() - lastRan));
      }
  };
}

// Use it to throttle gradient updates
const throttledUpdate = throttle(() => {
  SetLyricsStatuses(Spicetify.Player.getProgress());
  startLyricsInInt(Spicetify.Player.getProgress());
}, THROTTLE_TIME); // 4ms limit

const runLyricsInInt = () => requestAnimationFrame(throttledUpdate); */


const LyricsInterval = new IntervalManager(THROTTLE_TIME, () => {
  if (!Defaults.LyricsContainerExists) return
  const progress = SpotifyPlayer.GetTrackPosition();
  SetLyricsStatuses(progress);
  startLyricsInInt(progress);
}).Start();

/* export function stopLyricsInInt() {
  storage.set("intRunning", "false");
  LyricsInterval.Stop();
} */


/* const AnimationFrameInterval = new IntervalManager(2, () => {
  if (storage.get("intRunning") === "true") {
    LyricsInterval.Restart();
    //Logger.log("RefreshAnimationFrameInterval: Refreshed Lyrics Animation Frame");
  }
}); */


let LinesEvListenerMaid;
let LinesEvListenerExists;

function LinesEvListener(e) {
  if (e.target.classList.contains("line")) {
    let startTime;

    LyricsObject.Types.Line.Lines.forEach((line) => {
      if (line.HTMLElement === e.target) {
        startTime = line.StartTime;
      }
    })

    if (startTime) {
      Spicetify.Player.seek(startTime);
    }
  } else if (e.target.classList.contains("word")) {
    let startTime; //e.target.parentNode.getAttribute("start") ?? e.target.parentNode.parentNode.getAttribute("start");

    LyricsObject.Types.Syllable.Lines.forEach((line) => {
      line.Syllables.Lead.forEach((word) => {
        if (word.HTMLElement === e.target) {
          startTime = line.StartTime;
        }
      })
    })

    if (startTime) {
      Spicetify.Player.seek(startTime);
    }
  }
}

export function addLinesEvListener() {

  if (LinesEvListenerExists) return
  LinesEvListenerExists = true;

  LinesEvListenerMaid = new Maid();

  const el = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
  if (!el) return
  const evl = el.addEventListener("click", LinesEvListener);
  LinesEvListenerMaid.Give(evl);
}

export function removeLinesEvListener() {
  if (!LinesEvListenerExists) return
  LinesEvListenerExists = false;

  const el = document.querySelector<HTMLElement>("#SpicyLyricsPage .lyricsParent .lyrics");
  if (!el) return
  el.removeEventListener("click", LinesEvListener)
  LinesEvListenerMaid.Destroy();
}

/* const AnimationFrameInterval = {
  Refresher: RefreshAnimationFrameInterval,
} */

/* const AnimationFrameInterval = {
  Start: () => console.log('a'),
  Stop: () => console.log('b'),
  Restart: () => console.log('c'),
}

const LyricsInterval = {
  Start: () => console.log('a'),
  Stop: () => console.log('b'),
  Restart: () => console.log('c'),
} */

/* const Intervals = {
  AnimationFrameInterval,
  LyricsInterval
}

export { Intervals }
 */