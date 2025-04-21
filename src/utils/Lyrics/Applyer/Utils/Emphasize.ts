import { ArabicPersianRegex } from "../../../Addons";
import { IdleEmphasisLyricsScale } from "../../Animator/Shared";
import { ConvertTime } from "../../ConvertTime";
import { CurrentLineLyricsObject, LyricsObject } from "../../lyrics";

const Substractions = {
    StartTime: 0,
    EndTime: 0
}

export default function Emphasize(letters: Array<string>, applyTo: HTMLElement, lead: any, isBgWord: boolean = false) {
    const StartTime = ConvertTime(lead.StartTime) - Substractions.StartTime;
    const EndTime = ConvertTime(lead.EndTime) - Substractions.EndTime;
    const totalDuration = EndTime - StartTime;
    const letterDuration = totalDuration / letters.length; // Duration per letter
    const word = applyTo;
    let Letters = [];

    letters.forEach((letter, index, lA) => {
        const letterElem = document.createElement("span");
        letterElem.textContent = letter;
        letterElem.classList.add("letter");
        letterElem.classList.add("Emphasis");
        const isLastLetter = index === letters.length - 1;
        // Calculate start and end time for each letter
        const letterStartTime = StartTime + index * letterDuration;
        const letterEndTime = (isLastLetter ? ((letterStartTime + letterDuration) + 0) : (letterStartTime + letterDuration));

        //const contentDuration = letterDuration > 150 ? letterDuration : 150;
        //letterElem.style.setProperty("--content-duration", `${contentDuration}ms`);

        if (isLastLetter) {
            letterElem.classList.add("LastLetterInWord")
        }

        if (ArabicPersianRegex.test(lead.Text)) {
            word.setAttribute("font", "Vazirmatn")
        }

        const mcont = isBgWord ? {
            BGLetter: true
        } : {};

        Letters.push({
            HTMLElement: letterElem,
            StartTime: letterStartTime,
            EndTime: letterEndTime,
            TotalTime: letterDuration,
            Emphasis: true,
            ...mcont
        })

        letterElem.style.setProperty("--gradient-position", `-20%`);
        letterElem.style.setProperty("--text-shadow-opacity", `0%`);
        letterElem.style.setProperty("--text-shadow-blur-radius", `4px`);
        letterElem.style.scale = IdleEmphasisLyricsScale.toString();
        letterElem.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0.02))`;

        word.appendChild(letterElem);
    });

    word.classList.add("letterGroup");

    const mcont = isBgWord ? {
        BGWord: true
    } : {};
    
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: word,
        StartTime: StartTime,
        EndTime: EndTime,
        TotalTime: totalDuration,
        LetterGroup: true,
        Letters,
        ...mcont
    })

    Letters = []
}