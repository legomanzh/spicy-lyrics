import Defaults from "../../../../components/Global/Defaults";
import { SpotifyPlayer } from "../../../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../../lyrics";
import { BlurMultiplier, IdleEmphasisLyricsScale, IdleLyricsScale, timeOffset } from "../Shared";

export let Blurring_LastLine = null;
const SKIP_ANIMATING_ACTIVE_WORD_DURATION = 200;

export function setBlurringLastLine(c) {
  Blurring_LastLine = c;
}

// Helper functions to determine state based on timing
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

export function Animate(position) {
  const CurrentLyricsType = Defaults.CurrentLyricsType;
  const edtrackpos = position + timeOffset;

  if (!CurrentLyricsType || CurrentLyricsType === "None") return;

  const Credits = document.querySelector<HTMLElement>("#SpicyLyricsPage .LyricsContainer .LyricsContent .Credits") ?? undefined;

  const applyBlur = (arr, activeIndex, BlurMultiplier) => {
      for (let i = activeIndex + 1; i < arr.length; i++) {
          const blurAmount = BlurMultiplier * (i - activeIndex);
          if (getElementState(edtrackpos, arr[i].StartTime, arr[i].EndTime) === "Active") {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
          }
      }

      for (let i = activeIndex - 1; i >= 0; i--) {
          const blurAmount = BlurMultiplier * (activeIndex - i);
          if (getElementState(edtrackpos, arr[i].StartTime, arr[i].EndTime) === "Active") {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `0px`);
          } else {
            arr[i].HTMLElement.style.setProperty("--BlurAmount", `${blurAmount >= 5 ? 5 : blurAmount}px`);
          }
      }
  };

  // Calculate opacity based on progress percentage
  const calculateOpacity = (percentage: number, word: any): number => {
    if (word?.BGWord) return 0;
    if (percentage <= 0.65) {
        return percentage * 100;
    } else {
        return (1 - percentage) * 100;
    }
  };

  // Calculate opacity based on progress percentage of a Line
  const calculateLineGlowOpacity = (percentage: number): number => {
    if (percentage <= 0.5) {
        return percentage * 200; // Goes from 0 to 100 in first 50%
    } else if (percentage <= 0.8 && percentage > 0.5) {
        return 100; // Stays at 100 between 50% and 80%
    } else {
        return (1 - ((percentage - 0.8) / 0.2)) * 100; // Goes from 100 to 0 in remaining time
    }
  };

  if (CurrentLyricsType === "Syllable") {
      const arr = LyricsObject.Types.Syllable.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];
          const lineState = getElementState(edtrackpos, line.StartTime, line.EndTime);

          if (lineState === "Active") {
              if (!SpotifyPlayer.IsPlaying) {
                applyBlur(arr, index, BlurMultiplier);
              }
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

              /* if (line.HTMLElement.classList.contains("OverridenByScroller")) {
                  line.HTMLElement.classList.remove("OverridenByScroller");
              } */

              const words = line.Syllables.Lead;
              for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
                  const word = words[wordIndex];
                  const wordState = getElementState(edtrackpos, word.StartTime, word.EndTime);
                  const percentage = getProgressPercentage(edtrackpos, word.StartTime, word.EndTime);

                  const isLetterGroup = word?.LetterGroup;
                  const isDot = word?.Dot;

                  if (wordState === "Active") {
                    // Dynamic calculations based on percentage
                    const blurRadius = 4 + (16 - 4) * percentage;
                    const textShadowOpacity = calculateOpacity(percentage, word) * 0.38;
                    const translateY = 0.01 + (-0.044 - 0.01) * percentage;
                    const scale = IdleLyricsScale + (1.017 - IdleLyricsScale) * percentage;
                    const gradientPosition = percentage * 100;
                    
                    if (isLetterGroup) {
                      const emphasisBlurRadius = 8 + (16 - 8) * percentage;
                      // const emphasisTranslateY = 0.02 + (-0.17 - 0.02) * percentage;
                      const emphasisScale = IdleEmphasisLyricsScale + (1.023 - IdleEmphasisLyricsScale) * percentage;
                      const emphasisTextShadowOpacity = calculateOpacity(percentage, word) * 30;

                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        const letterState = getElementState(edtrackpos, letter.StartTime, letter.EndTime);
                        const letterPercentage = getProgressPercentage(edtrackpos, letter.StartTime, letter.EndTime);

                        if (letterState === "Active") {
                          let translateY;
                          if (letterPercentage <= 0.5) {
                            translateY = 0 + (-0.13 - 0) * (letterPercentage / 0.5);
                          } else {
                            translateY = -0.13 + (0 - -0.13) * ((letterPercentage - 0.5) / 0.5);
                          }

                          const letterGradientPosition = `${letterPercentage * 100}%`;
                          letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                          letter.HTMLElement.style.scale = `${emphasisScale * 1.04}`;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${emphasisBlurRadius}px`);
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${emphasisTextShadowOpacity}%`);
                          letter.HTMLElement.style.setProperty("--gradient-position", letterGradientPosition);
                        } else if (letterState === "NotSung") {
                          letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.02))";
                          letter.HTMLElement.style.scale = IdleLyricsScale;
                          letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                          letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                          letter.HTMLElement.style.setProperty("--gradient-position", "-20%");
                        } else if (letterState === "Sung") {
                          const NextLetter = word.Letters[k + 1] ?? null;
                          if (NextLetter) {
                            const nextLetterPercentage = getProgressPercentage(edtrackpos, NextLetter.StartTime, NextLetter.EndTime);
                            const translateY = 0.02 + (-0.14 - 0.02) * nextLetterPercentage;

                            if (getElementState(edtrackpos, NextLetter.StartTime, NextLetter.EndTime) === "Active") {
                              letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(translateY * 0.75)}))`;
                              letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${(nextLetterPercentage * 100) * 0.95}%`);
                            } else {
                              const activeWord = word.Letters.find(l => getElementState(edtrackpos, l.StartTime, l.EndTime) === "Active");
                              if (activeWord) {
                                const activeWordPercentage = getProgressPercentage(edtrackpos, activeWord.StartTime, activeWord.EndTime);
                                const translateY = 0.02 + (-0.14 - 0.02) * activeWordPercentage;
                                letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${Math.abs(translateY * 0.5)}))`;
                                letter.HTMLElement.style.setProperty("--text-shadow-opacity", `${(activeWordPercentage * 100) * 0.75}%`);
                              }
                              letter.HTMLElement.style.scale = "1";
                            }
                          } else {
                            letter.HTMLElement.style.setProperty("--text-shadow-opacity", "25%");
                            letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                            letter.HTMLElement.style.scale = "1";
                          }
                          letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                        }
                      }

                      const emphasisGroupScale = IdleEmphasisLyricsScale + (1 - IdleEmphasisLyricsScale) * percentage;
                      word.HTMLElement.style.scale = `${emphasisGroupScale}`;
                      word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                      word.scale = emphasisScale;
                      word.glow = 0;
                    } else if (isDot) {
                      word.HTMLElement.style.setProperty("--opacity-size", `${0.2 + percentage}`);

                      let translateY;
                      if (percentage <= 0) {
                        translateY = 0 + (-0.07 - 0) * (percentage);
                      } else if (percentage <= 0.88) {
                        translateY = -0.07 + (0.2 - -0.07) * ((percentage - 0.88) / 0.88);
                      } else {
                        translateY = 0.2 + (0 - 0.2) * ((percentage - 0.22) / 0.88);
                      }
                      
                      word.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;

                      const scale = 0.75 + (1 - 0.75) * percentage;
                      word.HTMLElement.style.scale = `${0.2 + scale}`;
                      word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                      const textShadowOpacity = calculateOpacity(percentage, word) * 1.5;
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                      word.scale = scale;
                      word.glow = textShadowOpacity / 100;
                    } else {
                      word.HTMLElement.style.setProperty("--gradient-position", `${gradientPosition}%`);

                      const totalDuration = word.EndTime - word.StartTime;
                      if (totalDuration > SKIP_ANIMATING_ACTIVE_WORD_DURATION) {
                        word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                        word.HTMLElement.style.scale = `${scale}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                        word.scale = scale;
                        word.glow = textShadowOpacity / 100;
                      } else {
                        const blurRadius = 4 + (0 - 4) * percentage;
                        const textShadowOpacity = 0;
                        // const translateY = 0.01 + (0 - 0.01) * percentage;
                        // const scale = IdleLyricsScale + (1 - IdleLyricsScale) * percentage;

                        // word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${translateY}))`;
                        // word.HTMLElement.style.scale = `${scale}`;
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                        word.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                        // word.scale = scale;
                        word.glow = textShadowOpacity;
                      }
                      
                      if (totalDuration > SKIP_ANIMATING_ACTIVE_WORD_DURATION) {
                        word.translateY = translateY;
                      }

                      if (!isDot && !isLetterGroup) {
                        word.AnimatorStoreTime_glow = undefined;
                        word.AnimatorStoreTime_translateY = undefined;
                        word.AnimatorStoreTime_scale = undefined;
                      }
                    }
                } else if (wordState === "NotSung") {
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
                    } else if (!isDot) {
                      word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0.01))";
                      word.translateY = 0.01;
                    }
                    if (isDot) {
                      word.HTMLElement.style.setProperty("--opacity-size", "0.2");
                      word.HTMLElement.style.transform = "translateY(calc(var(--font-size) * 0.01))";
                      word.translateY = 0.01;
                      word.HTMLElement.style.scale = "0.75";
                    } else {
                      word.HTMLElement.style.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                      word.scale = isLetterGroup ? IdleEmphasisLyricsScale : IdleLyricsScale;
                      word.HTMLElement.style.setProperty("--gradient-position", "-20%");
                    }
                    if (!isDot && !isLetterGroup) {
                        word.AnimatorStoreTime_glow = undefined;
                        word.glow = 0;
                        word.AnimatorStoreTime_translateY = undefined;
                        word.translateY = 0.01;
                        word.AnimatorStoreTime_scale = undefined;
                        word.scale = IdleLyricsScale;
                    }
                    word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                    word.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                    word.glow = 0;
                } else if (wordState === "Sung") {
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        letter.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                        letter.HTMLElement.style.scale = "1";
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                        letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                      }
                      word.HTMLElement.style.transform = "translateY(calc(var(--DefaultLyricsSize) * 0))";
                      word.HTMLElement.style.scale = "1";
                    }

                    if (isDot) {
                      word.HTMLElement.style.setProperty("--opacity-size", "1.2");
                      word.HTMLElement.style.transform = "translateY(calc(var(--font-size) * 0))";
                      word.HTMLElement.style.scale = "1.2";
                      word.HTMLElement.style.setProperty("--text-shadow-opacity", "50%");
                      word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "12px");
                    } else if (!isLetterGroup) {
                        word.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        
                        // Get current styles
                        const element = word.HTMLElement;
                        const transform = word.translateY;
                        const currentTranslateY = transform;
                        const currentScale = word.scale;
                        const currentGlow = word.glow;
                    
                        // Track animation start time
                        if (!word.AnimatorStoreTime_translateY) {
                            word.AnimatorStoreTime_translateY = performance.now();
                        }

                        if (!word.AnimatorStoreTime_scale) {
                          word.AnimatorStoreTime_scale = performance.now();
                        }

                        if (!word.AnimatorStoreTime_glow) {
                          word.AnimatorStoreTime_glow = performance.now();
                        }
                    
                        // Calculate progress
                        const now = performance.now();
                        const elapsed_translateY = now - word.AnimatorStoreTime_translateY;
                        const elapsed_scale = now - word.AnimatorStoreTime_scale;
                        const elapsed_glow = now - word.AnimatorStoreTime_glow;

                        // Determine if we're animating up or down
                        const isAnimatingDown = currentTranslateY > 0 || currentScale > 1 || currentGlow > 0;

                        // Set durations based on direction
                        const duration_translateY = isAnimatingDown ? 550 : 480;
                        const duration_scale = isAnimatingDown ? 910 : 860;
                        const duration_glow = isAnimatingDown ? 85 : 85;

                        // Easing function for smoother animation
                        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
                        const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                        const progress_translateY = easeInOutCubic(Math.min(elapsed_translateY / duration_translateY, 1));
                        const progress_scale = easeInOutCubic(Math.min(elapsed_scale / duration_scale, 1));
                        const progress_glow = currentGlow === 0 ? 1 : easeOutCubic(Math.min(elapsed_glow / duration_glow, 1));
                    
                        // Define target values - always the same regardless of direction
                        const targetTranslateY = 0;
                        const targetScale = 1;
                        const targetGlow = 0;

                        // Interpolate values
                        const interpolate = (start: number, end: number, progress) => start + (end - start) * progress;
                        const newTranslateY = interpolate(currentTranslateY, targetTranslateY, progress_translateY);
                        const newScale = interpolate(currentScale, targetScale, progress_scale);
                        const newGlow = interpolate(currentGlow, targetGlow, progress_glow);
                    
                        element.style.setProperty("--text-shadow-opacity", `${newGlow * 100}%`);
                        element.style.transform = `translateY(calc(var(--DefaultLyricsSize) * ${newTranslateY}))`;
                        element.style.scale = `${newScale}`;
                    
                        // Reset animation tracking if progress is complete
                        if (progress_glow === 1) {
                            word.AnimatorStoreTime_glow = undefined;
                            word.glow = targetGlow;
                        }
                        if (progress_translateY === 1) {
                            word.AnimatorStoreTime_translateY = undefined;
                            word.translateY = targetTranslateY;
                        }
                        if (progress_scale === 1) {
                            word.AnimatorStoreTime_scale = undefined;
                            word.scale = targetScale;
                        }
                    }
                    word.HTMLElement.style.setProperty("--gradient-position", "100%");
                }
              }
              if (Credits && Credits.classList.contains("Active")) {
                Credits.classList.remove("Active");
              }
          } else if (lineState === "NotSung") {
              line.HTMLElement.classList.add("NotSung");
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active")/*  && !line.HTMLElement.classList.contains("OverridenByScroller") */) {
                line.HTMLElement.classList.remove("Active");
              }
          } else if (lineState === "Sung") {
              line.HTMLElement.classList.add("Sung");
              line.HTMLElement.classList.remove("Active", "NotSung");
              if (arr.length === index + 1) {
                if (Credits && !Credits.classList.contains("Active")) {
                  Credits.classList.add("Active");
                }
              }
          }
      }
  } else if (CurrentLyricsType === "Line") {
      const arr = LyricsObject.Types.Line.Lines;

      for (let index = 0; index < arr.length; index++) {
          const line = arr[index];
          const lineState = getElementState(edtrackpos, line.StartTime, line.EndTime);

          if (lineState === "Active") {
              if (!SpotifyPlayer.IsPlaying) {
                applyBlur(arr, index, BlurMultiplier);
              }
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

              /* if (line.HTMLElement.classList.contains("OverridenByScroller")) {
                  line.HTMLElement.classList.remove("OverridenByScroller");
              } */

              if (line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.remove("Sung");
              }

              const percentage = getProgressPercentage(edtrackpos, line.StartTime, line.EndTime);

              if (line.DotLine) {
                const Array = line.Syllables.Lead;
                for (let i = 0; i < Array.length; i++) {
                  const dot = Array[i];
                  const dotState = getElementState(edtrackpos, dot.StartTime, dot.EndTime);
                  const dotPercentage = getProgressPercentage(edtrackpos, dot.StartTime, dot.EndTime);

                  if (dotState === "Active") {
                    const blurRadius = 4 + (16 - 4) * dotPercentage;
                    const textShadowOpacity = calculateOpacity(dotPercentage, dot) * 1.5;
                    const scale = 0.75 + (1 - 0.75) * dotPercentage;

                    let translateY;
                    if (dotPercentage <= 0) {
                      translateY = 0 + (-0.07 - 0) * (dotPercentage);
                    } else if (dotPercentage <= 0.88) {
                      translateY = -0.07 + (0.2 - -0.07) * ((dotPercentage - 0.88) / 0.88);
                    } else {
                      translateY = 0.2 + (0 - 0.2) * ((dotPercentage - 0.22) / 0.88);
                    }

                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + dotPercentage}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * ${translateY}))`;
                    dot.HTMLElement.style.scale = `${0.2 + scale}`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
                  } else if (dotState === "NotSung") {
                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                    dot.HTMLElement.style.scale = `0.75`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `4px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `0%`);
                  } else if (dotState === "Sung") {
                    dot.HTMLElement.style.setProperty("--opacity-size", `${0.2 + 1}`);
                    dot.HTMLElement.style.transform = `translateY(calc(var(--font-size) * 0))`;
                    dot.HTMLElement.style.scale = `1.2`;
                    dot.HTMLElement.style.setProperty("--text-shadow-blur-radius", `12px`);
                    dot.HTMLElement.style.setProperty("--text-shadow-opacity", `50%`);
                  }
                }
              } else {
                line.HTMLElement.style.setProperty("--gradient-position", `${percentage * 100}%`);

                const blurRadius = 12 + (20 - 12) * percentage;
                const textShadowOpacity = calculateLineGlowOpacity(percentage) * 0.8;

                line.HTMLElement.style.setProperty("--text-shadow-blur-radius", `${blurRadius}px`);
                line.HTMLElement.style.setProperty("--text-shadow-opacity", `${textShadowOpacity}%`);
              }
              if (Credits && Credits.classList.contains("Active")) {
                Credits.classList.remove("Active");
              }
          } else if (lineState === "NotSung") {
              if (!line.HTMLElement.classList.contains("NotSung")) {
                  line.HTMLElement.classList.add("NotSung");
              }
              line.HTMLElement.classList.remove("Sung");
              if (line.HTMLElement.classList.contains("Active")/*  && !line.HTMLElement.classList.contains("OverridenByScroller") */) {
                line.HTMLElement.classList.remove("Active");
              }
              line.HTMLElement.style.setProperty("--gradient-position", `0%`);
          } else if (lineState === "Sung") {
              if (!line.HTMLElement.classList.contains("Sung")) {
                  line.HTMLElement.classList.add("Sung");
              }
              line.HTMLElement.classList.remove("Active", "NotSung");
              line.HTMLElement.style.setProperty("--gradient-position", `100%`);
              if (arr.length === index + 1) {
                if (Credits && !Credits.classList.contains("Active")) {
                  Credits.classList.add("Active");
                }
              }
          }
      }
  }
}