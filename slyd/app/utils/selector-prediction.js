/*
 The MIT License

 Copyright (c) 2012 Andrew Cantino
 Copyright (c) 2009 Andrew Cantino & Kyle Maxwell

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

// Generates a selector, if possible, that will follow a set of rules.
// A rule is a function that takes a selector (string) and returns true if the
// selector passes the rule. The second argument is a function that will return
// the elements that match the selector.

/*global diff_match_patch:false */
/*jshint newcap: false */

// Rule accepts any selector
function acceptAny() {
    return true;
}

function seeds(fn, s){
    fn.seeds = s;
    return fn;
}

// Selector matches exactly this set of elements and no other
export function matchesExactly($elements) {
    return seeds(function(selector, runSelector) {
        var matches = runSelector();
        return matches.length === $elements.length && matches.not($elements).length === 0;
    }, $elements);
}

// Selector matches all elements in the set
export function matchesAll($elements) {
    return seeds(function(selector) {
        return $elements.not(selector).length === 0;
    }, $elements);
}

// Selector matches none of the elements in the set
export function matchesNone($elements) {
    return function(selector) {
        return !($elements.is(selector));
    };
}

// Selector matches only descendants of element
export function descendantsOf(element) {
    return function(selector, runSelector) {
        return Array.prototype.all.call(runSelector, (match) => {
            let current = match;
            while(current && current !== element) {
                current = current.parentNode;
            }
            return !!current;
        });
    };
}

// Doesn't select any element outside their common ancestor
export function descendantsOfCommonAncestor($elements) {
    return descendantsOf(commonAncestor($elements));
}

export function descendantsOfMostProlificAntecestor(element) {
    return descendantsOf(mostProlificAntecestor(element));
}

// Helper heuristics
export function singleTagNameHeuristics($accepted, $rejected) {
    if ($rejected.length === 0 && $accepted.length > 0 && $accepted.filter(function(i, e) {
        return e.tagName !== $accepted[0].tagName;
    }).length === 0) {
        if ($accepted.length > 1) {
            return descendantsOfCommonAncestor($accepted);
        } else {
            return descendantsOfMostProlificAntecestor($accepted);
        }
    }
    return acceptAny; // Can't apply heuristics
}

// Similar to the old predictCss(s, r)
export function acceptRejectRule($accepted, $rejected) {
    return all([
        matchesAll($accepted),
        matchesNone($rejected),
        singleTagNameHeuristics($accepted, $rejected)
    ]);
}

function allSeeds(rules) {
    var all = $();
    for(var rule of rules) {
        if(rule.seeds) {
            all.add(rule.seeds);
        }
    }
    return all;
}

// Second order rule: Selector must match all of the rules
export function all(rules){
    return seeds(function(selector, runSelector){
        for(var rule of rules) {
            if(!rule(selector, runSelector)) {
                return false;
            }
        }
        return true;
    }, allSeeds(rules));
}

// Second order rule: Selector must match at least one of the rules
export function any(rules){
    return seeds(function(selector, runSelector){
        for(var rule of rules) {
            if(rule(selector, runSelector)) {
                return true;
            }
        }
        return false;
    }, allSeeds(rules));
}

function commonAncestor($elements) {
    var first = $elements[0], doc = first.ownerDocument, body = doc.body;
    var candidates = $elements.eq(0).parents().not(doc).not(body);
    for(var i = candidates.length - 1; i >= 0; --i) {
        for(var j = 1; j < $elements.length; j++) {
            if (!$.contains(candidates[i], $elements[j])) {
                return candidates[i + 1] || null;
            }
        }
    }
    return candidates[0];
}

function mostProlificAntecestor(element) {
    var ancestors = element.parentsUntil(element[0].ownerDocument.documentElement);
    var candidate = ancestors[ancestors.length - 1];
    for (var i = ancestors.length - 2; i >= 0; i--) {
        if (candidate.childElementCount <= ancestors[i].childElementCount) {
            candidate = ancestors[i];
        }
    }
    return candidate;
}

function recursiveNodes(e) {
    var res = [];
    while(e && e.parentElement) {
        res.unshift(e);
        e = e.parentElement;
    }
    return res;
}

function escapeCssNames(name) {
    if (name) {
        try {
            return name.replace(/\bselectorgadget_\w+\b/g, '').replace(/\\/g, '\\\\').replace(/[\#\;\&\,\.\+\*\~\'\:\"\!\^\$\[\]\(\)\=\>\|\/]/g, function(e) {
                return '\\' + e;
            }).replace(/\s+/, '');
        } catch (e) {
            if (window.console) {
                console.log('---');
                console.log("exception in escapeCssNames");
                console.log(name);
                console.log('---');
            }
            return '';
        }
    } else {
        return '';
    }
}

function childElemNumber(elem) {
    var count;
    count = 0;
    while (elem.previousSibling && (elem = elem.previousSibling)) {
        if (elem.nodeType === 1) {
            count++;
        }
    }
    return count;
}

function siblingsWithoutTextNodes(e) {
    var filtered_nodes, k, len, node, nodes;
    nodes = e.parentNode.childNodes;
    filtered_nodes = [];
    for (k = 0, len = nodes.length; k < len; k++) {
        node = nodes[k];
        if (node.nodeName.substring(0, 1) === "#") {
            continue;
        }
        if (node === e) {
            break;
        }
        filtered_nodes.push(node);
    }
    return filtered_nodes;
}

function pathOf(elem) {
    if(elem.parentNode === elem.ownerDocument) {
        return ':root';
    }
    var e, j, k, len, path, ref, siblings;
    path = "";
    ref = recursiveNodes(elem);
    for (k = 0, len = ref.length; k < len; k++) {
        e = ref[k];
        if (e) {
            siblings = siblingsWithoutTextNodes(e);
            if (e.nodeName.toLowerCase() !== "body") {
                j = siblings.length - 2 < 0 ? 0 : siblings.length - 2;
                while (j < siblings.length) {
                    if (siblings[j] === e) {
                        break;
                    }
                    if (!siblings[j].nodeName.match(/^(script|#.*?)$/i)) {
                        path += cssDescriptor(siblings[j]) + (j + 1 === siblings.length ? "+ " : "~ ");
                    }
                    j++;
                }
            }
            path += cssDescriptor(e) + " > ";
        }
    }
    return cleanCss(path);
}

function cssDescriptor(node) {
    var cssName, escaped, k, len, path, ref;
    path = node.nodeName.toLowerCase();
    escaped = node.id && escapeCssNames(node.id);
    if (escaped && escaped.length > 0) {
        path += '#' + escaped;
    }
    if (node.className) {
        ref = node.className.split(" ");
        for (k = 0, len = ref.length; k < len; k++) {
            cssName = ref[k];
            escaped = escapeCssNames(cssName);
            if (cssName && escaped.length > 0) {
                path += '.' + escaped;
            }
        }
    }
    if (node.nodeName.toLowerCase() !== "body") {
        path += ':nth-child(' + (childElemNumber(node) + 1) + ')';
    }
    return path;
}

function cssDiff(array) {
    var collective_common, cssElem, diff, dmp, e, encoded_css_array, existing_tokens, k, l, len, len1, part;
    try {
        dmp = new diff_match_patch();
    } catch (_error) {
        e = _error;
        throw "Please include the diff_match_patch library.";
    }
    if (typeof array === 'undefined' || array.length === 0) {
        return '';
    }
    existing_tokens = {};
    encoded_css_array = encodeCssForDiff(array, existing_tokens);
    collective_common = encoded_css_array.pop();
    for (k = 0, len = encoded_css_array.length; k < len; k++) {
        cssElem = encoded_css_array[k];
        diff = dmp.diff_main(collective_common, cssElem);
        collective_common = '';
        for (l = 0, len1 = diff.length; l < len1; l++) {
            part = diff[l];
            if (part[0] === 0) {
                collective_common += part[1];
            }
        }
    }
    return decodeCss(collective_common, existing_tokens);
}

function tokenizeCss(css_string) {
    var char, k, len, ref, skip, tokens, word;
    skip = false;
    word = '';
    tokens = [];
    ref = cleanCss(css_string);
    for (k = 0, len = ref.length; k < len; k++) {
        char = ref[k];
        if (skip) {
            skip = false;
        } else if (char === '\\') {
            skip = true;
        } else if (char === '.' || char === ' ' || char === '#' || char === '>' || char === ':' || char === ',' || char === '+' || char === '~') {
            if (word.length > 0) {
                tokens.push(word);
            }
            word = '';
        }
        word += char;
        if (char === ' ' || char === ',') {
            tokens.push(word);
            word = '';
        }
    }
    if (word.length > 0) {
        tokens.push(word);
    }
    return tokens;
}

function tokenizeCssForDiff(css_string) {
    var block, combined_tokens, k, len, ref, token;
    combined_tokens = [];
    block = [];
    ref = tokenizeCss(css_string);
    for (k = 0, len = ref.length; k < len; k++) {
        token = ref[k];
        block.push(token);
        if (token === ' ' && block.length > 0) {
            combined_tokens = combined_tokens.concat(block);
            block = [];
        } else if (token === '+' || token === '~') {
            block = [block.join('')];
        }
    }
    if (block.length > 0) {
        return combined_tokens.concat(block);
    } else {
        return combined_tokens;
    }
}

function decodeCss(string, existing_tokens) {
    var character, inverted, k, len, out, ref;
    inverted = invertObject(existing_tokens);
    out = '';
    ref = string.split('');
    for (k = 0, len = ref.length; k < len; k++) {
        character = ref[k];
        out += inverted[character];
    }
    return cleanCss(out);
}

function encodeCssForDiff(strings, existing_tokens) {
    var codepoint, k, l, len, len1, out, ref, string, strings_out, token;
    codepoint = 50;
    strings_out = [];
    for (k = 0, len = strings.length; k < len; k++) {
        string = strings[k];
        out = "";
        ref = tokenizeCssForDiff(string);
        for (l = 0, len1 = ref.length; l < len1; l++) {
            token = ref[l];
            if (!existing_tokens[token]) {
                existing_tokens[token] = String.fromCharCode(codepoint++);
            }
            out += existing_tokens[token];
        }
        strings_out.push(out);
    }
    return strings_out;
}

function tokenPriorities(tokens) {
    var epsilon, first, i, k, len, priorities, second, token;
    epsilon = 0.001;
    priorities = [];
    i = 0;
    for (k = 0, len = tokens.length; k < len; k++) {
        token = tokens[k];
        first = token.substring(0, 1);
        second = token.substring(1, 2);
        if (first === ':' && second === 'n') {
            priorities[i] = 0;
        } else if (first === '>') {
            priorities[i] = 2;
        } else if (first === '+' || first === '~') {
            priorities[i] = 3;
        } else if (first !== ':' && first !== '.' && first !== '#' && first !== ' ' && first !== '>' && first !== '+' && first !== '~') {
            priorities[i] = 4;
        } else if (first === '.') {
            priorities[i] = 5;
        } else if (first === '#') {
            priorities[i] = 6;
            if (token.match(/\d{3,}/)) {
                priorities[i] = 2.5;
            }
        } else {
            priorities[i] = 0;
        }
        priorities[i] += i * epsilon;
        i++;
    }
    return priorities;
}

function orderFromPriorities(priorities) {
    var i, k, l, ordering, ref, ref1, tmp;
    tmp = [];
    ordering = [];
    for (i = k = 0, ref = priorities.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        tmp[i] = {
            value: priorities[i],
            original: i
        };
    }
    tmp.sort(function(a, b) {
        return a.value - b.value;
    });
    for (i = l = 0, ref1 = priorities.length; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        ordering[i] = tmp[i].original;
    }
    return ordering;
}

function simplifyCss(css, rule) {
    var best_so_far, first, got_shorter, i, k, look_back_index, ordering, part, parts, priorities, ref, second, selector;
    parts = tokenizeCss(css);
    priorities = tokenPriorities(parts);
    ordering = orderFromPriorities(priorities);
    selector = cleanCss(css);
    look_back_index = -1;
    best_so_far = "";
    if (selectorGets(selector, rule)) {
        best_so_far = selector;
    }
    var checkSelector = function(selector) {
        if (selector.length < best_so_far.length && selectorGets(selector, rule)) {
            best_so_far = selector;
            got_shorter = true;
            return true;
        } else {
            return false;
        }
    };
    got_shorter = true;
    while (got_shorter) {
        got_shorter = false;
        for (i = k = 0, ref = parts.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
            part = ordering[i];
            if (parts[part].length === 0) {
                continue;
            }
            first = parts[part].substring(0, 1);
            second = parts[part].substring(1, 2);
            if (first === ' ') {
                continue;
            }
            if (wouldLeaveFreeFloatingNthChild(parts, part)) {
                continue;
            }
            _removeElements(part, parts, first, checkSelector);
        }
    }
    return cleanCss(best_so_far);
}

// Remove some elements depending on whether this is a sibling selector or not, and put them back if the block returns false.
function _removeElements(part, parts, firstChar, callback) {
    var j, k, l, look_back_index, ref, ref1, ref2, ref3, selector, tmp;
    if (firstChar === '+' || firstChar === '~') {
        look_back_index = positionOfSpaceBeforeIndexOrLineStart(part, parts);
    } else {
        look_back_index = part;
    }
    tmp = parts.slice(look_back_index, part + 1); // Save a copy of these parts.
    for (j = k = ref = look_back_index, ref1 = part; ref <= ref1 ? k <= ref1 : k >= ref1; j = ref <= ref1 ? ++k : --k) {
        parts[j] = '';
    }
    selector = cleanCss(parts.join(''));
    if (selector === '' || !callback(selector)) {
        for (j = l = ref2 = look_back_index, ref3 = part; ref2 <= ref3 ? l <= ref3 : l >= ref3; j = ref2 <= ref3 ? ++l : --l) {
            parts[j] = tmp[j - look_back_index];  // Put it back.
        }
    }
    return parts;
}

function positionOfSpaceBeforeIndexOrLineStart(part, parts) {
    var i;
    i = part;
    while (i >= 0 && parts[i] !== ' ') {
        i--;
    }
    if (i < 0) {
        i = 0;
    }
    return i;
}

// Has to handle parts with zero length.
function wouldLeaveFreeFloatingNthChild(parts, part) {
    var i, nth_child_is_on_right, space_is_on_left;
    space_is_on_left = nth_child_is_on_right = false;
    i = part + 1;
    while (i < parts.length && parts[i].length === 0) {
        i++;
    }
    if (i < parts.length && parts[i].substring(0, 2) === ':n') {
        nth_child_is_on_right = true;
    }
    i = part - 1;
    while (i > -1 && parts[i].length === 0) {
        i--;
    }
    if (i < 0 || parts[i] === ' ') {
        space_is_on_left = true;
    }
    return space_is_on_left && nth_child_is_on_right;
}

// Not intended for user CSS, does destructive sibling removal.  Expects strings to be escaped.
function cleanCss(css) {
    var cleaned_css, last_cleaned_css;
    cleaned_css = css;
    last_cleaned_css = null;
    while (last_cleaned_css !== cleaned_css) {
        last_cleaned_css = cleaned_css;
        cleaned_css = cleaned_css.replace(/(^|\s+)(\+|\~)/, '').replace(/(\+|\~)\s*$/, '').replace(/>/g, ' > ').replace(/\s*(>\s*)+/g, ' > ').replace(/,/g, ' , ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').replace(/\s*,$/g, '').replace(/^\s*,\s*/g, '').replace(/\s*>$/g, '').replace(/^>\s*/g, '').replace(/[\+\~\>]\s*,/g, ',').replace(/[\+\~]\s*>/g, '>').replace(/\s*(,\s*)+/g, ' , ');
    }
    return cleaned_css;
}

// Takes wrapped
function getPathsFor(nodeset) {
    var k, len, node, out;
    out = [];
    for (k = 0, len = nodeset.length; k < len; k++) {
        node = nodeset[k];
        if (node && node.nodeType === Node.ELEMENT_NODE) {
            out.push(pathOf(node));
        }
    }
    return out;
}

export function predictCss(rule) {
    var seeds = rule.seeds || $();
    if (seeds.length === 0) {
        console.error('Invalid rule');
        return '';
    }
    rule.doc = seeds[0].ownerDocument;
    var selected_paths = getPathsFor(seeds);
    var css = cssDiff(selected_paths);
    var simplest = simplifyCss(css, rule);
    if (simplest.length > 0) {
        return simplest;
    }
    var union = '';
    seeds.each((i, seed) => {
        union = pathOf(seed) + ", " + union;
    });
    union = cleanCss(union);
    return simplifyCss(union, rule);
}

function selectorGets(selector, rule) {
    var cachedMatches = null;
    function runSelector() {
        return cachedMatches || (cachedMatches = $(selector, rule.doc));
    }
    try {
        return rule(selector, runSelector);
    } catch (e) {
        if (window.console) {
            console.log("Error on selector: " + selector);
        }
        throw e;
    }
}

function invertObject(object) {
    var key, new_object, value;
    new_object = {};
    for (key in object) {
        value = object[key];
        new_object[value] = key;
    }
    return new_object;
}

export function cssToXPath(css_string) {
    var css_block, k, len, out, token, tokens;
    tokens = tokenizeCss(css_string);
    if (tokens[0] && tokens[0] === ' ') {
        tokens.splice(0, 1);
    }
    if (tokens[tokens.length - 1] && tokens[tokens.length - 1] === ' ') {
        tokens.splice(tokens.length - 1, 1);
    }
    css_block = [];
    out = "";
    for (k = 0, len = tokens.length; k < len; k++) {
        token = tokens[k];
        if (token === ' ') {
            out += cssToXPathBlockHelper(css_block);
            css_block = [];
        } else {
            css_block.push(token);
        }
    }
    return out + cssToXPathBlockHelper(css_block);
}

function cssToXPathBlockHelper(css_block) {
    var current, expressions, first, i, k, l, len, out, re, ref, rest;
    if (css_block.length === 0) {
        return '//';
    }
    out = '//';
    first = css_block[0].substring(0, 1);
    if (first === ',') {
        return " | ";
    }
    if (first === ':' || first === '#' || first === '.') {
        out += '*';
    }
    expressions = [];
    re = null;
    for (k = 0, len = css_block.length; k < len; k++) {
        current = css_block[k];
        first = current.substring(0, 1);
        rest = current.substring(1);
        if (first === ':') {
            re = rest.match(/^nth-child\((\d+)\)$/);
            if (re) {
                expressions.push('(((count(preceding-sibling::*) + 1) = ' + re[1] + ') and parent::*)');
            }
        } else if (first === '.') {
            expressions.push('contains(concat( " ", @class, " " ), concat( " ", "' + rest + '", " " ))');
        } else if (first === '#') {
            expressions.push('(@id = "' + rest + '")');
        } else if (first === ',') {

        } else {
            out += current;
        }
    }
    if (expressions.length > 0) {
        out += '[';
    }
    for (i = l = 0, ref = expressions.length; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
        out += expressions[i];
        if (i < expressions.length - 1) {
            out += ' and ';
        }
    }
    if (expressions.length > 0) {
        out += ']';
    }
    return out;
}

