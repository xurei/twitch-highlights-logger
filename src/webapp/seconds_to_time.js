export function secondsToTime(t) {
    t = Math.floor(t);
    const seconds = (t%60);
    t -= seconds;
    t /= 60;
    const minutes = (t%60);
    t -= minutes;
    t /= 60;
    const hours = t;
    return `${hours}:${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
}
