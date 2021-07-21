export function slidingWindow(items, windowLength, threshold, rollback) {
    rollback = rollback || 0;
    if (items.length > 0) {
        const ranges = [];
        
        let i = 0;
        
        while (i < items.length) {
            let j = i + 1;
            while (j < items.length && items[j].content_offset_seconds < items[i].content_offset_seconds + windowLength) {
                ++j;
            }
            --j;
            
            const nbMatches = j - i + 1;
            if (nbMatches >= threshold) {
                ranges.push({ start: Math.max(0, items[i].content_offset_seconds - rollback), end: items[j].content_offset_seconds, nbMatches: nbMatches });
                i = j + 1;
            }
            else {
                ++i;
            }
        }
        return ranges;
    }
    return [];
}
