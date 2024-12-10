import Defaults from "../../../../components/Global/Defaults";
import { SpotifyPlayer } from "../../../../components/Global/SpotifyPlayer";
import { LyricsObject } from "../../lyrics";
import { BlurMultiplier, IdleEmphasisLyricsScale, IdleLyricsScale, timeOffset } from "../Shared";

export function Animate(position) {
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
              applyBlur(arr, index, BlurMultiplier); // Adjust BlurMultiplier as needed.

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
                    const emphasisBlurRadius = 6 + (18 - 6) * percentage; // From 8px to 24px 
                    const textShadowOpacity = calculateOpacity(percentage) * 1.4; // From 0% to 100%
                    const translateY = -0.024 + (-0.022 - -0.01) * percentage; // From -0.005 to -0.2. (multiplied by var(--DefaultLyricsSize))
                    const scale = IdleLyricsScale + (1.03 - IdleLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                    const emphasisScale = IdleEmphasisLyricsScale + (1.035 - IdleEmphasisLyricsScale) * percentage; // From IdleLyricsScale to 1.025
                    const gradientPosition = percentage * 100; // Gradient position based on percentage
                    const emphasisTextShadowOpacity = calculateOpacity(percentage) * 100; // From 0% to 100%
                    
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
                            const translateY = -0.032 + (-0.032 - -0.01) * percentage;
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
                    word.HTMLElement.style.scale = "1.02";
                    if (isLetterGroup) {
                      for (let k = 0; k < word.Letters.length; k++) {
                        const letter = word.Letters[k];
                        letter.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                        letter.HTMLElement.style.scale = "1.02";
                        letter.HTMLElement.style.setProperty("--text-shadow-blur-radius", "4px");
                        letter.HTMLElement.style.setProperty("--text-shadow-opacity", "0%");
                        letter.HTMLElement.style.setProperty("--gradient-position", "100%");
                      }
                    }
                    word.HTMLElement.style.transform = `translateY(calc(var(--DefaultLyricsSize) * 0))`;
                    
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
              applyBlur(arr, index, BlurMultiplier);

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
