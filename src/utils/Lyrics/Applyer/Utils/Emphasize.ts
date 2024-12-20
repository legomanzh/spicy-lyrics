import { ArabicPersianRegex } from "../../../Addons";
import { ConvertTime } from "../../ConvertTime";
import { CurrentLineLyricsObject, LyricsObject } from "../../lyrics";

export default function Emphasize(letters: Array<string>, applyTo: HTMLElement, lead: any, isBgWord: boolean = false) {
    const totalDuration = ConvertTime(lead.EndTime) - ConvertTime(lead.StartTime);
    const letterDuration = totalDuration / letters.length; // Duration per letter
    const word = applyTo;
    let Letters = [];

    letters.forEach((letter, index, lA) => {
        const letterElem = document.createElement("span");
        letterElem.textContent = letter;
        letterElem.classList.add("letter");
        letterElem.classList.add("Emphasis");

        // Calculate start and end time for each letter
        const letterStartTime = ConvertTime(lead.StartTime) + index * letterDuration;
        const letterEndTime = letterStartTime + letterDuration;

        if (index === lA.length - 1) {
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

        word.appendChild(letterElem);
    });

    word.classList.add("letterGroup");

    const mcont = isBgWord ? {
        BGWord: true
    } : {};
    
    LyricsObject.Types.Syllable.Lines[CurrentLineLyricsObject].Syllables.Lead.push({
        HTMLElement: word,
        StartTime: ConvertTime(lead.StartTime),
        EndTime: ConvertTime(lead.EndTime),
        TotalTime: totalDuration,
        LetterGroup: true,
        Letters,
        ...mcont
    })

    Letters = []
}