
/**
 * Cleans, normalizes and validates URLs
 */
export function cleanUrl(url) {
    if(typeof url !== 'string') {
        return null;
    }
    url = url.trim();
    if(!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
    }
    try {
        url = new URL(url);
    } catch(e){
        return null;
    }
    if(!url.origin) {
        return null;
    }
    return url.toString();
}

/**
 * Four random characters
 */
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

export function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export function shortGuid(separator) {
    separator = typeof separator !== 'undefined' ? separator : '-';
    return s4() + separator + s4() + separator + s4();
}

export function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

