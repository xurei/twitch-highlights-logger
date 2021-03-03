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


export function slidingWindow_old(items, windowLength, threshold, max_t) {
    if (items.length > 0) {
        items = items.map(item => {
            item = {...item};
            item.content_offset_seconds = Math.round(item.content_offset_seconds);
            return item;
        });
        const chatWindow = new Array(max_t+windowLength).fill(0);
        items.forEach(item => {
            for (let t2=0; t2<windowLength;++t2) {
                chatWindow[item.content_offset_seconds + t2]++;
            }
        });
    
        const ranges = [];
        let currentRange = null;
        chatWindow.forEach((v,i) => {
            if (v >= threshold) {
                if (currentRange === null) {
                    console.log(`${i}s: ${v}`);
                    currentRange = { start: i };
                }
            }
            else {
                if (currentRange !== null) {
                    currentRange.end = i - 1;
                    ranges.push(currentRange);
                    currentRange = null;
                }
            }
        });
        
        return ranges;
    }
    return [];
}
