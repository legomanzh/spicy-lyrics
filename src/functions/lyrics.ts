import gsap from 'gsap';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
import storage from './storage';
import { Maid } from '@spikerko/web-modules/Maid';
import { IntervalManager } from './IntervalManager';
import Defaults from '../components/Defaults';
import { ArabicPersianRegex } from '../components/Addons';

gsap.registerPlugin(ScrollToPlugin); 

export const ScrollingIntervalTime = 450;

function convertTime(time: any): any { 
  return time * 1000;
}

const lyricsBetweenShow = 5;
let timeOffset = 0;

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
  min: 6,
  max: 16,
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

    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").style.setProperty("--TextGlowDef", "rgba(255,255,255,0.07) 0px 0px 2px")
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").style.setProperty("--ActiveTextGlowDef", "rgba(255,255,255,0.24) 0px 0px 5px")
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").style.setProperty("--StrongTextGlowDef", "rgba(255,255,255,0.35) 0px 0px 5.3px")
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").style.setProperty("--StrongerTextGlowDef", "rgba(255,255,255,0.4) 0px 0px 4.9px")
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

export function syllableLyrics(data) {
  if (!document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) return
  ClearLyricsContentArrays();

  removeAllStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"))

  if (data.classes) {
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").className = data.classes;
  }

  if (data.styles) {
    applyStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"), data.styles);
  }
/*   const topSpace = document.createElement("div")
  topSpace.classList.add("topSpace")
  document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(topSpace) */

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
      TotalTime: dotTime
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
      TotalTime: dotTime
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
      TotalTime: dotTime
    })

    dotGroup.appendChild(musicalDots1);
    dotGroup.appendChild(musicalDots2);
    dotGroup.appendChild(musicalDots3);

    musicalLine.appendChild(dotGroup);
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(musicalLine)
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
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(topSpace)
      } */

      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineElem)
      
      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild("<br>")
  
      
  
      line.Lead.Syllables.forEach((lead, iL, aL) => {
        let word = document.createElement("span")
        //word.textContent = lead.Text
        const totalDuration = convertTime(lead.EndTime) - convertTime(lead.StartTime);

        const IfLetterCapable = lead.Text.split("").length <= 3 && totalDuration >= 800 ? true : totalDuration >= 1620 && lead.Text.split("").length < 12

        if (IfLetterCapable) {
          word = document.createElement("div")
          const letters = lead.Text.split(""); // Split word into individual letters
          const letterDuration = (totalDuration - 70) / letters.length; // Duration per letter
          
          letters.forEach((letter, index, lA) => {
            const letterElem = document.createElement("span");
            letterElem.textContent = letter;
            letterElem.classList.add("word");
            letterElem.classList.add("Emphasis");
  
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

            word.appendChild(letterElem);

            LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
              HTMLElement: letterElem,
              StartTime: letterStartTime,
              EndTime: letterEndTime,
              TotalTime: totalDuration
            })
          });
          word.classList.add("letterGroup");
          if (lead.IsPartOfWord) {
            word.classList.add("PartOfWord");
          }

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
  
       
  
       /*  document.querySelector('#LyricsPageContainer .lyricsParent .lyrics').style.ponterEvents = null
  
        document.querySelector('#LyricsPageContainer .lyricsParent .llparent').style.display = 'none'
        document.querySelector('#LyricsPageContainer .lyricsParent .bgcover').style.display = 'none' */
  
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
            TotalTime: convertTime(bg.EndTime) - convertTime(bg.StartTime)
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
          document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineE)
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
              TotalTime: convertTime(bw.EndTime) - convertTime(bw.StartTime)
            })

            bwE.classList.add("bg-word")
            bwE.classList.add("word")
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
            TotalTime: dotTime
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
            TotalTime: dotTime
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
            TotalTime: dotTime
          })
      
          dotGroup.appendChild(musicalDots1);
          dotGroup.appendChild(musicalDots2);
          dotGroup.appendChild(musicalDots3);
      
          musicalLine.appendChild(dotGroup);
          document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(musicalLine)
        }
      } catch (error) {
        
      }
    });
    /* data.Content.forEach(line => {
      if (line.Background) {
        line.Background.forEach(bg => {
          const lineE = document.createElement("div");
          lineE.classList.add("line")
          lineE.setAttribute("start", convertTime(bg.StartTime))
          lineE.setAttribute("end", convertTime(bg.EndTime))
          document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineE)
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
}
  
  export function lineLyrics(data) {
    if (!document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) return

    ClearLyricsContentArrays();

    removeAllStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"))

    if (data.classes) {
      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").className = data.classes;
    }

    if (data.styles) {
      applyStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"), data.styles);
    }

/*     const topSpace = document.createElement("div")
    topSpace.classList.add("topSpace")
    document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(topSpace) */

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
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(musicalLine)
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
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(topSpace)
      } */

      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineElem)
  
      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild("<br>")
      
  
        /* document.querySelector('#LyricsPageContainer .lyricsParent .lyrics').style.ponterEvents = null
  
        document.querySelector('#LyricsPageContainer .lyricsParent .llparent').style.display = 'none'
        document.querySelector('#LyricsPageContainer .lyricsParent .bgcover').style.display = 'none' */
  
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
            document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(musicalLine)
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
            document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineE)
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
    if (!document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) return
    if (document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").classList.contains("offline")) {
      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").classList.remove("offline");
    }

    ClearLyricsContentArrays();

    if (data.offline) {
      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").classList.add("offline");
    }

    removeAllStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"))

    if (data.classes) {
      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").className = data.classes;
    }

    if (data.styles) {
      applyStyles(document.querySelector("#LyricsPageContainer .lyricsParent .lyrics"), data.styles);
    }
    
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
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(topSpace)
      } */

      

      document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineElem)

      /* if (arr.length - 1 === index) {
        const lineSpace = document.createElement("div")
        lineSpace.classList.add("lineSpace")
        document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild(lineSpace)
      } */
  
      //document.querySelector("#LyricsPageContainer .lyricsParent .lyrics").appendChild("<br>")
      
  
  
          /* clearInterval(lyricsInt)
          lyricsInt = null */

        //document.querySelector("#LyricsPageContainer .lyricsParent .informationBox").textContent = "These lyrics haven't been synced yet."
  
    })
  }

 //let isScrolling = false; // Flag to track scrolling state
  //let scrollTimeout; // Define scrollTimeout outside the listener
/*   let isHovering = false;
  let moveTimeout;

  setInterval(() => {
    if (!document.querySelector<HTMLElement>("#LyricsPageContainer .lyricsParent .lyrics")) return;
    const lyricsContainer = document.querySelector<HTMLElement>("#LyricsPageContainer .lyricsParent .lyrics");
  
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
let lastGradientPercentage = 0;

const TransitionDurationProperties = {
  IfSmallerThan: 140,
  Use: 200
}

function startLyricsInInt(position) {

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
      //if (document.querySelector('#LyricsPageContainer').classList.contains('active')) {
        //document.querySelectorAll("#LyricsPageContainer .lyricsParent .lyrics .line").forEach((line, index, arr) => {
          LyricsObject.Types.Syllable.Lines.forEach((line, index, arr) => {
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

            const lineTimes = {
              start: line.StartTime,
              end: line.EndTime,
              total: line.EndTime - line.StartTime
            }
          if (lineTimes.start <= edtrackpos && edtrackpos <= lineTimes.end) {
            //line.style.opacity = "1"
            //line.style.color = "#FFFFFF"
            //line.style.filter = "blur(0px)"
            //line.style.textShadow = textGlowDef
             // Calculate base blur amount (can be 0 if you don't want any blur by default)
           /*  let blurAmountMultiplier = 1; 

            if (lowQModeEnabled || !Spicetify.Player.isPlaying()) {
              // Increase blur amount when both scrolling and hovering
              blurAmountMultiplier = 0; // Adjust this value as needed
            } 
              for (let i = index + 1; i < arr.length; i++) {
                  const blurAmount = 1.25 * (i - index) * blurAmountMultiplier;
                  arr[i].style.setProperty("--blur-px", `${blurAmount}px`)
              }
      
              // Apply blur to lines BEFORE the active line (in viewport)
              for (let i = index - 1; i >= 0; i--) {
                  const blurAmount = 1.25 * (index - i) * blurAmountMultiplier;
                  arr[i].style.setProperty("--blur-px", `${blurAmount}px`)
              } */
            
            if (!line.HTMLElement.classList.contains("Active")) line.HTMLElement.classList.add("Active");
            if (line.HTMLElement.classList.contains("Sung")) line.HTMLElement.classList.remove("Sung");
            if (line.HTMLElement.classList.contains("NotSung")) line.HTMLElement.classList.remove("NotSung")
            line.Syllables.Lead.forEach((word, index, arr) => {

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

              if (wordTimes.start <= edtrackpos && edtrackpos <= wordTimes.end) {
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

                  const EmphasisBlur = {
                    min: lowQModeEnabled ? WordBlurs.Emphasis.LowQualityMode.min : WordBlurs.Emphasis.min,
                    max: lowQModeEnabled ? WordBlurs.Emphasis.LowQualityMode.max : WordBlurs.Emphasis.max
                  };

                  const DefaultBlur = {
                    min: lowQModeEnabled ? WordBlurs.LowQualityMode.min : WordBlurs.min,
                    max: lowQModeEnabled ? WordBlurs.LowQualityMode.max : WordBlurs.max
                  }

                  const minBlur = ifEmphasis ? EmphasisBlur.min : EmphasisBlur.min; // Minimum blur radius in px
                  const maxBlur = ifEmphasis ? EmphasisBlur.max : DefaultBlur.max; // Maximum blur radius in px

                  const totalDuration = wordTimes.total;
                  const elapsedDuration = edtrackpos - wordTimes.start;
                  const percentage = (elapsedDuration / totalDuration) * 100;

                  if (Math.abs(percentage - lastGradientPercentage) > 0.001) {
                    word.HTMLElement.style.setProperty("--gradient-position", `${percentage}%`);
                    lastGradientPercentage = percentage
                  }

                  // Map percentage to the blur radius range
                  const Condition = ifEmphasis ? true : totalDuration >= 800;
                  if (Condition) {
                    const textShadowBlurRadius = minBlur + (percentage / 100) * (maxBlur - minBlur);
                    const textShadowOpacityPercentageSetModes = lowQModeEnabled ? -30 : 45;
                    const textShadowOpacityPercentage = percentage + textShadowOpacityPercentageSetModes;

                    word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacityPercentage}%`);
                    word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${textShadowBlurRadius}px`);
                  }

                  const TransitionDuration = totalDuration// < TransitionDurationProperties.IfSmallerThan ? TransitionDurationProperties.Use : totalDuration;
                  
                  word.HTMLElement.style.setProperty("--TransitionDuration", `${TransitionDuration}ms`);

                }
                /* word.style.setProperty("--gradient-alpha", "1")
                word.style.setProperty("--gradient-alpha-end", "0.4")
                word.style.setProperty("--gradient-degrees", "90deg") */
                
                //word.style.setProperty("--lyr-gr-pos", `${percentage}%`)
                if (!word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.add("Active");
                if (word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.remove("Sung");
                if (word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.remove("NotSung")
              } else if (wordTimes.start >= edtrackpos) {
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
                  if (word.HTMLElement.classList.contains("Active")) word.HTMLElement.classList.remove("Active");
                  if (!word.HTMLElement.classList.contains("NotSung")) word.HTMLElement.classList.add("NotSung");
                  if (word.HTMLElement.classList.contains("Sung")) word.HTMLElement.classList.remove("Sung");
                //}
              } else if (edtrackpos >= wordTimes.start) {
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
            })
          } else if (lineTimes.start >= edtrackpos) {
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
          } else if (edtrackpos >= lineTimes.end) {
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
        })
      //}
      } else if (CurrentLyricsType != null && CurrentLyricsType === "Line") {
        //if (lastEdTrackPos === edtrackpos) return
    //lastEdTrackPos = edtrackpos
   // if (document.querySelector('#LyricsPageContainer').classList.contains('active')) {
      LyricsObject.Types.Line.Lines.forEach((line, index, arr) => {
/*             if (edtrackpos >= line.getAttribute("end") && arr[index + 1].getAttribute("start") >= edtrackpos) {
          line.classList.add('lnc')
          line.style.color = "white"
        } else if (edtrackpos <= line.getAttribute("end") || arr[index + 1].getAttribute("start") <= edtrackpos) {
          line.classList.remove('lnc')
        } */

          const lineTimes = {
            start: line.StartTime,
            end: line.EndTime,
            total: line.EndTime - line.StartTime
          }

        if (lineTimes.start <= edtrackpos && edtrackpos <= lineTimes.end) {
         // line.style.opacity = "1"
          //line.style.color = "#FFFFFF"
          //line.style.filter = "blur(0px)"
          //line.style.textShadow = textGlowDef

        
              // Calculate base blur amount (can be 0 if you don't want any blur by default)
              /* let blurAmountMultiplier = 1;

              if (lowQModeEnabled || !Spicetify.Player.isPlaying()) {
                // Increase blur amount when both scrolling and hovering
                blurAmountMultiplier = 0; // Adjust this value as needed
              } 
                for (let i = index + 1; i < arr.length; i++) {
                    const blurAmount = 1.25 * (i - index) * blurAmountMultiplier;
                    arr[i].style.setProperty("--blur-px", `${blurAmount}px`)
                }
        
                // Apply blur to lines BEFORE the active line (in viewport)
                for (let i = index - 1; i >= 0; i--) {
                    const blurAmount = 1.25 * (index - i) * blurAmountMultiplier;
                    arr[i].style.setProperty("--blur-px", `${blurAmount}px`)
                } */

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
        } else if (lineTimes.start >= edtrackpos) {
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
        } else if (edtrackpos >= lineTimes.end) {
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
      })
    }
    //console.log("Ran")
    /* setTimeout(()=>startLyricsInInt(), 10) */
      //}
    //}, 25);
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




export function runLiiInt() {
  if (storage.get("intRunning") === "true") return
    
  storage.set("intRunning", "true")

  runLyricsInInt();
}

let lastLine = null;

export function scrollToActiveLine() {
  //const edtrackpos = Spicetify.Player.getProgress();
  /* if (!document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) return
  if (Spicetify.Platform.History.location.pathname === "/spicy-lyrics") {
      document.querySelectorAll("#LyricsPageContainer .lyricsParent .lyrics .line").forEach(line => {
        if (line.classList.contains("Active")) {
          const container = document.querySelector("#LyricsPageContainer .lyricsParent .lyrics");

          scrollElementIntoView(container, line);
        }
      })
    } */
    const def = !Spicetify.Player.isPlaying();
    if (def) return;
    //const edtrackpos = Spicetify.Player.getProgress();
    if (!document.querySelector("#LyricsPageContainer .lyricsParent .lyrics")) return;

    if (Spicetify.Platform.History.location.pathname === "/SpicyLyrics") {

      // Select all lines
      const lines = document.querySelectorAll("#LyricsPageContainer .lyricsParent .lyrics .line"); 
  
      // Find the first matching line
      let currentLine = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.classList.contains("Active")) {
          currentLine = line;
          break; // Exit the loop once a line is found
        }
      }
  
      if (currentLine) { 
        const container = document.querySelector("#LyricsPageContainer .lyricsParent .lyrics");
        if (lastLine && lastLine === currentLine) return;
        lastLine = currentLine
        scrollElementIntoView(container, currentLine); 
      }
    }
}

// Track the last active line and whether the user scrolled away

export function scrollElementIntoView(container, element) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const offsetTop = elementRect.top - containerRect.top + container.scrollTop;

  gsap.to(container, {
    duration: 0.15, // 0.2-second scroll duration
    scrollTo: {
      y: offsetTop - container.clientHeight / 2 + element.clientHeight / 2 + 90, 
      autoKill: true 
    },
    ease: "none" // Good: back.out(1.4)
  });
}

/* let intForScrollFirst = null;

// Main function to scroll to the active line
export function scrollToActiveLine(firstScroll = false) {
    const lyricsContainer = document.querySelector("#LyricsPageContainer .lyricsParent .lyrics");
    if (!lyricsContainer) return;

    if (Spicetify.Platform.History.location.pathname !== "/spicy-lyrics") return;

    let lines = document.querySelectorAll("#LyricsPageContainer .lyricsParent .lyrics .line");

    // Find the current active line
    let currentLine = Array.from(lines).find(line => line.classList.contains("Active"));

    // Scroll to the active line if it’s different from the last and if user hasn’t scrolled
      console.log("First Scroll", firstScroll)
    if (firstScroll) {
      //if (!currentLine) {
        intForScrollFirst = setInterval(() => {
          console.log("yes")
          const lines = document.querySelectorAll("#LyricsPageContainer .lyricsParent .lyrics .line");
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

    const lyricsContainer = document.querySelector("#LyricsPageContainer .lyricsParent .lyrics");

    // Clear any existing timeout if the user is actively scrolling
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }

    // Start a new timeout to scroll back to the active line if the user stops scrolling for 3 seconds
    scrollTimeout = setTimeout(() => {
        const activeLine = document.querySelector("#LyricsPageContainer .lyricsParent .lyrics .line.Active");
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

let animFrameId = null;

async function runLyricsInInt() {
  startLyricsInInt(Spicetify.Player.getProgress());
  animFrameId = requestAnimationFrame(runLyricsInInt);
}

export function stopLyricsInInt() {
  storage.set("intRunning", "false");
  cancelAnimationFrame(animFrameId);
}


const RefreshAnimationFrameInterval = new IntervalManager(1.5, () => {
  if (storage.get("intRunning") === "true") {
    stopLyricsInInt();
    runLiiInt();
    //Logger.log("RefreshAnimationFrameInterval: Refreshed Lyrics Animation Frame");
  }
});


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

  const el = document.querySelector<HTMLElement>("#LyricsPageContainer .lyricsParent .lyrics");
  if (!el) return
  const evl = el.addEventListener("click", LinesEvListener);
  LinesEvListenerMaid.Give(evl);
}

export function removeLinesEvListener() {
  if (!LinesEvListenerExists) return
  LinesEvListenerExists = false;

  const el = document.querySelector<HTMLElement>("#LyricsPageContainer .lyricsParent .lyrics");
  if (!el) return
  el.removeEventListener("click", LinesEvListener)
  LinesEvListenerMaid.Destroy();
}

const AnimationFrameInterval = {
  Refresher: RefreshAnimationFrameInterval,
}

export { AnimationFrameInterval }
