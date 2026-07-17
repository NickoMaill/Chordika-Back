class LogColors {
    public readonly Reset;
    public readonly Bright;
    public readonly Dim;
    public readonly Underscore;
    public readonly Blink;
    public readonly Reverse;
    public readonly Hidden;
    public readonly Reload;
    public readonly FgBlack;
    public readonly FgRed;
    public readonly FgGreen;
    public readonly FgYellow;
    public readonly FgBlue;
    public readonly FgMagenta;
    public readonly FgCyan;
    public readonly FgWhite;
    public readonly BgBlack;
    public readonly BgRed;
    public readonly BgGreen;
    public readonly BgYellow;
    public readonly BgBlue;
    public readonly BgMagenta;
    public readonly BgCyan;
    public readonly BgWhite;
    constructor() {
        this.Bright = '\x1b[1m';
        this.Dim = '\x1b[2m';
        this.Underscore = '\x1b[4m';
        this.Blink = '\x1b[5m';
        this.Reverse = '\x1b[7m';
        this.Hidden = '\x1b[8m';
        this.Reload = '\x1b[0m';
        this.FgBlack = '\x1b[30m';
        this.FgRed = '\x1b[31m';
        this.FgGreen = '\x1b[32m';
        this.FgYellow = '\x1b[33m';
        this.FgBlue = '\x1b[34m';
        this.FgMagenta = '\x1b[35m';
        this.FgCyan = '\x1b[36m';
        this.FgWhite = '\x1b[37m';
        this.BgBlack = '\x1b[40m';
        this.BgRed = '\x1b[41m';
        this.BgGreen = '\x1b[42m';
        this.BgYellow = '\x1b[43m';
        this.BgBlue = '\x1b[44m';
        this.BgMagenta = '\x1b[45m';
        this.BgCyan = '\x1b[46m';
        this.BgWhite = '\x1b[47m';
        this.Reset = '\x1b[0m';
    }
}

export default new LogColors();
