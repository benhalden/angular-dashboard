import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
    Trace = 0,
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
    Fatal = 5,
    Off = 6
}

@Injectable({
    providedIn: 'root'
})
export class LoggingService {


    level: LogLevel = environment.logLevel || LogLevel.Info;

    constructor() { }

    trace(message: string, ...parameters: any[]): void {
        if (this.shouldLog(LogLevel.Trace)) {
            console.trace(this.createLogEntry(message, LogLevel.Trace, parameters));
        }
    }

    debug(message: string, parameters?: any[]): void {
        if (this.shouldLog(LogLevel.Debug)) {
            console.debug(this.createLogEntry(message, LogLevel.Debug, parameters!));
        }
    }

    info(message: string, parameters?: any[]): void {
        if (this.shouldLog(LogLevel.Info)) {
            console.info(this.createLogEntry(message, LogLevel.Info, parameters!));
        }
    }

    warn(message: string, parameters?: any[]): void {
        if (this.shouldLog(LogLevel.Warn)) {
            console.warn(this.createLogEntry(message, LogLevel.Warn, parameters!));
        }
    }

    error(message: string, parameters?: any[]): void {
        if (this.shouldLog(LogLevel.Error)) {
            console.error(this.createLogEntry(message, LogLevel.Error, parameters!));
        }
    }

    createLogEntry(message: string, level: LogLevel, parameters?: any[]): string {
        let logLine: string = "";

        logLine = new Date() + " - ";
        logLine += ` [${LogLevel[level]}] - ${message}`;
        if (parameters?.length) {
            logLine += ` - ${this.formatParameters(parameters!)}`;
        }

        return logLine;
    }

    private formatParameters(parameters: any[]) {
        let result: string = parameters.join(",");

        if (parameters.some(p => typeof p == "object")) {
            result = "";
            for (let p of parameters) {
                result += JSON.stringify(p) + ",";
            }
        }
        return result;
    }

    private shouldLog(level: LogLevel): boolean {
        let result: boolean = false;
        if ((level >= this.level && level !== LogLevel.Off) || this.level === LogLevel.Trace) {
            result = true;
        }
        return result;
    }

}