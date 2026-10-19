/** Snapshot history independent of Fabric, React, and site branding. */
export class DesignHistory {
  private states: string[] = [];
  private index = -1;
  constructor(private readonly limit = 40) {}
  get canUndo() { return this.index > 0; }
  get canRedo() { return this.index < this.states.length - 1; }
  get current() { return this.states[this.index]; }
  reset(state: string) { this.states = [state]; this.index = 0; }
  push(state: string) {
    if (state === this.current) return false;
    this.states = this.states.slice(0, this.index + 1);
    this.states.push(state);
    if (this.states.length > this.limit) this.states.shift();
    this.index = this.states.length - 1;
    return true;
  }
  peek(direction: -1 | 1) { return this.states[this.index + direction]; }
  move(direction: -1 | 1) {
    if (this.peek(direction) !== undefined) this.index += direction;
  }
}
