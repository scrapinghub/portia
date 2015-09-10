
const text = 'content';

function sum(numbers) {
    return numbers.reduce((a,b) => a+b, 0);
}

function nodeArea(node) {
    return sum(
        Array.from(node.getClientRects())
             .map(rect => rect.width*rect.height)
    );
}


function getFieldNamesRegex(seedWords) {
    let afix = '[a-z0-9_\\.-]+';
    let source = seedWords.map(word => [word, afix + word, word + afix].join('|')).join('|');
    return new RegExp('^(' + source + ')$', 'i');
}

function findField(seedWords, fieldNames) {
    let re = getFieldNamesRegex(seedWords);
    let bestMatch = null;
    for(let name of fieldNames) {
        if(re.test(name) && (!bestMatch || bestMatch.length > name.length)) {
            bestMatch = name;
        }
    }
    return bestMatch;
}

function suggestImageAnnotation(document, fieldNames, next) { // Returns [[field, node, attr, probability]]
    let field = findField(['img', 'image', 'photo'], fieldNames);
    if(!field) {
        return next([]);
    }

    let images = Array.from(document.querySelectorAll('img'));
    if(!images.length){
        return next([]);
    }
    // Wait for images to load
    setTimeout(() => {
        let biggest = images.reduce((a, b) => nodeArea(a) > nodeArea(b) ? a : b);
        return next([[field, biggest, 'src', 0.6]]);
    }, 500);
}

function suggestTitleAnnotation(document, fieldNames, next) {
    let field = findField(['title'], fieldNames);
    let title = document.querySelector('title');
    if(field && title) {
        return next([[field, title, text, 0.6]]);
    }
    return next([]);
}

function suggestMicrodataAnnotations(document, fieldNames, next) { // Returns [[field, node, attr, probability]]
    let res = [];
    let props = document.querySelectorAll('[itemprop]');
    for(let prop of props) {
        let propName = prop.getAttribute('itemprop');
        let field = findField([propName], fieldNames);
        if(field) {
            let exactMatch = propName.toLowerCase() === field.toLowerCase();
            let attr = prop.tagName === 'IMG' ? 'src' : text;
            res.push([field, prop, attr, exactMatch ? 0.8 : 0.5]);
        }
    }
    next(res);
}

let enabledSuggesters = [
    suggestTitleAnnotation,
    suggestImageAnnotation,
    suggestMicrodataAnnotations,
];

/**
 * Returns [[field, node, attr]]
 * Calls all the enabled suggesters and returns only the most probable
 * suggestion for each field.
 */
export function suggestAnnotations(document, fieldNames, callback) {
    let suggestionsByField = {};
    let pendingSuggesters = enabledSuggesters.length;

    let processSuggestions = (suggestions) => {
        for(let suggestion of suggestions) {
            if(!(suggestion[0] in suggestionsByField) || suggestion[3] > suggestionsByField[suggestion[3]]){
                suggestionsByField[suggestion[0]] = suggestion;
            }
        }
        pendingSuggesters--;
        if(pendingSuggesters === 0) {
            callback(Object.values(suggestionsByField).map(
                suggestion => suggestion.slice(0, 3)
            ));
        }
    };

    for(let suggester of enabledSuggesters) {
        suggester(document, fieldNames, processSuggestions);
    }
}

export function registerSuggester(suggester) {
    enabledSuggesters.push(suggester);
}

