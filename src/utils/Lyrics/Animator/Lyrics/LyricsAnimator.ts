import { easeSinOut } from "d3-ease";
import Spring from '@socali/modules/Spring';
import Spline from 'cubic-spline';
import Defaults from "../../../../components/Global/Defaults";
import { LyricsObject } from "../../lyrics";
import { BlurMultiplier, timeOffset } from "../Shared";
import storage from "../../../storage";


const getSLMAnimation = (duration: number) => {
  return `SLM_GradientAnimation ${duration}ms linear forwards`
}

const getPreSLMAnimation = (duration: number) => {
  return `Pre_SLM_GradientAnimation ${duration}ms linear forwards`
}

// Define types for animation ranges
export interface AnimationPoint {
  Time: number;
  Value: number;
}

// Methods
export const GetSpline = (range: AnimationPoint[]) => {
	const times = range.map((value) => value.Time);
	const values = range.map((value) => value.Value);

	return new Spline(times, values);
}

export const Clamp = (value: number, min: number, max: number): number => {
	return Math.max(min, Math.min(value, max))
}

const LetterGlowMultiplier_Opacity = 185;

const ScaleRange = [
	{ Time: 0, Value: 0.95 },
	{ Time: 0.7, Value: 1.025 },
	{ Time: 1, Value: 1 }
];
const YOffsetRange = [
	{ Time: 0, Value: (1 / 100) },
	{ Time: 0.9, Value: -(1 / 60) },
	{ Time: 1, Value: 0 }
];
const GlowRange = [
	{ Time: 0, Value: 0 },
	{ Time: 0.15, Value: 1 },
	{ Time: 0.6, Value: 1 },
	{ Time: 1, Value: 0 }
];

const SimpleYOffsetRange = [
  { Time: 0, Value: (1 / 100) },
	{ Time: 1, Value: -0.04 }
]

const ScaleSpline = GetSpline(ScaleRange);
const YOffsetSpline = GetSpline(storage.get("simpleLyricsMode") === "true" ? SimpleYOffsetRange : YOffsetRange);

const LetterYOffsetSpline = GetSpline(YOffsetRange);

const GlowSpline = GetSpline(GlowRange);

const YOffsetDamping = 0.4;
const YOffsetFrequency = 1.25;
const ScaleDamping = 0.6;
const ScaleFrequency = 0.7;
const GlowDamping = 0.5;
const GlowFrequency = 1;

// NEW Dot Animation Constants
const DotAnimations = {
	YOffsetDamping: 0.4,
	YOffsetFrequency: 1.25,
	ScaleDamping: 0.6,
	ScaleFrequency: 0.7,
	GlowDamping: 0.5,
	GlowFrequency: 1,
	OpacityDamping: 0.5, // Assuming same as Glow
	OpacityFrequency: 1, // Assuming same as Glow

	ScaleRange: [
		{ Time: 0, Value: 0.75 }, // Resting (NotSung)
		{ Time: 0.7, Value: 1.05 }, // Peak animation
		{ Time: 1, Value: 1 } // End (Sung)
	],
	YOffsetRange: [ // Relative to font-size
		{ Time: 0, Value: 0 }, // Resting (NotSung)
		{ Time: 0.9, Value: -0.12 }, // Peak animation
		{ Time: 1, Value: 0 } // End (Sung)
	],
	GlowRange: [ // Controls --text-shadow-opacity and --text-shadow-blur-radius indirectly
		{ Time: 0, Value: 0 }, // Resting (NotSung)
		{ Time: 0.6, Value: 1 }, // Peak animation
		{ Time: 1, Value: 1 } // End (Sung) - Note: Inspiration code ends at 1, might need adjustment based on visual needs
	],
	OpacityRange: [ // Controls element opacity
		{ Time: 0, Value: storage.get("simpleLyricsMode") === "true" ? 0.27 : 0.35 }, // Resting (NotSung)
		{ Time: 0.6, Value: 1 }, // Peak animation
		{ Time: 1, Value: 1 } // End (Sung)
	]
};

// DotGroup Animation Constants
const DotGroupAnimations = {
	YOffsetDamping: 0.4,
	YOffsetFrequency: 1.25,
	ScaleDamping: 0.7, // 0.6
	ScaleFrequency: 5, // 4

	ScaleRange: [
		{
			Time: 0,
			Value: 0
		},
		{
			Time: 0.2,
			Value: 1.05
		},
		{
			Time: -0.075,
			Value: 1.15
		},
		{
			Time: -0,
			Value: 0
		} // Rest
	],
	OpacityRange: [
		{
			Time: 0,
			Value: 0
		},
		{
			Time: 0.5,
			Value: 1
		},
		{
			Time: -0.075,
			Value: 1
		},
		{
			Time: -0,
			Value: 0
		} // Rest
	],
	YOffsetRange: [ // This is relative to the font-size
		{
			Time: 0,
			Value: (1 / 100)
		}, // Lowest
		{
			Time: 0.9,
			Value: -(1 / 60)
		}, // Highest
		{
			Time: 1,
			Value: 0
		} // Rest
	]
};



const DotScaleSpline = GetSpline(DotAnimations.ScaleRange);
const DotYOffsetSpline = GetSpline(DotAnimations.YOffsetRange);
const DotGlowSpline = GetSpline(DotAnimations.GlowRange);
const DotOpacitySpline = GetSpline(DotAnimations.OpacityRange);

// DotGroup splines
const DotGroupScaleSpline = GetSpline(DotGroupAnimations.ScaleRange);
const DotGroupYOffsetSpline = GetSpline(DotGroupAnimations.YOffsetRange);
const DotGroupOpacitySpline = GetSpline(DotGroupAnimations.OpacityRange);

const SungLetterGlow = 0.2;

const createWordSprings = () => {
  if (Defaults.SimpleLyricsMode) {
    return {
      Scale: {
        Step: () => {},
        SetGoal: () => {},
      },
      YOffset: new Spring(YOffsetSpline.at(0), YOffsetFrequency, YOffsetDamping),
      Glow: {
        Step: () => {},
        SetGoal: () => {},
      },
    }
  }
	return {
		Scale: new Spring(ScaleSpline.at(0), ScaleFrequency, ScaleDamping),
		YOffset: new Spring(YOffsetSpline.at(0), YOffsetFrequency, YOffsetDamping),
		Glow: new Spring(GlowSpline.at(0), GlowFrequency, GlowDamping)
	};
};

// NEW Dot Springs Function
const createDotSprings = () => {
  if (Defaults.SimpleLyricsMode) {
    return {
      Scale: {
        Step: () => {},
        SetGoal: () => {},
      },
      YOffset: {
        Step: () => {},
        SetGoal: () => {},
      },
      Glow: {
        Step: () => {},
        SetGoal: () => {},
      },
      Opacity: new Spring(DotOpacitySpline.at(0), DotAnimations.OpacityFrequency, DotAnimations.OpacityDamping)
    }
  }
	return {
		Scale: new Spring(DotScaleSpline.at(0), DotAnimations.ScaleFrequency, DotAnimations.ScaleDamping),
		YOffset: new Spring(DotYOffsetSpline.at(0), DotAnimations.YOffsetFrequency, DotAnimations.YOffsetDamping),
		Glow: new Spring(DotGlowSpline.at(0), DotAnimations.GlowFrequency, DotAnimations.GlowDamping),
    Opacity: new Spring(DotOpacitySpline.at(0), DotAnimations.OpacityFrequency, DotAnimations.OpacityDamping)
	};
};

// DotGroup Springs Function - for animating the entire dotGroup element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createDotGroupSprings = () => {
  if (Defaults.SimpleLyricsMode) {
    return {
      Scale: {
        Step: () => {},
        SetGoal: () => {},
      },
      YOffset: {
        Step: () => {},
        SetGoal: () => {},
      },
      Opacity: {
        Step: () => {},
        SetGoal: () => {},
      },
    }
  }
	return {
		Scale: new Spring(DotGroupScaleSpline.at(0), DotGroupAnimations.ScaleFrequency, DotGroupAnimations.ScaleDamping),
		YOffset: new Spring(DotGroupYOffsetSpline.at(0), DotGroupAnimations.YOffsetFrequency, DotGroupAnimations.YOffsetDamping),
    Opacity: new Spring(DotGroupOpacitySpline.at(0), DotGroupAnimations.YOffsetFrequency, DotGroupAnimations.YOffsetDamping)
	};
};

const createLetterSprings = () => {
	return {
		Scale: new Spring(ScaleSpline.at(0), ScaleFrequency, ScaleDamping),
		YOffset: new Spring(LetterYOffsetSpline.at(0), YOffsetFrequency, YOffsetDamping),
		Glow: new Spring(GlowSpline.at(0), GlowFrequency, GlowDamping)
	};
};


// Visual Constants
const LineGlowRange = [
	{
		Time: 0,
		Value: 0
	},
	{
		Time: 0.5,
		Value: 1
	},
	{
		Time: 1,
		Value: 0
	}
]
const LineGlowSpline = GetSpline(LineGlowRange)

const LineGlowDamping = 0.5
const LineGlowFrequency = 1

const createLineSprings = () => {
  if (Defaults.SimpleLyricsMode) {
    return {
      Glow: {
        Step: () => {},
        SetGoal: () => {},
      },
    }
  }
	return {
		Glow: new Spring(LineGlowSpline.at(0), LineGlowFrequency, LineGlowDamping)
	};
};

export let Blurring_LastLine: number | null = null;
//const SKIP_ANIMATING_ACTIVE_WORD_DURATION = 235;
let lastFrameTime = Date.now();



export function setBlurringLastLine(c: number | null) {
  Blurring_LastLine = c;
}

function getElementState(currentTime: number, startTime: number, endTime: number): "NotSung" | "Active" | "Sung" {
  if (currentTime < startTime) return "NotSung";
  if (currentTime > endTime) return "Sung";
  return "Active";
}

function getProgressPercentage(currentTime: number, startTime: number, endTime: number): number {
  if (currentTime <= startTime) return 0;
  if (currentTime >= endTime) return 1;
  return (currentTime - startTime) / (endTime - startTime);
}

const LIMIT_FRAMES = false;
const FRAME_INTERVAL = 1000 / 45;
let lastAnimateFrameTime = 0;

export function Animate(position: number): void {
  const now = Date.now();
  if (LIMIT_FRAMES && now - lastAnimateFrameTime < FRAME_INTERVAL) {
    return; // Skip this frame to limit to 30fps
  }
  const deltaTime = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  lastAnimateFrameTime = now;

  const CurrentLyricsType = Defaults.CurrentLyricsType;
  const ProcessedPosition = position + timeOffset;

  if (!CurrentLyricsType || CurrentLyricsType === "None") return;

  const Credits = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits") ?? undefined;

  // Define proper types for the arrays and indices
  const applyBlur = (arr: Array<{HTMLElement: HTMLElement; StartTime: number; EndTime: number}>,
                     activeIndex: number,
                     blurMultiplierValue: number): void => {
      if (!arr[activeIndex]) return;

      arr[activeIndex].HTMLElement.style.setProperty("--BlurAmount", "0px");

      for (let i = activeIndex + 1; i < arr.length; i++) {
          const blurAmount = blurMultiplierValue * (i - activeIndex);
          if (getElementState(ProcessedPosition, arr[i].StartTime, arr[i].EndTime) === "Active") {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", "0px");
          } else {
              arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
          }
      }

      for (let i = activeIndex - 1; i >= 0; i--) {
          const blurAmount = blurMultiplierValue * (activeIndex - i);
          if (getElementState(ProcessedPosition, arr[i].StartTime, arr[i].EndTime) === "Active") {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
          }
      }
  };

  // These utility functions are not used but kept for future reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateOpacity = (percentage: number): number => {
    if (percentage <= 0.65) {
        return percentage * 100;
    } else {
        return (1 - percentage) * 100;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateLineGlowOpacity = (percentage: number): number => {
    if (percentage <= 0.5) {
        return percentage * 200;
    } else if (percentage <= 0.8 && percentage > 0.5) {
        return 100;
    } else {
        return (1 - ((percentage - 0.8) / 0.2)) * 100;
    }
  };

  if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;

      // Find the active line index
      let activeLineIndex = -1;
      for (let i = 0; i < arr.length; i++) {
          if (getElementState(ProcessedPosition, arr[i].StartTime, arr[i].EndTime) === "Active") {
              activeLineIndex = i;
              break;
          }
      }

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];
          const lineState = getElementState(ProcessedPosition, line.StartTime, line.EndTime);

          if (lineState === "Active") {
              if (Blurring_LastLine !== index) {
                applyBlur(arr, index, BlurMultiplier);
                Blurring_LastLine = index;
              };

              if (!line.HTMLElement.classList.contains("Active")) {
                  line.HTMLElement.classList.add("Active");
              }

              if (line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.remove("NotSung");
              }

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }

              /* if (line.HTMLElement.classList.contains("FeelSung")) {
                  line.HTMLElement.classList.remove("FeelSung");
              } */

              // Check if Syllables exists and has Lead property
              if (!line.Syllables?.Lead) {
                  console.warn("Line has no Syllables.Lead array");
                  continue;
              }

              const words = line.Syllables.Lead;
              for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
                  const word = words[wordIndex];
                  const wordState = getElementState(ProcessedPosition, word.StartTime, word.EndTime);
                  const percentage = getProgressPercentage(ProcessedPosition, word.StartTime, word.EndTime);

                  const isLetterGroup = word?.LetterGroup;
                  const isDot = word?.Dot;

                  if (!isDot) {
                      if (!word.AnimatorStore) {
                          word.AnimatorStore = createWordSprings();
                          word.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                          word.AnimatorStore.YOffset.SetGoal(YOffsetSpline.at(0), true);
                          word.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                      }

                      let targetScale: number;
                      let targetYOffset: number;
                      let targetGlow: number;
                      let targetGradientPos: number;

                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const totalDuration = word.EndTime - word.StartTime; // Kept for future reference

                      if (wordState === "Active") {
                          targetScale = ScaleSpline.at(percentage);
                          targetYOffset = YOffsetSpline.at(percentage);
                          targetGlow = GlowSpline.at(percentage);
                          targetGradientPos = -20 + (120 * percentage);
                      } else if (wordState === "NotSung") {
                          targetScale = ScaleSpline.at(0);
                          targetYOffset = YOffsetSpline.at(0);
                          targetGlow = GlowSpline.at(0);
                          targetGradientPos = -20;
                      } else { // Sung
                          targetScale = ScaleSpline.at(1);
                          targetYOffset = YOffsetSpline.at(1);
                          targetGlow = GlowSpline.at(1);
                          targetGradientPos = 100;
                      }

                      word.AnimatorStore.Scale.SetGoal(targetScale);
                      word.AnimatorStore.YOffset.SetGoal(targetYOffset);
                      word.AnimatorStore.Glow.SetGoal(targetGlow);

                      const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                      const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                      const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);

                      word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`;
                      word.HTMLElement.style.scale = `${currentScale}`;
                      if (!isLetterGroup) {
                        if (Defaults.SimpleLyricsMode) {
                          if (wordState === "Active" && !word.SLMAnimated) {
                            word.HTMLElement.style.removeProperty("--SLM_GradientPosition");
                            word.HTMLElement.style.animation = getSLMAnimation(totalDuration);
                            word.SLMAnimated = true;
                            /* word.PreSLMAnimated = false; */
                            /* const nextWord = words[wordIndex + 1];
                            if (nextWord) {
                              if (!nextWord.PreSLMAnimated) {
                                nextWord.PreSLMAnimated = true;
                                nextWord.HTMLElement.style.removeProperty("--SLM_GradientPosition");
                                setTimeout(() => {
                                  nextWord.HTMLElement.style.animation = getPreSLMAnimation(130);
                                }, Number(totalDuration - 500) ?? totalDuration);
                              }
                            } */
                          }
                          if (wordState === "NotSung") {
                            //if (!word.PreSLMAnimated) {
                              word.HTMLElement.style.animation = "none";
                              word.HTMLElement.style.setProperty("--SLM_GradientPosition", "-50%");
                            //}
                            word.SLMAnimated = false;
                            /* word.PreSLMAnimated = false; */
                          }
                          if (wordState === "Sung") {
                            word.HTMLElement.style.animation = "none";
                            word.HTMLElement.style.setProperty("--SLM_GradientPosition", "100%")
                            //word.HTMLElement.style.animation = getSLMAnimation(0);
                            word.SLMAnimated = false;
                            /* word.PreSLMAnimated = false; */
                          }
                        } else {
                          word.HTMLElement.style.setProperty("--gradient-position", `${targetGradientPos}%`);
                        }
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (2 * currentGlow * 1)}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${Math.min(currentGlow * 35, 100)}%`);
                      }
                  } else if (isDot && !isLetterGroup) {
                      // Refactored Dot Animation using Springs
                      if (!word.AnimatorStore) {
                        word.AnimatorStore = createDotSprings();
                        word.AnimatorStore.Scale.SetGoal(DotScaleSpline.at(0), true);
                        word.AnimatorStore.YOffset.SetGoal(DotYOffsetSpline.at(0), true);
                        word.AnimatorStore.Glow.SetGoal(DotGlowSpline.at(0), true);
                        word.AnimatorStore.Opacity.SetGoal(DotOpacitySpline.at(0), true);
                      }

                      let targetScale: number;
                      let targetYOffset: number;
                      let targetGlow: number;
                      let targetOpacity: number;

                  if (wordState === "Active") {
                          targetScale = DotScaleSpline.at(percentage);
                          targetYOffset = DotYOffsetSpline.at(percentage);
                          targetGlow = DotGlowSpline.at(percentage);
                          targetOpacity = DotOpacitySpline.at(percentage);
                      } else if (wordState === "NotSung") {
                          targetScale = DotScaleSpline.at(0);
                          targetYOffset = DotYOffsetSpline.at(0);
                          targetGlow = DotGlowSpline.at(0);
                          targetOpacity = DotOpacitySpline.at(0);
                      } else { // Sung
                          targetScale = DotScaleSpline.at(1);
                          targetYOffset = DotYOffsetSpline.at(1);
                          targetGlow = DotGlowSpline.at(1);
                          targetOpacity = DotOpacitySpline.at(1);
                      }

                      word.AnimatorStore.Scale.SetGoal(targetScale);
                      word.AnimatorStore.YOffset.SetGoal(targetYOffset);
                      word.AnimatorStore.Glow.SetGoal(targetGlow);
                      word.AnimatorStore.Opacity.SetGoal(targetOpacity);

                      const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                      const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                      const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);
                      const currentOpacity = word.AnimatorStore.Opacity.Step(deltaTime);

                      word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`; // Use --DefaultLyricsSize
                      word.HTMLElement.style.scale = `${currentScale}`;
                      word.HTMLElement.style.opacity = `${currentOpacity}`;
                      word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (6 * currentGlow)}px`); // Match inspiration
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * 90}%`); // Match inspiration
                  }

                    if (isLetterGroup && word.Letters) {
                    if (wordState === "Active") {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];

                        if (!letter.AnimatorStore) {
                          letter.AnimatorStore = createLetterSprings();
                          letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                          letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(0), true);
                          letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                        }

                        let targetScale: number, targetYOffset: number, targetGlow: number, targetGradient: number;

                        // Find active letter info (needed only for Active state calculation)
                        let activeLetterIndex = -1;
                        let activeLetterPercentage = 0;
                        if (wordState === "Active" && word.Letters) {
                          for (let i = 0; i < word.Letters.length; i++) {
                              if (getElementState(ProcessedPosition, word.Letters[i].StartTime, word.Letters[i].EndTime) === "Active") {
                                  activeLetterIndex = i;
                                  activeLetterPercentage = getProgressPercentage(ProcessedPosition, word.Letters[i].StartTime, word.Letters[i].EndTime);
                                  break;
                              }
                          }
                        }

                        // Determine initial targets based on word state
                        // wordState is Active - Default to resting, then apply proximity-based animation
                        targetScale = ScaleSpline.at(0); // Default active state target is resting
                        targetYOffset = LetterYOffsetSpline.at(0);
                        targetGlow = GlowSpline.at(0);

                        // --- Handle individual letter states ---
                        const letterState = getElementState(ProcessedPosition, letter.StartTime, letter.EndTime);

                        // Apply proximity-based animation if an active letter is found
                        if (activeLetterIndex !== -1) {
                          // Get the base animation values for the active letter
                          const percentageCount =
                            (Defaults.SimpleLyricsMode ?
                              getProgressPercentage(ProcessedPosition, word.StartTime, word.EndTime)
                            : activeLetterPercentage);

                          const baseScale = ScaleSpline.at(percentageCount) * (Defaults.SimpleLyricsMode ? 1.115 : 1);
                          const baseYOffset = LetterYOffsetSpline.at(percentageCount) * (Defaults.SimpleLyricsMode ? 1.5 : 1);
                          const baseGlow = GlowSpline.at(percentageCount) * (Defaults.SimpleLyricsMode ? 0.42 : 1);

                          // Get the resting values
                          const restingScale = ScaleSpline.at(0);
                          const restingYOffset = LetterYOffsetSpline.at(0);
                          const restingGlow = GlowSpline.at(0);

                          // Calculate distance from active letter and apply smooth falloff
                          const distance = Math.abs(k - activeLetterIndex);

                          // Use a steeper falloff curve for proximity effect
                          // This creates a more pronounced difference between the active letter and others
                          const falloff = Math.max(0, 1 / (1 + distance * 0.8));

                          // Apply the proximity-based animation values
                          targetScale = restingScale + (baseScale - restingScale) * falloff;
                          targetYOffset = restingYOffset + (baseYOffset - restingYOffset) * falloff;
                          targetGlow = restingGlow + (baseGlow - restingGlow) * falloff;
                        } // else - if no active letter, targets remain at resting state set above



                        // Only override values for NotSung letters or for letters in a non-Active word
                        if (letterState === "NotSung" && !Defaults.SimpleLyricsMode) {
                          // NotSung letters always use resting values
                          targetScale = ScaleSpline.at(0);
                          targetYOffset = LetterYOffsetSpline.at(0);
                          targetGlow = GlowSpline.at(0);
                        } else if (letterState === "Sung" && activeLetterIndex === -1) {
                          // Only apply SungLetterGlow to letters in words that don't have an active letter
                          // This preserves our proximity-based animation for active words
                          targetGlow = GlowSpline.at(SungLetterGlow);
                        }

                        // --- Determine Gradient based on individual letter state ---
                        if (letterState === "NotSung") {
                          targetGradient = -20;
                        } else if (letterState === "Sung") {
                          targetGradient = 100;
                        } else { // Active
                          // Only the *actual* active letter gets the animated gradient
                          targetGradient = (k === activeLetterIndex) ? (-20 + (120 * easeSinOut(activeLetterPercentage))) : -20;
                        }

                        // Set spring goals (smooth animation)
                        letter.AnimatorStore.Scale.SetGoal(targetScale);
                        letter.AnimatorStore.YOffset.SetGoal(targetYOffset);
                        letter.AnimatorStore.Glow.SetGoal(targetGlow);

                        // Step springs
                        const currentScale = letter.AnimatorStore.Scale.Step(deltaTime);
                        const currentYOffset = letter.AnimatorStore.YOffset.Step(deltaTime);
                        const currentGlow = letter.AnimatorStore.Glow.Step(deltaTime);

                        const totalDuration = letter.EndTime - letter.StartTime;
                        // Apply styles from springs and calculated gradient
                        if (Defaults.SimpleLyricsMode) {
                          if (letterState === "Active" && !letter.SLMAnimated) {
                            letter.HTMLElement.style.removeProperty("--SLM_GradientPosition");
                            letter.HTMLElement.style.animation = getSLMAnimation(totalDuration);
                            letter.SLMAnimated = true;
                          }
                          if (letterState === "NotSung") {
                            if (!letter.PreSLMAnimated) {
                              letter.HTMLElement.style.animation = "none";
                              letter.HTMLElement.style.setProperty("--SLM_GradientPosition", "-50%");
                            }
                            letter.SLMAnimated = false;
                          }
                          if (letterState === "Sung") {
                            letter.HTMLElement.style.animation = "none";
                            letter.HTMLElement.style.setProperty("--SLM_GradientPosition", "100%");
                            // letter.HTMLElement.style.animation = getSLMAnimation(0);
                            letter.SLMAnimated = false;
                          }
                        } else {
                          letter.HTMLElement.style.setProperty("--gradient-position", `${targetGradient}%`);
                        }
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset * 2}))`;
                        letter.HTMLElement.style.scale = `${currentScale}`;
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (12 * currentGlow)}px`);
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * LetterGlowMultiplier_Opacity}%`);
                    }
                } else if (wordState === "NotSung" && word.Letters) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];

                        if (!letter.AnimatorStore) {
                          letter.AnimatorStore = createLetterSprings();
                          letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                          letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(0), true);
                          letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                        }

                        letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0));
                        letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(0));
                        letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0));

                        const currentScale = letter.AnimatorStore.Scale.Step(deltaTime);
                        const currentYOffset = letter.AnimatorStore.YOffset.Step(deltaTime);
                        const currentGlow = letter.AnimatorStore.Glow.Step(deltaTime);

                        letter.HTMLElement.style.setProperty("--gradient-position", `-20%${Defaults.SimpleLyricsMode ? " !important" : ""}`);
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset * 2}))`;
                        letter.HTMLElement.style.scale = `${currentScale}`;
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (12 * currentGlow)}px`);
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * LetterGlowMultiplier_Opacity}%`);
                      }
                } else if (wordState === "Sung" && word.Letters) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];

                        if (!letter.AnimatorStore) {
                          letter.AnimatorStore = createLetterSprings();
                          letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                          letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(0), true);
                          letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                        }

                        letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(1));
                        letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(1));
                        letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(1));

                        const currentScale = letter.AnimatorStore.Scale.Step(deltaTime);
                        const currentYOffset = letter.AnimatorStore.YOffset.Step(deltaTime);
                        const currentGlow = letter.AnimatorStore.Glow.Step(deltaTime);

                        letter.HTMLElement.style.setProperty("--gradient-position", `100%${Defaults.SimpleLyricsMode ? " !important" : ""}`);
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset * 2}))`;
                        letter.HTMLElement.style.scale = `${currentScale}`;
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (12 * currentGlow)}px`);
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * LetterGlowMultiplier_Opacity}%`);
                      }
                    }
                  }
              }
          } else if (lineState === "NotSung") {
              line.HTMLElement.classList.add("NotSung");
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active")) {
                line.HTMLElement.classList.remove("Active");
              }
              /* const words = line.Syllables.Lead;
              for (const word of words) {
                  if (word.AnimatorStore && !word.Dot) {
                       word.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0));
                       word.AnimatorStore.YOffset.SetGoal(YOffsetSpline.at(0));
                       word.AnimatorStore.Glow.SetGoal(GlowSpline.at(0));
                        const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                        const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                        const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);
                        word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`;
                        word.HTMLElement.style.scale = `${currentScale}`;
                        if (!word.LetterGroup) {
                          word.HTMLElement.style.setProperty("--gradient-position", `-20%`);
                          word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (2 * currentGlow * 1)}px`);
                          word.HTMLElement.style.setProperty("--text-shadow-opacity", `${Math.min(currentGlow * 35, 100)}%`);
                        }
                  } else if (word.AnimatorStore && word.Dot && !word.LetterGroup) { // Handle dot reset
                      word.AnimatorStore.Scale.SetGoal(DotScaleSpline.at(0));
                      word.AnimatorStore.YOffset.SetGoal(DotYOffsetSpline.at(0));
                      word.AnimatorStore.Glow.SetGoal(DotGlowSpline.at(0));
                      word.AnimatorStore.Opacity.SetGoal(DotOpacitySpline.at(0));

                      const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                      const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                      const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);
                      const currentOpacity = word.AnimatorStore.Opacity.Step(deltaTime);

                      word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`;
                      word.HTMLElement.style.scale = `${currentScale}`;
                      word.HTMLElement.style.opacity = `${currentOpacity}`;
                      word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (6 * currentGlow)}px`);
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * 90}%`);
                  } else if (word.LetterGroup) {
                     for (let k = 0; k < word.Letters.length; k++) {
                      const letter = word.Letters[k];

                      if (!letter.AnimatorStore) {
                        letter.AnimatorStore = createLetterSprings();
                        letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                        letter.AnimatorStore.YOffset.SetGoal(YOffsetSpline.at(0), true);
                        letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                      }

                      letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0));
                      letter.AnimatorStore.YOffset.SetGoal(YOffsetSpline.at(0));
                      letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0));

                      const currentScale = letter.AnimatorStore.Scale.Step(deltaTime);
                      const currentYOffset = letter.AnimatorStore.YOffset.Step(deltaTime);
                      const currentGlow = letter.AnimatorStore.Glow.Step(deltaTime);

                      letter.HTMLElement.style.setProperty("--gradient-position", `-20%`);
                      letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset * 2}))`;
                      letter.HTMLElement.style.scale = `${currentScale}`;
                      letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (8 * currentGlow)}px`);
                      letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * LetterGlowMultiplier_Opacity}%`);
                    }
                  }
              } */
          } else if (lineState === "Sung") {
              line.HTMLElement.classList.add("Sung");
              line.HTMLElement.classList.remove("Active", "NotSung");

              /* // Apply FeelSung class to lines that are at a distance of 2 or more from the active line
              // Only for non-dot lines (regular lyrics lines)
              if (activeLineIndex !== -1) {
                  // Calculate distance from active line
                  const distance = activeLineIndex - index;

                  // If this is a Sung line that comes before the active line
                  // and is not the line directly before the active line
                  if (distance >= 2) {
                      line.HTMLElement.classList.add("FeelSung");
                  } else {
                      line.HTMLElement.classList.remove("FeelSung");
                  }
              } else {
                  line.HTMLElement.classList.remove("FeelSung");
              } */

              if (arr.length === index + 1) {
                if (Credits && !Credits.classList.contains("Active")) {
                  Credits.classList.add("Active");
                }
              }

              const checkNextLine = () => {
                const words = line.Syllables?.Lead;
                if (!words) return;
                for (let i = 0; i < words.length; i++) {
                    const word = words[i];
                    if (word.AnimatorStore && !word.Dot) {
                        word.AnimatorStore.Scale.SetGoal(ScaleSpline.at(1));
                        word.AnimatorStore.YOffset.SetGoal(YOffsetSpline.at(1));
                        word.AnimatorStore.Glow.SetGoal(GlowSpline.at(1));
                          const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                          const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                          const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);
                          word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`;
                          word.HTMLElement.style.scale = `${currentScale}`;
                          if (!word.LetterGroup) {
                            if (Defaults.SimpleLyricsMode) {
                              word.HTMLElement.style.animation = "none";
                              word.HTMLElement.style.setProperty("--SLM_GradientPosition", "100%");
                            } else {
                              word.HTMLElement.style.setProperty("--gradient-position", "100%");
                            }
                            word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (2 * currentGlow * 1)}px`);
                            word.HTMLElement.style.setProperty("--text-shadow-opacity", `${Math.min(currentGlow * 35, 100)}%`);
                          }
                    } else if (word.AnimatorStore && word.Dot && !word.LetterGroup) { // Handle dot sung state
                        word.AnimatorStore.Scale.SetGoal(DotScaleSpline.at(1));
                        word.AnimatorStore.YOffset.SetGoal(DotYOffsetSpline.at(1));
                        word.AnimatorStore.Glow.SetGoal(DotGlowSpline.at(1));
                        word.AnimatorStore.Opacity.SetGoal(DotOpacitySpline.at(1));

                        const currentScale = word.AnimatorStore.Scale.Step(deltaTime);
                        const currentYOffset = word.AnimatorStore.YOffset.Step(deltaTime);
                        const currentGlow = word.AnimatorStore.Glow.Step(deltaTime);
                        const currentOpacity = word.AnimatorStore.Opacity.Step(deltaTime);

                        word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`;
                        word.HTMLElement.style.scale = `${currentScale}`;
                        word.HTMLElement.style.opacity = `${currentOpacity}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (6 * currentGlow)}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * 90}%`);
                    }
                    if (word.LetterGroup && word.Letters) {
                        for (let k = 0; k < word.Letters.length; k++) {
                          const letter = word.Letters[k];

                          if (!letter.AnimatorStore) {
                            letter.AnimatorStore = createLetterSprings();
                            letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(0), true);
                            letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(0), true);
                            letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(0), true);
                          }

                          letter.AnimatorStore.Scale.SetGoal(ScaleSpline.at(1));
                          letter.AnimatorStore.YOffset.SetGoal(LetterYOffsetSpline.at(1));
                          letter.AnimatorStore.Glow.SetGoal(GlowSpline.at(1));

                          const currentScale = letter.AnimatorStore.Scale.Step(deltaTime);
                          const currentYOffset = letter.AnimatorStore.YOffset.Step(deltaTime);
                          const currentGlow = letter.AnimatorStore.Glow.Step(deltaTime);

                          letter.HTMLElement.style.setProperty("--gradient-position", `100%${Defaults.SimpleLyricsMode ? " !important" : ""}`);
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset * 2}))`;
                          letter.HTMLElement.style.scale = `${currentScale}`;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (12 * currentGlow)}px`);
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * LetterGlowMultiplier_Opacity}%`);
                        }
                  }
                }
              }



              const NextLine = arr[index + 1];
              if (NextLine) {
                const nextLineStatus = getElementState(ProcessedPosition, NextLine.StartTime, NextLine.EndTime);
                if (nextLineStatus === "NotSung" || nextLineStatus === "Active") {
                  checkNextLine();
                }
              } else if (!NextLine) {
                checkNextLine();
              }
          }
      }
  } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];
          const lineState = getElementState(ProcessedPosition, line.StartTime, line.EndTime);

          if (lineState === "Active") {
              if (Blurring_LastLine !== index) {
                applyBlur(arr, index, BlurMultiplier);
                Blurring_LastLine = index;
              };

              if (!line.HTMLElement.classList.contains("Active")) {
                  line.HTMLElement.classList.add("Active");
              }

              if (line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.remove("NotSung");
              }

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }

              const percentage = getProgressPercentage(ProcessedPosition, line.StartTime, line.EndTime);

              if (line.DotLine && line.Syllables?.Lead) {
                const dotArray = line.Syllables.Lead; // Assuming Syllables.Lead holds the dots for DotLine
                for (let i = 0; i < dotArray.length; i++) {
                  const dot = dotArray[i];
                  const dotState = getElementState(ProcessedPosition, dot.StartTime, dot.EndTime);
                  const dotPercentage = getProgressPercentage(ProcessedPosition, dot.StartTime, dot.EndTime);

                   // Refactored Dot Animation using Springs for Line Type
                  if (!dot.AnimatorStore) {
                      dot.AnimatorStore = createDotSprings();
                      dot.AnimatorStore.Scale.SetGoal(DotScaleSpline.at(0), true);
                      dot.AnimatorStore.YOffset.SetGoal(DotYOffsetSpline.at(0), true);
                      dot.AnimatorStore.Glow.SetGoal(DotGlowSpline.at(0), true);
                      dot.AnimatorStore.Opacity.SetGoal(DotOpacitySpline.at(0), true);
                  }

                  let targetScale: number;
                  let targetYOffset: number;
                  let targetGlow: number;
                  let targetOpacity: number;

                  if (dotState === "Active") {
                      targetScale = DotScaleSpline.at(dotPercentage);
                      targetYOffset = DotYOffsetSpline.at(dotPercentage);
                      targetGlow = DotGlowSpline.at(dotPercentage);
                      targetOpacity = DotOpacitySpline.at(dotPercentage);
                  } else if (dotState === "NotSung") {
                      targetScale = DotScaleSpline.at(0);
                      targetYOffset = DotYOffsetSpline.at(0);
                      targetGlow = DotGlowSpline.at(0);
                      targetOpacity = DotOpacitySpline.at(0);
                  } else { // Sung
                      targetScale = DotScaleSpline.at(1);
                      targetYOffset = DotYOffsetSpline.at(1);
                      targetGlow = DotGlowSpline.at(1);
                      targetOpacity = DotOpacitySpline.at(1);
                  }

                  dot.AnimatorStore.Scale.SetGoal(targetScale);
                  dot.AnimatorStore.YOffset.SetGoal(targetYOffset);
                  dot.AnimatorStore.Glow.SetGoal(targetGlow);
                  dot.AnimatorStore.Opacity.SetGoal(targetOpacity);

                  const currentScale = dot.AnimatorStore.Scale.Step(deltaTime);
                  const currentYOffset = dot.AnimatorStore.YOffset.Step(deltaTime);
                  const currentGlow = dot.AnimatorStore.Glow.Step(deltaTime);
                  const currentOpacity = dot.AnimatorStore.Opacity.Step(deltaTime);

                  dot.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${currentYOffset}))`; // Use --DefaultLyricsSize?
                  dot.HTMLElement.style.scale = `${currentScale}`;
                  dot.HTMLElement.style.opacity = `${currentOpacity}`;
                  dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (6 * currentGlow)}px`);
                  dot.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * 90}%`);
                }
              } else {
                // Existing Line animation (non-dot) -> Refactored to use Spring
                if (!line.AnimatorStore) {
                  line.AnimatorStore = createLineSprings();
                  line.AnimatorStore.Glow.SetGoal(LineGlowSpline.at(0), true);
                }

                let targetGlow: number;
                let targetGradientPos: number;

                if (lineState === "Active") {
                  targetGlow = LineGlowSpline.at(percentage);
                  targetGradientPos = percentage * 100; // Keep gradient separate from spring for now
                } else if (lineState === "NotSung") {
                  targetGlow = LineGlowSpline.at(0);
                  targetGradientPos = -20;
                } else { // Sung
                  targetGlow = LineGlowSpline.at(1);
                  targetGradientPos = 100;
                }

                line.AnimatorStore.Glow.SetGoal(targetGlow);
                const currentGlow = line.AnimatorStore.Glow.Step(deltaTime);

                // Apply styles using spring value for glow, keep direct calculation for gradient
                line.HTMLElement.style.setProperty("--gradient-position", `${targetGradientPos}%`);
                line.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${4 + (8 * currentGlow)}px`); // Adjusted to match reference code's glow effect
                line.HTMLElement.style.setProperty("--text-shadow-opacity", `${currentGlow * 50}%`); // Adjusted to match reference code's glow effect
              }
              if (Credits && Credits.classList.contains("Active")) {
                Credits.classList.remove("Active");
              }
          } else if (lineState === "NotSung") {
              if (!line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.add("NotSung");
              }
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active")) {
                line.HTMLElement.classList.remove("Active");
              }
          } else if (lineState === "Sung") {
              if (!line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.add("Sung");
              }
              line.HTMLElement.classList.remove("Active", "NotSung");

              if (arr.length === index + 1) {
                if (Credits && !Credits.classList.contains("Active")) {
                  Credits.classList.add("Active");
                }
              }
          }
      }
  }
}