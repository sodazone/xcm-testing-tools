import { AckCallback } from '../types.js';

type TxFunction = () => void | Promise<void>;

export class Executor {
  #queue: TxFunction[];
  #endCallback: () => void | Promise<void> = () => {};

  constructor() {
    this.#queue = [];
  }

  get ack() : AckCallback {
    return this.#_ack.bind(this) as AckCallback;
  }

  push(fn: TxFunction) {
    this.#queue.push(fn);
    return this;
  }

  async execute(endCallback: () => void | Promise<void>) {
    this.#endCallback = endCallback;
    this.#_ack();
  }

  async #_ack(_?: any) {
    if (this.#queue.length > 0) {
      const f = this.#queue.shift();
      f && await f();
    } else {
      this.#endCallback();
    }
  }
}