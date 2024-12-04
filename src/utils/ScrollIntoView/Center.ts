export default function ScrollIntoCenterView(
  container: HTMLElement,
  element: HTMLElement,
  duration: number = 150, // Duration in milliseconds
) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const targetScrollTop =
    elementRect.top - containerRect.top + container.scrollTop -
    (container.clientHeight / 2 - element.clientHeight / 2);

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