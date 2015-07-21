
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

