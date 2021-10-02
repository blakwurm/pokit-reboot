import { PokitOS } from "../../pokit";

export enum LogLevel {
  INFO,
  DEBUG,
  WARN,
  SEVERE
}

export interface LogRecord {
  context: any;
  level: LogLevel;
  url?: string;
  file?: string;
  function?: string;
  line?: number;
  column?: number;
  content: any[];
}

export type Logger = PokitLogger;

class PokitLogger {
  private debug: PokitDebug;
  private ctx: any
  constructor(ctx: any, dbg: PokitDebug) {
    this.debug = dbg;
    this.ctx = ctx;
  }

  private getRecord(level: LogLevel, content: any[]): LogRecord {
    if(!Error.captureStackTrace) return {
      context: this.ctx,
      level,
      content
    };

    // https://regex101.com/r/KMqlBZ/1
    let regex = /[\s]*at (?<function>[a-zA-Z\.0-9]+) \((?<url>.+(?=:[0-9]+:[0-9]+\))):(?<lineNumber>[0-9]+):(?<columnNumber>[0-9]+)\)/
    let obj: any = {};
    Error.captureStackTrace(obj);
    let stack = (obj.stack as string).split('\n');
    let groups = regex.exec(stack[4])!.groups!;

    let arr = groups.url.split('/')
    let file = arr[arr.length-1]

    return {
      context: this.ctx,
      level,
      url: groups.url,
      file,
      function: groups.function,
      line: parseInt(groups.lineNumber),
      column: parseInt(groups.columnNumber),
      content
    };
  }
  
  private log(level: LogLevel, content: any[]) {
    this.debug.push(this.getRecord(level, content));
  }

  Info(...content: any[]) {
    this.log(LogLevel.INFO, content);
  }

  Debug(...content: any[]) {
    this.log(LogLevel.DEBUG, content);
  }

  Warn(...content: any[]) {
    this.log(LogLevel.WARN, content);
  }

  Severe(...content: any[]) {
    this.log(LogLevel.SEVERE, content);
  }
}

@api("Debug")
export class PokitDebug {
  private log: LogRecord[];
  private worker: Worker;

  constructor(engine: PokitOS) {
    this.log = [];
    this.worker = new Worker('/pokit/modules/Debug/worker.js');
  }

  push(record: LogRecord) {
    this.log.push(record);
    this.worker.postMessage(record);
  }

  makeLogger(context?: any): Logger {
    return new PokitLogger(context, this);
  }
}