import Defaults from "../../../../components/Global/Defaults";
import { SpotifyPlayer } from "../../../../components/Global/SpotifyPlayer";
import Animator from "../../../Animator";
import { LyricsObject } from "../../lyrics";
import { BlurMultiplier, IdleEmphasisLyricsScale, IdleLyricsScale, timeOffset } from "../Shared";

export let Blurring_LastLine = null;

export function setBlurringLastLine(c) {
  Blurring_LastLine = c;
}

let AnimatorData = [];

const CurrentAnimatorInstance = AnimatorData.length - 1;

export function Animate(position) {
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  const edtrackpos = position + timeOffset;

  if (!CurrentLyricsType || CurrentLyricsType === "None") return;

  const Credits = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits");

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

  // Calculate opacity based on progress percentage
  const calculateOpacity = (percentage: number, word: any): number => {
    if (word?.BGWord) return 0;
    if (percentage <= 0.5) {
        // Progress 0% to 50%: Interpolate from 0% to 50% opacity
        return percentage * 100; // Linearly scale from 0 to 50
    } else {
        // Progress 50% to 100%: Interpolate from 50% to 0% opacity
        return (1 - percentage) * 100; // Linearly scale from 50 to 0
    }
  };

  if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];

          if (line.Status === "Active") {
              if (Blurring_LastLine !== index) {
                applyBlur(arr, index, BlurMultiplier); // Adjust BlurMultiplier as needed.
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

              if (line.HTMLElement.classList.contains("OverridenByScroller")) {
                  line.HTMLElement.classList.remove("OverridenByScroller");
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


                    // Dynamic calculations based on percentage
                    const blurRadius = 4 + (16 - 4) * percentage; // From 4px to 16px
                    const textShadowOpacity = calculateOpacity(percentage, word) * 0.5; // From 0% to 100%
                    const translateY = 0.01 + (-0.06 - 0.01) * percentage;
                    const scale = IdleLyricsScale + (1.025 - IdleLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                    const gradientPosition = percentage * 100; // Gradient position based on percentage
                    
                    // Apply styles dynamically
                    if (isLetterGroup) {
                      const emphasisBlurRadius = 4 + (12 - 4) * percentage; // From 8px to 24px 
                      const emphasisTranslateY = 0.02 + (-0.065 - 0.02) * percentage; // From -0.005 to -0.2. (multiplied by var(--DefaultLyricsSize))
                      const emphasisScale = IdleEmphasisLyricsScale + (1.034 - IdleEmphasisLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                      const emphasisTextShadowOpacity = calculateOpacity(percentage, word) * 80; // From 0% to 100%
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];

                        if (letter.Status === "Active") {
                          // Calculate percentage of progress through the letter
                          const totalDuration = letter.EndTime - letter.StartTime;
                          const elapsedDuration = edtrackpos - letter.StartTime;
                          const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1

                          let translateY;
                          if (percentage <= 0.5) {
                            // Phase 1: -0.2 to -0.3
                            translateY = 0 + (-0.08 - 0) * (percentage / 0.5);
                          } else {
                            // Phase 2: -0.3 to 0
                            translateY = -0.08 + (0 - -0.08) * ((percentage - 0.5) / 0.5);
                          }

                          const letterGradientPosition = `${percentage * 100}%`; // Gradient position based on percentage
                          //letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY * 1.5}))`;
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                          letter.HTMLElement.style.scale = `${emphasisScale * 1.001}`;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${emphasisBlurRadius}px`);
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${emphasisTextShadowOpacity}%`);
                          letter.HTMLElement.style.setProperty("--gradient-position", letterGradientPosition);
                        } else if (letter.Status === "NotSung") {
                          // NotSung styles
                          letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
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
                            const translateY = 0.02 + (-0.065 - 0.02) * percentage;
                            letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(translateY * 0.8)}))`;

                            if (NextLetter.Status === "Active") {
                              letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${(percentage * 100) * 0.85}%`);
                            } else {
                              letter.HTMLElement.style.setProperty("--text-shadow-opacity", `50%`);
                            }
                          } else {
                            letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                            letter.HTMLElement.style.setProperty("--text-shadow-opacity", `30%`);
                          }

                          letter.HTMLElement.style.scale = "1";
                          /* letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px"); */
                          letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                        }
                      }
                      
                      word.HTMLElement.style.scale = `${emphasisScale}`;
                      word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${emphasisTranslateY}))`;
                      word.scale = emphasisScale;
                      word.glow = 0;
                     /*  word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${emphasisBlurRadius * 0.8}px`);
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", `${emphasisTextShadowOpacity * 0.8}%`); */
                    } else {
                      if (isDot) {
                        word.HTMLElement.style.setProperty("--opacity-size", `${0.2 + percentage}`);

                        let translateY;
                        if (percentage <= 0) {
                          // Phase 1: -0.01 to -0.3
                          translateY = 0 + (-0.07 - 0) * (percentage);
                        } else if (percentage <= 0.88) {
                          // Phase 2: -0.3 to 0.15
                          translateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                        } else {
                          // Phase 3: 0.15 to 0
                          translateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                        }
                        
                        word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;

                        const scale = 0.75 + (1 - 0.75) * percentage;
                        word.HTMLElement.style.scale = `${0.2 + scale}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                        const textShadowOpacity = calculateOpacity(percentage, word) * 10; // From 0% to 100%
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                        word.scale = scale;
                        word.glow = textShadowOpacity / 100;
                      } else {
                        word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                        word.HTMLElement.style.scale = `${scale}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                        word.HTMLElement.style.setProperty("--gradient-position", `${gradientPosition}%`);
                        word.scale = scale;
                        word.glow = textShadowOpacity / 100;
                      }
                      word.translateY = translateY;
                    }
                } else if (word.Status === "NotSung") {
                    // NotSung styles
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                        letter.HTMLElement.style.scale = IdleEmphasisLyricsScale;
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                        letter.HTMLElement.style.setProperty("--gradient-position", "-20%");
                      }
                      word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                      word.translateY = 0.02;
                    } else {
                      word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.01))";
                      word.translateY = 0.01;
                    }
                    if (isDot) {
                      word.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                      word.HTMLElement.style.transform = "translateY(calc(var(--font-size) * 0.01))";
                      word.translateY = 0.01;
                      word.HTMLElement.style.scale = "0.75";
                    } else {
                      word.HTMLElement.style.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                      word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                      word.HTMLElement.style.setProperty("--gradient-position", "-20%");
                    }
                    word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                    word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                    word.glow = 0;
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
                      word.HTMLElement.style.scale = "1";
                    }

                    

                    if (isDot) {
                      word.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                      word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                      word.HTMLElement.style.scale = "1.2";
                    } else if (!isLetterGroup) {
                        // Get current styles
                        const element = word.HTMLElement;
                        const transform = word.translateY;
                    
                        // Extract current translateY value from transform
                        const currentTranslateY = transform;
                    
                        // Extract current scale from the `scale` property
                        const currentScale = word.scale;

                        const currentGlow = word.glow;
                    
                        // Track animation start time
                        if (!word.AnimatorStoreTime_translateY) {
                            word.AnimatorStoreTime_translateY = performance.now(); // Store start time for the element
                        }

                        if (!word.AnimatorStoreTime_scale) {
                          word.AnimatorStoreTime_scale = performance.now(); // Store start time for the element
                        }

                        if (!word.AnimatorStoreTime_glow) {
                          word.AnimatorStoreTime_glow = performance.now(); // Store start time for the element
                        }
                    
                        // Calculate progress
                        const now = performance.now();
                        const elapsed_translateY = now - word.AnimatorStoreTime_translateY;
                        const elapsed_scale = now - word.AnimatorStoreTime_scale;
                        const elapsed_glow = now - word.AnimatorStoreTime_glow;

                        const duration_translateY = 250; // Animation duration in milliseconds
                        const progress_translateY = Math.min(elapsed_translateY / duration_translateY, 1); // Normalize progress [0, 1]

                        const duration_scale = 750; // Animation duration in milliseconds
                        const progress_scale = Math.min(elapsed_scale / duration_scale, 1); // Normalize progress [0, 1]

                        const duration_glow = 200; // Animation duration in milliseconds
                        const progress_glow = Math.min(elapsed_glow / duration_glow, 1); // Normalize progress [0, 1]
                    
                        // Define target values
                        const targetTranslateY = 0; // Final translateY is 0
                        const targetScale = 1; // Final scale is 1
                        const targetGlow = 0; // Final glow is 0


                        // Interpolate values
                        const interpolate = (start: number, end: number, progress) => start + (end - start) * progress;
                        const newTranslateY = interpolate(currentTranslateY, targetTranslateY, progress_translateY);
                        const newScale = interpolate(currentScale, targetScale, progress_scale);
                        const newGlow = interpolate(currentGlow, targetGlow, progress_glow);
                    
                        // Set new styles
                        element.style.setProperty("--text-shadow-opacity", `${newGlow * 100}%`);
                    
                        // Apply interpolated styles
                        element.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`;
                        element.style.scale = `${newScale}`;
                    
                        // Reset animation tracking if progress is complete
                        if (progress_glow === 1) {
                            word.AnimatorStoreTime_glow = undefined; // Allow re-animation later if needed
                            word.glow = 0;
                        }
                        if (progress_translateY === 1) {
                            word.AnimatorStoreTime_translateY = undefined; // Allow re-animation later if needed
                            word.translateY = 0;
                        }
                        if (progress_scale === 1) {
                            word.AnimatorStoreTime_scale = undefined; // Allow re-animation later if needed
                            word.scale = 1;
                        }
                    }
                    // Handle letters if it's a LetterGroup
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
                  word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                  word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                  word.HTMLElement.style.setProperty("--gradient-position", "100%");
                    
                }
              }
              if (Credits) {
                Credits.classList.remove("Active");
              }
          } else if (line.Status === "NotSung") {
              line.HTMLElement.classList.add("NotSung");
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
                line.HTMLElement.classList.remove("Active");
              }

          } else if (line.Status === "Sung") {
              line.HTMLElement.classList.add("Sung");
              line.HTMLElement.classList.remove("Active", "NotSung");
              if (arr.length === index + 1) {
                if (Credits) {
                  Credits.classList.add("Active");
                }
              }
          }
      }
  } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];

          if (line.Status === "Active") {
              if (Blurring_LastLine !== index) {
                applyBlur(arr, index, BlurMultiplier); // Adjust BlurMultiplier as needed.
                Blurring_LastLine = index;
              };

              if (!line.HTMLElement.classList.contains("Active")) {
                  line.HTMLElement.classList.add("Active");
              }

              if (line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.remove("NotSung");
              }

              if (line.HTMLElement.classList.contains("OverridenByScroller")) {
                  line.HTMLElement.classList.remove("OverridenByScroller");
              }

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }

              // Calculate percentage of progress through the word
              const totalDuration = line.EndTime - line.StartTime;
              const elapsedDuration = edtrackpos - line.StartTime;
              const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1


              if (line.DotLine) {
                const Array = line.Syllables.Lead;
                for (let i = 0; i < Array.length; i++) {
                  const dot = Array[i];
                  if (dot.Status === "Active") {
                    // Calculate percentage of progress through the word
                    const totalDuration = dot.EndTime - dot.StartTime;
                    const elapsedDuration = edtrackpos - dot.StartTime;
                    const percentage = Math.max(0, Math.min(elapsedDuration / totalDuration, 1)); // Clamp percentage between 0 and 1

                    const blurRadius = 4 + (16 - 4) * percentage; // From 4px to 16px
                    const textShadowOpacity = calculateOpacity(percentage, dot) * 1.5; // From 0% to 100%
                    //const translateY = -0.02 + (-0.02 - -0.01) * percentage; // From -0.005 to -0.2. (multiplied by var(--DefaultLyricsSize))
                    const scale = 0.75 + (1 - 0.75) * percentage;

                    let translateY;
                    if (percentage <= 0) {
                      // Phase 1: -0.01 to -0.3
                      translateY = 0 + (-0.07 - 0) * (percentage);
                    } else if (percentage <= 0.88) {
                      // Phase 2: -0.3 to 0.15
                      translateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                    } else {
                      // Phase 3: 0.15 to 0
                      translateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                    }

                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + percentage}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
                    dot.HTMLElement.style.scale = `${0.2 + scale}`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                  } else if (dot.Status === "NotSung") {
                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                    dot.HTMLElement.style.scale = `0.75`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `4px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
                  } else if (dot.Status === "Sung") {
                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                    dot.HTMLElement.style.scale = `1.2`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `4px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
                  }
                }
              } else {
                line.HTMLElement.style.setProperty("--gradient-position", `${percentage * 100}%`);
              }

          } else if (line.Status === "NotSung") {
              if (!line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.add("NotSung");
              }
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active") && !line.HTMLElement.classList.contains("OverridenByScroller")) {
                line.HTMLElement.classList.remove("Active");
              }
              line.HTMLElement.style.setProperty("--gradient-position", `0%`);
          } else if (line.Status === "Sung") {
              if (!line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.add("Sung");
              }
              line.HTMLElement.classList.remove("Active", "NotSung");
              line.HTMLElement.style.setProperty("--gradient-position", `100%`);
          }
      }
  }
}


/* const PlayPauseEID = Global.Event.listen("playback:playpause", (e) => {
  console.log("PlayedPaused", e)
  const arr = LyricsObject.Types[Defaults.CurrentLyricsType]?.Lines;

  for (let index = 0; index < arr.length; index++) {
      const line = arr[index];
      if (e.data.isPaused) {
        line.HTMLElement.style.setProperty("--BlurAmount", `0px`);
        line.HTMLElement.style.setProperty("--Vocal-NotSung-opacity", `1`);
        line.HTMLElement.style.setProperty("--Vocal-Sung-opacity", `0.57`);
        line.HTMLElement.style.setProperty("--gradient-alpha", `1`);
        line.HTMLElement.style.setProperty("--gradient-alpha-end", `1`);
      } else {
        line.HTMLElement.style.removeProperty("--Vocal-NotSung-opacity");
        line.HTMLElement.style.removeProperty("--Vocal-Sung-opacity");
        line.HTMLElement.style.removeProperty("--gradient-alpha");
        line.HTMLElement.style.removeProperty("--gradient-alpha-end");
      }
  }
}) */


function DelayAnimate(from, to, duration, word, name) {
  // Track animation start time
  if (!word.AnimatorStoreTime) {
      word.AnimatorStoreTime = performance.now(); // Store start time for the element
  }

  // Calculate progress
  const now = performance.now();
  const elapsed = now - word.AnimatorStoreTime;
  const progress = Math.min(elapsed / duration, 1); // Normalize progress [0, 1]

  // Interpolate values
  const interpolate = (start: number, end: number) => start + (end - start) * progress;
  const newNumber = interpolate(from, to);

  word[name] = newNumber;

  // Reset animation tracking if progress is complete
  if (progress === 1) {
      word.AnimatorStoreTime = undefined; // Allow re-animation later if needed
      word[name] = to;
  }
}