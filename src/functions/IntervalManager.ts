import { Maid, Giveable } from '@spikerko/web-modules/Maid';



class IntervalManager implements Giveable {
  private maid: Maid;
  private intervalId: NodeJS.Timeout | null;
  private duration: number;
  private callback: () => void;
  public Running: boolean;
  public Destroyed: boolean;

  constructor(duration: number, callback: () => void) {
    this.maid = new Maid();
    this.intervalId = null;
    this.duration = duration * 1000;
    this.callback = callback;
    this.Running = false;
    this.Destroyed = false;
  }

  // Starts the interval
  public Start() {
    if (this.Destroyed) {
      logger.warn("Cannot start; IntervalManager has been destroyed.");
      return;
    }

    if (this.Running) {
      logger.warn("Interval is already running.");
      return;
    }

    this.intervalId = setInterval(this.callback, this.duration);
    this.Running = true;

    // Register the interval cleanup with the Maid
    this.maid.Give(() => this.Stop());
  }

  // Stops the interval without destroying the manager
  public Stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.Running = false;
    }
  }

  // Restarts the interval
  public Restart() {
    if (this.Destroyed) {
      logger.warn("Cannot restart; IntervalManager has been destroyed.");
      return;
    }

    this.Stop();
    this.Start();
  }

  // Fully cleans up the interval manager and makes it unusable
  public Destroy() {
    if (this.Destroyed) {
      console.warn("IntervalManager is already destroyed.");
      return;
    }

    this.Stop();
    this.maid.CleanUp();
    this.Destroyed = true;
    this.Running = false;
  }
}

export { IntervalManager };