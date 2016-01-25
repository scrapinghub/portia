
const text = 'content';

function imageScore(img) {
    const cr = img.getBoundingClientRect();
    const area = cr.width*cr.height;
    const penalization = cr.top > 1000 ? 500/cr.top : 1; // Penalize images under the fold
    return area*penalization;
}

function xpath(expr, ctx, type){
    ctx = ctx || document;
    type = type || XPathResult.ANY_TYPE;
    var doc = ctx.nodeType === Node.DOCUMENT_NODE ? ctx : ctx.ownerDocument;
    var nsResolver = doc.createNSResolver(doc.documentElement);
    var arr = [], i = null;
    try {
        var res = doc.evaluate(expr, ctx, nsResolver, type, null);
        type = res.resultType;
        if(type === XPathResult.NUMBER_TYPE) {
            return res.numberValue;
        } else if (type === XPathResult.STRING_TYPE) {
            return res.stringValue;
        } else if (type === XPathResult.BOOLEAN_TYPE) {
            return res.booleanValue;
        } else if (type === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || type === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
            while((i = res.iterateNext()) !== null) {
                arr.push(i);
            }
            return arr;
        } else if (type === XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE || type === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
            for (i = 0; i < res.snapshotLength; i++ ) {
                arr.push(res.snapshotItem(i));
            }
            return arr;
        } else if (type === XPathResult.ANY_UNORDERED_NODE_TYPE || type === XPathResult.FIRST_ORDERED_NODE_TYPE) {
            return res.singleNodeValue;
        } else {
            throw new Error('Unknown result type ' + type);
        }
    } catch(e) {
        console.log(e);
        return null;
    }
}

function xpath_one(expr, ctx) {
    return xpath(expr, ctx, XPathResult.FIRST_ORDERED_NODE_TYPE);
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
        let biggest = images.reduce((a, b) => imageScore(a) > imageScore(b) ? a : b);
        return next([[field, biggest, 'src', 0.6]]);
    }, 1500);
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
    for(let prop of Array.from(props)) {
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

let enabledSuggesters = {
    'title': suggestTitleAnnotation,
    'image': suggestImageAnnotation,
    'microdata': suggestMicrodataAnnotations,
};

/**
 * Returns [[field, node, attr, suggestorName]]
 * Calls all the enabled suggesters and returns only the most probable
 * suggestion for each field.
 */
export function suggestAnnotations(document, fieldNames, callback) {
    let suggestionsByField = {};
    let suggesterNames = Object.keys(enabledSuggesters);
    let pendingSuggesters = suggesterNames.length;

    let processSuggestions = (name, suggestions) => {
        for(let suggestion of suggestions) {
            if(!(suggestion[0] in suggestionsByField) || suggestion[3] > suggestionsByField[suggestion[0]][4]){
                suggestion.splice(3, 0, name);
                suggestionsByField[suggestion[0]] = suggestion;
            }
        }
        pendingSuggesters--;
        if(pendingSuggesters === 0) {
            callback(Object.values(suggestionsByField).map(
                suggestion => suggestion.slice(0, 4)
            ));
        }
    };

    for(let name of suggesterNames) {
        let suggester = enabledSuggesters[name];
        try {
            suggester(document, fieldNames, processSuggestions.bind(null, name));
        } catch(e) {
            console.error(e);
            processSuggestions(name, []);
        }
    }
}

export function registerSuggester(name, suggester) {
    enabledSuggesters[name] = suggester;
}


/**
 * Suggest the href attributes of links for fields names <something>_url.
 *
 * For example
 *
 * next_url => suggest <a href="[annotation]">Next →</a>
 * comments_href => suggest <a href="[annotation]">Show comments</a>
 */
registerSuggester('links', function linkSuggestor(document, fieldNames, next) {
    let res = [], name;
    let url_word = '(?:url|href|link)';
    let regexp = new RegExp(`${url_word}$|^${url_word}`, 'i');

    let links = Array.from(document.querySelectorAll('a[href]'))
                     .map(node => [node, node.textContent]);

    for(let field of fieldNames) {
        if((name = field.replace(regexp, '')).length !== field.length) {
            name = name.replace(/^[-_]+/, '').replace(/[-_]+$/, '').replace(/[-_]+/g, '\\b.{0,10}\\b');
            let nameRegexp = new RegExp(`^.{0,10}\\b${name}\\b.{0,10}$`, 'i');
            let best = null;
            for(let [node, cnt] of links) {
                if(nameRegexp.test(cnt) && (!best || best[1].length > cnt.length)) {
                    best = [node, cnt];
                }
            }
            if(best) {
                res.push([field, best[0], 'href', 0.2]);
            }
        }
    }

    next(res);
});




export function findReleatedTableCell(td) {
    // Check for a vertical header
    if(
      !td.previousElementSibling &&
      td.nextElementSibling &&
      td.nextElementSibling.tagName === 'TD' &&
      !(td.nextElementSibling.nextElementSibling && td.nextElementSibling.nextElementSibling.tagName === 'TD') &&
      td.parentNode.parentNode.tagName !== 'THEAD') {
        return td.nextElementSibling;
    }
    // If not vertical, check for horizontal header, first find next row
    var nextRow = xpath_one('following::tr[1]', td);

    // Ensure they are in the same table
    if(nextRow && xpath_one('ancestor::table[1]', td) !== xpath_one('ancestor::table[1]', nextRow)) {
        return null;
    }

    // Find the same column in the next now
    let column = 0, n = td;
    while(n.previousElementSibling) {
        n = n.previousElementSibling;
        if(n.tagName === 'TD' || n.tagName === 'TH') {
            column += parseInt(n.getAttribute('colspan') || 1, 10);
        }
    }
    n = nextRow.firstElementChild;
    while(n && column > 0) {
        if(n.tagName === 'TD' || n.tagName === 'TH') {
            column -= parseInt(n.getAttribute('colspan') || 1, 10);
        }
        n = n.nextElementSibling;
    }
    if(n && n.tagName === 'TD') {
        return n;
    }
    return null;
}

/**
 * If a table header cell contains the field name, suggest the releated body cell
 */
registerSuggester('table', function tableSuggestor(document, fieldNames, next) {
    let ths = Array.from(document.querySelectorAll(`
        tr:first-child > td,
        tr:first-child > th,
        tr > td:first-child,
        tr > th:first-child
    `)).map((node) => [node, node.textContent]);

    let res = [];
    for(let field of fieldNames) {
        field = field.replace(/[-_]/g, '\\b.{0,10}\\b');
        let nameRegexp = new RegExp(`\\b${field}\\b`, 'i');
        let best = null;
        for(let [node, cnt] of ths) {
            if(nameRegexp.test(cnt) && (!best || best[1].length > cnt.length)) {
                let releated = findReleatedTableCell(node);
                if(releated) {
                    best = [releated, cnt];
                }
            }
        }
        if(best) {
            res.push([field, best[0], text, 0.2]);
        }
    }
    next(res);
});

/**
 * If an element ID or class matches exactly the field name, suggest it
 */
registerSuggester('id_class', function idClassSuggestor(document, fieldNames, next) {
    let res = [];
    for(let field of fieldNames) {
        let node = document.getElementById(field) || document.querySelector('.' + field);
        if(node) {
            res.push([field, node, node.tagName === 'IMG' ? 'src' : text,  node.id === field ? 0.25 : 0.15]);
        }
    }
    next(res);
});

/**
 * If a <dt> tag contains the field name, suggest the associated <dd>
 */
registerSuggester('dt_dd', function definitionSuggestor(document, fieldNames, next) {
    let res = [];
    let dts = Array.from(document.querySelectorAll('dt'))
                     .map((node) => [node, node.textContent]);

    for(let field of fieldNames) {
        field = field.replace(/[-_]+/g, '\\b.{0,10}\\b');
        let nameRegexp = new RegExp(`\\b${field}\\b`, 'i');
        let best = null;
        for(let [node, cnt] of dts) {
            if(nameRegexp.test(cnt) && (!best || best[1].length > cnt.length)) {
                let dd_node = xpath_one('following-sibling::dd', node);
                if(dd_node) {
                    best = [dd_node, cnt];
                }
            }
        }
        if(best) {
            res.push([field, best[0], text, 0.2]);
        }
    }

    next(res);
});


function getCurrencyRegExp() {
    /*
    Currency simbols found in: http://www.xe.com/symbols.php

    Extracted with:

    Array.from(document.querySelectorAll('.cSmbl_Fnt_AU'))
        .map(x => x.textContent)
        .filter(x => x && !/[\u00A2-\u00A5\u20A0-\u20CF]/.test(x));
    */
    var currency_symbol = "(:?[\u00A2-\u00A5\u20A0-\u20CF؋$ƒP៛QL﷼SR฿€]"; // Unicode currency pane and one letter currency symbols
    currency_symbol += '|[A-Z]{3}'; // Currency code
    currency_symbol += '|(BZ|R|RD|J|C|NT|TT|Z)\\$|\\$[bU]'; // Different kinds of dollars
    currency_symbol += '|Lek|ман|p\\.|KM|лв|kn|Kč|kr|Ft|Rp|Ls|Lt|ден|RM|MT|B/\\.|Gs|S/\\.|zł|lei|руб|Дин\\.|Bs)'; // Rest of currencies

    var numbers = '[0-9\\., ]+';

    return new RegExp(
        '^(' + currency_symbol + numbers + '|' +numbers + currency_symbol + ')$'
    );
}

function getDateRegExp(){
    // Bad approximation, it will works for most numeric or english dates
    return new RegExp([
        'NN/NN/NNNN',
        'NNNN/NN/NN',
        'NN? of \\w+ of NNNN',
    ].join('|').replace(/N/g, '\\d').replace(/\//g, '[/\\. -]'));

}

/**
 * If the pattern: <field_name>: <inline_text> is found, suggest it
 * If text matching a price is found and there is a field called price, suggest it
 * If text matching a date is found and there is a field called date, suggest it
 * If text matching a percentage is found and there is a field called percent, suggest it
 */
registerSuggester('text_content', function textSuggestor(document, fieldNames, next) {
    let res = [];

    function score(a) {  // Returns number 0-0.0001 representing how emphasized is the node, typographically
        var style = document.defaultView && document.defaultView.getComputedStyle(a.parentNode);
        if(!style) {
            return 0;
        }

        let res = (
            parseInt(style.fontSize, 10) +
            parseInt(style.fontWeight, 10)/1000 +
            (style.textDecorationLine === 'line-through' ? -5 : 0) +
            (style.textDecorationLine === 'underline' ? +1 : 0)
        );

        return Math.min(res/50, 0.0001);
    }

    let texts = xpath('.//text()[normalize-space()]', document.body);

    let priceField = findField(['price'], fieldNames);
    let dateField = findField(['date', 'created', 'updated'], fieldNames);
    let percentField = findField(['percent', 'discount'], fieldNames);
    let priceRegexp = getCurrencyRegExp();
    let dateRegexp = getDateRegExp();
    let percentRegExp = /^\d+([\.,]\d+)?%$/;

    for(let field of fieldNames) {
        field = field.replace(/[-_]/g, '\\b.{0,7}\\b');

        let nameColonRegExp = new RegExp(`^.{0,7}\\b${field}\\b.{0,7}:\\s*\\S`, 'i');
        let nameEndRegExp = new RegExp(`^.{0,7}\\b${field}\\b.{0,7}:\\s*$`, 'i');
        let specialRegExp = null;

        if(field === priceField) {
            specialRegExp = priceRegexp;
        } else if (field === dateField) {
            specialRegExp = dateRegexp;
        } else if (field === percentField) {
            specialRegExp = percentRegExp;
        }

        for(var node of texts) {
            if(specialRegExp && specialRegExp.test(node.nodeValue)) {
                res.push([field, node.parentNode, text, 0.12 + score(node.parentNode)]);
            }

            if(nameEndRegExp.test(node.nodeValue)){
                var nextText = xpath_one('following::text()[normalize-space()]', node);
                if(nextText) {
                    res.push([field, nextText.parentNode, text, 0.1 + score(nextText.parentNode)]);
                }
            } else if (nameColonRegExp.test(node.nodeValue)) {
                res.push([field, node.parentNode, text, 0.1 + score(node.parentNode)]);
            }
        }
    }
    next(res);
});

