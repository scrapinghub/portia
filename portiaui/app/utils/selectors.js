import Ember from 'ember';

// findCssSelector and positionInNodeList functions from:
// http://lxr.mozilla.org/mozilla-release/source/toolkit/devtools/styleinspector/css-logic.js
/**
 * Find the position of [element] in [nodeList].
 * @returns an index of the match, or -1 if there is no match
 */
var positionInNodeList = function(element, nodeList) {
  for (var i = 0; i < nodeList.length; i++) {
    if (element === nodeList[i]) {
      return i;
    }
  }
  return -1;
};

/**
 * Find a unique CSS selector for a given element
 * @returns a string such that ele.ownerDocument.querySelector(reply) === ele
 * and ele.ownerDocument.querySelectorAll(reply).length === 1
 */
export function findCssSelector(ele, depth = 0) {
  var document = ele.ownerDocument;
  if (!document || !document.contains(ele)) {
    throw new Error('findCssSelector received element not inside document');
  }

  // document.querySelectorAll("#id") returns multiple if elements share an ID
  if (ele.id && document.querySelectorAll('#' + CSS.escape(ele.id)).length === 1 && depth > 1) {
    return '#' + CSS.escape(ele.id);
  }

  // Inherently unique by tag name
  var tagName = ele.localName;
  if (tagName === 'html') {
    return 'html';
  }
  if (tagName === 'head') {
    return 'head';
  }
  if (tagName === 'body') {
    return 'body';
  }

  // We might be able to find a unique class name
  var selector, index, matches;
  if (ele.classList.length > 0) {
    for (var i = 0; i < ele.classList.length; i++) {
      // Is this className unique by itself?
      selector = '.' + CSS.escape(ele.classList.item(i));
      matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
      // Maybe it's unique with a tag name?
      selector = tagName + selector;
      matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
      // Maybe it's unique using a tag name and nth-child
      index = positionInNodeList(ele, ele.parentNode.children) + 1;
      selector = selector + ':nth-child(' + index + ')';
      matches = document.querySelectorAll(selector);
      if (matches.length === 1) {
        return selector;
      }
    }
  }

  // Not unique enough yet.  As long as it's not a child of the document,
  // continue recursing up until it is unique enough.
  if (ele.parentNode !== document) {
     index = positionInNodeList(ele, ele.parentNode.children) + 1;
     if (tagName === 'thead' || tagName === 'tbody') {
         selector = findCssSelector(ele.parentNode, depth + 1);
     } else {
         selector = findCssSelector(ele.parentNode, depth + 1) + ' > ' +
                 tagName + ':nth-child(' + index + ')';
     }
  }
  return selector;
}

function combineIndices(accept, reject) {
    if (!reject.length && (!accept.length || accept.length > 1)) {
        return null;
    }
    return accept;
}

export class ElementPath {
    constructor(element) {
        if (!element) {
            this.paths = [];
            return;
        }

        if (Array.isArray(element)) {
            this.paths = [element];
            return;
        }

        if (typeof element === 'string') {
            this.paths = [element.split(/\s*>\s*/).map(part => {
                const tagAndClasses = part.split(':')[0].split('.');
                let tagName, classes, id;
                if (part[0] === '.' || part[0] === '#') {
                    tagName = null;
                    if (part[0] === '#') {
                        id = tagAndClasses[0];
                    }
                } else {
                    [tagName, id] = tagAndClasses[0].split('#');
                }
                classes = tagAndClasses.slice(1);
                classes.sort();
                const match = part.match(/:nth\-child\((\d+)\)/);

                return {
                    tagName,
                    classes,
                    id,
                    acceptedIndices: match ? [match[1]] : [],
                    rejectedIndices: []
                };
            })];
            return;
        }

        // else DOM element
        const elements = [element].concat(Ember.$(element).parents().not('html').toArray());
        this.paths = [elements.reverse().map((element, index) => {
            const tagName = element.tagName.toLowerCase();
            let classes = [];
            const acceptedIndices = [];
            const rejectedIndices = [];
            if (index > 0) {
                classes = Array.from(new Set(element.className.trim().split(/\s+/g)));
                if (classes.length === 1 && classes[0] === '') {
                    classes.pop();
                } else {
                    classes.sort();
                }
                acceptedIndices.push(
                    Array.prototype.indexOf.call(element.parentNode.children, element) + 1);
            }
            return {
                tagName,
                classes,
                acceptedIndices,
                rejectedIndices
            };
        })];
    }

    static fromAcceptedAndRejected(acceptedSelectors, rejectedSelectors) {
        if (acceptedSelectors) {
            const result = new ElementPath(acceptedSelectors[0]);
            for (let accepted of acceptedSelectors.slice(1)) {
                result.add(new ElementPath(accepted));
            }
            if (rejectedSelectors) {
                for (let rejected of rejectedSelectors.slice(1)) {
                    result.remove(new ElementPath(rejected));
                }
            }
            return result;
        }
        return new ElementPath();
    }

    static mergeMany(elementPaths) {
        // TODO: merge these objects
    }

    get pathSelector() {
        return this.paths.map(path =>
            path.map(element => element.tagName).join(' > ')).join(', ');
    }

    get pathAndClassSelector() {
        return this.paths.map(path => path.map(element => {
            let part = element.tagName;
            if (element.classes) {
                part = [part].concat(element.classes).join('.');
            }
            return part;
        }).join(' > ')).join(', ');
    }

    get uniquePathSelector() {
        return this.paths.map(path => {
            let selectors = [];
            for (let [index, element] of path.entries()) {
                const indices = combineIndices(element.acceptedIndices, element.rejectedIndices);
                let part = element.tagName;
                if (element.classes) {
                    part = [part].concat(element.classes).join('.');
                }
                let parts;
                if (index === 0 || !indices) {
                    parts = [part];
                } else {
                    parts = indices.map(index => `${part}:nth-child(${index})`);
                }
                if (!selectors.length) {
                    selectors = parts;
                } else {
                    const prefixes = selectors;
                    selectors = [];
                    for (let part of parts) {
                        for (let prefix of prefixes) {
                            selectors.push(`${prefix} > ${part}`);
                        }
                    }
                }
            }
            return selectors.join(', ');
        }).join(', ');
    }

    get pathMap() {
        return new Map(this.paths.map(path => {
            return [new ElementPath(path).pathSelector, path];
        }));
    }

    get pathAndClassMap() {
        return new Map(this.paths.map(path => {
            return [new ElementPath(path).pathAndClassSelector, path];
        }));
    }

    differences(other) {
        let count = 0;
        //const pathMap = this.pathMap;
        const pathMap = this.pathAndClassMap;

        for (let otherElements of other.paths) {
            //const elements = pathMap.get(new ElementPath(otherElements).pathSelector);
            const elements = pathMap.get(new ElementPath(otherElements).pathAndClassSelector);
            if (!elements) {
                count += otherElements.length;
                continue;
            }

            for (let [index, element] of elements.entries()) {
                const otherElement = otherElements[index];
                if (element.tagName !== otherElement.tagName) {
                    count += 1;
                    continue;
                }
                if (Ember.compare(element.classes, otherElement.classes) !== 0) {
                    count += 1;
                    continue;
                }
                if (Ember.compare(element.acceptedIndices, otherElement.acceptedIndices) !== 0) {
                    count += 1;
                    continue;
                }
                if (Ember.compare(element.rejectedIndices, otherElement.rejectedIndices) !== 0) {
                    count += 1;
                }
            }
        }

        return count;
    }

    add(other) {
        const pathMap = this.pathAndClassMap;

        for (let otherElements of other.paths) {
            const elements = pathMap.get(new ElementPath(otherElements).pathAndClassSelector);
            if (!elements) {
                this.paths.push(otherElements);
                continue;
            }

            for (let [index, element] of elements.entries()) {
                const otherElement = otherElements[index];
                if (element.tagName !== otherElement.tagName) {
                    element.tagName = '*';
                }
                const missingClasses = element.classes.slice();
                missingClasses.removeObjects(otherElement.classes);
                element.classes.removeObjects(missingClasses);
                element.classes.sort();
                element.acceptedIndices.addObjects(otherElement.acceptedIndices);
                element.acceptedIndices.sort();
                element.rejectedIndices.addObjects(otherElement.rejectedIndices);
                element.rejectedIndices.sort();
            }
        }

        return this;
    }

    remove(other) {
        const pathMap = this.pathAndClassMap;

        for (let otherElements of other.paths) {
            const elements = pathMap.get(new ElementPath(otherElements).pathAndClassSelector);
            if (!elements) {
                continue;
            }

            for (let [index, element] of elements.entries()) {
                const otherElement = otherElements[index];
                if (element.tagName !== otherElement.tagName && element.tagName !== '*') {
                    continue;
                }
                element.classes.removeObjects(otherElement.classes);
                element.classes.sort();
                element.acceptedIndices.removeObjects(otherElement.acceptedIndices);
                element.acceptedIndices.sort();
                if (!combineIndices(element.acceptedIndices, element.rejectedIndices)) {
                    element.rejectedIndices.addObjects(otherElement.acceptedIndices);
                    element.rejectedIndices.sort();
                }
            }
        }

        return this;
    }
}

export function setIntersection(a, b) {
    return new Set([...a].filter(x => b.has(x)));
}

export function setDifference(a, b) {
    return new Set([...a].filter(x => !b.has(x)));
}

export function getParents(element, upto) {
    var parents = [],
        parent = element.parentElement;
    while (parent) {
        parents.push(parent);
        parent = parent.parentElement;
        if (parent === upto) {
            return parents;
        }
    }
    return parents;
}

export function getPreviousSiblings(element, upto) {
    if (!element) {
        return [];
    }
    var siblings = [],
        sibling = element.previousElementSibling;
    while (sibling && sibling !== upto) {
        siblings.push(sibling);
        sibling = sibling.previousElementSibling;
    }
    return siblings;
}

export function closestParentIndex(element, parents) {
    if (parents === undefined) {
        parents = getParents(element);
        parents.unshift(element);
    }
    let elementIndex = parents.indexOf(element);
    if (elementIndex < 0) {
        return 0;
    }
    return parents.length - elementIndex;
}

export function findContainers(extractedElements, upto) {
    let parentArrays = [];
    for (let element of extractedElements) {
        parentArrays.push(getParents(element, upto));
    }
    let parentSets = parentArrays.map((array) => new Set(array)),
        intersection = parentSets[0] || new Set();
    for (let set of parentSets.slice(1, parentSets.length)) {
        intersection = setIntersection(intersection, set);
    }
    return Array.from(intersection);
}

export function findContainer(extractedElements) {
    return findContainers([].concat(...extractedElements))[0];
}

export function findRepeatedContainers(extracted, container) {
    let groupedItems = groupItems(extracted, container);
    if (groupedItems.length === 1) {
        return [[], 0];
    }
    let repeatedParents = groupedItems.map((item) => findContainers(item, container));
    if (repeatedParents.length === 0) {
        return [[], 0];
    }
    let allEqualLength = repeatedParents.isEvery('length', repeatedParents[0].length);
    if (allEqualLength &&
            new Set(repeatedParents.map((item) => item[0])).size === repeatedParents.length) {
        return [repeatedParents[0].length ? repeatedParents.map(list => list[0]) : [], 0];
    } else {
        let shortest = Math.min(...repeatedParents.map(e => e.length));
        repeatedParents = repeatedParents.map(
            (item) => item.slice(item.length - shortest, item.length));
        if (new Set(repeatedParents.map((item) => item[0])).size === repeatedParents.length) {
            return [repeatedParents[0].length ? repeatedParents.map(list => list[0]) : [], 0];
        }
    }
    return parentWithSiblings(groupedItems, container);
}

export function parentWithSiblings(groupedItems, container) {
    // 1. Get bounds
    let itemBounds = getItemBounds(groupedItems, false),
        itemParents = [],
        sharedItemParents = new Set(),
        sharedParents = new Set();
    // 2. Using highest and lowest parents remove any parents shared by other groups
    for (let [highest, lowest] of itemBounds) {
        itemParents.push([getParents(highest, container).reverse(),
                          getParents(lowest, container).reverse()]);
    }
    for (let fields of itemParents) {
        for (let fieldParents of fields) {
            for (let parent of fieldParents) {
                if (sharedItemParents.has(parent)) {
                    sharedParents.add(parent);
                } else {
                    sharedItemParents.add(parent);
                }
            }
        }
    }
    let i = 0;
    for (let [highest, lowest] of itemParents) {
        itemParents[i] = [highest.filter((e) => !sharedParents.has(e)),
                          lowest.filter((e) => !sharedParents.has(e))];
        i += 1;
    }
    // TODO: Check if not siblings
    // 3. For each item find sibling distance between highest and lowest if they
    //    don't have a parent that isn't shared with other items. Use minimum
    let siblings = itemParents.map(
            (bounds) => getPreviousSiblings(bounds[1][0], bounds[0][0]).length + 1),
        siblingDistance = Math.min(...siblings);
    // 5. Use the highest unshared parent of the highest field of the first item
    //    as the repeating container
    return [itemParents.map(lists => lists[0][0]), siblingDistance];
}

function getItemBounds(items, tagNumber=true) {
    let elementMap = {};
    return items.map(function(elements) {
            let tagids = [];
            for (let element of elements) {
                // TODO: Find incrementing id from dom nodes rather than
                //       attribute added by backend
                let tagid = element.getAttribute('data-tagid');
                if (tagid) {
                    tagid = parseInt(tagid);
                    tagids.push(tagid);
                    elementMap[tagid] = element;
                }
            }
            if (tagNumber) {
                return [Math.min(...tagids), Math.max(...tagids)];
            }
            return [elementMap[Math.min(...tagids)],
                    elementMap[Math.max(...tagids)]];
    });
}

export function groupItems(extracted, upto) {
    let groups = {},
        id = 0;
    // Group fields based on their color
    // TODO: Group by schema too
    for (let elements of extracted) {
        groups[id] = elements;
        id += 1;
    }
    // If all groups are the same length page hass a regular structure where
    // all items have the necessary fields and share a common repeating parent
    let groupLengths = new Set(Object.keys(groups).map((key) => groups[key].length));
    if (groupLengths.size === 1) {
        return makeItemsFromGroups(groups);
    }
    let longest = Math.max(...groupLengths),
        longestGroups = {},
        otherGroups = {};
    for (let key in groups) {
        if (groups[key].length === longest) {
            longestGroups[key] = groups[key];
        } else {
            otherGroups[key] = groups[key];
        }
    }
    // Find bounding tagids for each item
    let items = makeItemsFromGroups(longestGroups),
        itemBounds = getItemBounds(items);
    let remainingFields = {};
    let i = 0,
        seenElements = new Set();
    // Place bounded elements into corresponding items and
    // find parents for unbounded fields
    for (let fieldKey in otherGroups) {
        let fieldGroup = otherGroups[fieldKey];
        for (let element of fieldGroup) {
            i = 0;
            for (let [min, max] of itemBounds) {
                let tagid = parseInt(element.getAttribute('data-tagid'));
                if (tagid && tagid > min && tagid < max) {
                    items[i].push(element);
                    seenElements.add(element);
                    break;
                }
                i += 1;
            }
            if (!seenElements.has(element)) {
                if (remainingFields[fieldKey]) {
                    remainingFields[fieldKey].push([element, getParents(element, upto)]);
                } else {
                    remainingFields[fieldKey] = [[element, getParents(element, upto)]];
                }
            }
        }
    }
    // Find parents for each field in an item for all items
    let itemsParents = [];
    for (let item of items) {
        let itemParents = [];
        for (let element of item) {
            itemParents = itemParents.concat(getParents(element, upto));
        }
        let parentCount = [],
            seenParents = [],
            orderedParents = [];
        for (let parent of itemParents) {
            let parentIdx = seenParents.indexOf(parent);
            if (parentIdx > 0) {
                parentCount[parentIdx] += 1;
            } else {
                parentCount.push(1);
                seenParents.push(parent);
            }
        }
        // Order parents by ones with the most descendant fields
        for (i=0; i < seenParents.length; i++) {
            orderedParents.push([parentCount[i], seenParents[i]]);
        }
        itemParents = [];
        for (let parent of orderedParents.sort()) {
            itemParents.push(parent[1]);
        }
        itemsParents.push(new Set(itemParents));
    }
    // Remove parents shared by multiple items
    let uniqueParents = [];
    for (let parents of itemsParents) {
        for (let otherParents of itemsParents) {
            if (otherParents === parents) {
                continue;
            }
            parents = setDifference(parents, otherParents);
        }
        uniqueParents.push(parents);
    }
    i = 0;
    for (let itemParents of uniqueParents) {
        for (let key in remainingFields) {
            for (let [element, elementParents] of remainingFields[key]) {
                for (let parent of elementParents) {
                    if (itemParents.has(parent)) {
                        items[i].push(element);
                        break;
                    }
                }
            }
        }
        i += 1;
    }
    // TODO: Fields that are not in all items and are below the item bounds still
    //       need to be matched -> all tests pass without this, need a breaking test
    return items;
}

export function makeItemsFromGroups(groups) {
    let items = [];
    for (let key of Object.keys(groups)) {
        for (let [i, item] of groups[key].entries()) {
            if (!items[i]) {
                items[i] = [];
            }
            items[i].push(item);
        }
    }
    return items;
}

export default {
    ElementPath,
    findContainer,
    findRepeatedContainers,
    findCssSelector
};
