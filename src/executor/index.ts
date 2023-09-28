import { EventEmitter } from 'node:events';

type TxFunction = (...args: any[]) => Promise<void>;

export class Executor {
  eventEmitter: EventEmitter;
  queue: TxFunction[];

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
    this.queue = [];
  }

  enqueue(fn: TxFunction, args: any[]) {
    let eventName = 'start';

    if (this.queue.length > 0) {
      eventName = this.queue[this.queue.length - 1].name;
    }

    this.eventEmitter.on(eventName, async (errorMessage: string) => {
      if (errorMessage) {
        this.eventEmitter.emit('error', errorMessage);
      }
      args.push(this.eventEmitter);
      await fn.apply(this, args);
      if (this.queue.length > 1) {
        this.queue.shift();
      } else {
        const last = this.queue.shift();
        if (last) {
          this.eventEmitter.on(last.name, (msg: string) => {
            this.eventEmitter.emit('done', msg);
          });
        } else {
          this.eventEmitter.emit('done');
        }
      }
    });

    this.queue.push(fn);
    return this;
  }

  async execute() {
    this.eventEmitter.emit('start');
  }
}