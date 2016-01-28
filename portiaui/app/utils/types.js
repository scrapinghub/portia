export function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

export function isObject(obj) {
    return toType(obj) === 'object';
}

export function isArray(obj) {
    return Array.isArray(obj);
}

