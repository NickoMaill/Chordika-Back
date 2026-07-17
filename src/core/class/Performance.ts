import { performance } from 'node:perf_hooks';
import { TimeSpan } from 'timespan-ts';

export type PerfValueGroup = {
    total: number;
    url: string;
    data: PerfValue[];
};

export type PerfOutput = {
    total: number;
    details: PerfValue[];
};

export type PerfValueState = {
    category: string;
    description: string;
    duration: number;
    durationFromStart: number;
    reqUrl: string;
};

export type PerformanceState = {
    startCodeIso: string;
    chronoStart: number;
    perfValues: PerfValueState[];
    out?: PerfOutput | null;
};

export default class Performance {
    private perfValues: PerfValue[] = [];
    private startCode: Date;
    private chronoStart: number;
    public out: PerfOutput;

    public get PerfCount(): number {
        return this.perfValues.length;
    }

    public get TotalMillisecondsFromStart(): number {
        return performance.now() - this.chronoStart;
    }

    constructor(state?: PerformanceState) {
        if (state) {
            this.startCode = new Date(state.startCodeIso);
            this.chronoStart = state.chronoStart;
            this.perfValues = (state.perfValues ?? []).map((s) => new PerfValue(null, null, null, null, null, s));
            this.out = state.out ?? null;
            return;
        }

        this.startCode = new Date();
        this.chronoStart = performance.now();
    }

    public toState(): PerformanceState {
        return {
            startCodeIso: this.startCode.toISOString(),
            chronoStart: this.chronoStart,
            perfValues: this.perfValues.map((p) => ({ category: p.category, description: p.description, duration: p.duration, durationFromStart: p.durationFromStart, reqUrl: p.reqUrl })),
            out: this.out,
        };
    }

    public add(cat: string, desc: string, start: Date, url: string): void {
        if (url.match('/resources/getPerf')) return;
        this.perfValues.push(new PerfValue(cat, desc, TimeSpan.fromDateDiff(start, new Date()).totalMilliseconds, this.startCode, url));
    }

    public render(): PerfOutput {
        let realDuration = 0;
        this.perfValues.forEach((perf) => {
            realDuration += perf.duration;
            perf.durationFromStart = realDuration;
        });
        const output: PerfOutput = {
            details: this.perfValues,
            total: Math.ceil(this.perfValues.sum((p) => p.duration)),
        };
        return output;
    }
}

class PerfValue {
    public category: string;
    public description: string;
    public duration: number;
    public durationFromStart: number;
    public reqUrl: string;

    constructor(cat?: string, desc?: string, dur?: number, start?: Date, url?: string, state?: PerfValueState) {
        if (state) {
            this.category = state.category;
            this.description = state.description;
            this.duration = state.duration;
            this.durationFromStart = state.durationFromStart;
            this.reqUrl = url;
            return;
        }
        this.category = cat;
        this.description = desc;
        this.duration = dur;
        this.durationFromStart = TimeSpan.fromDateDiff(start, new Date()).totalMilliseconds;
        this.reqUrl = url;
    }
}
