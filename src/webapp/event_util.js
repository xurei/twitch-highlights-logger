export function buildSimulatedEventChange(name, value, attributes = {}) {
    const event = {};
    event.simulated = true;
    event.target = {
        name: name,
        value: value,
        getAttribute: (n) => {
            return attributes[n];
        },
    };
    return event;
}

export function buildSimulatedEventBlur(name) {
    const event = {};
    event.simulated = true;
    event.target = {
        name: name,
    };
    return event;
}

export function stopPropagation(e) {
    e.stopPropagation();
}
