import Ember from 'ember';


function elementPath(element) {
    const elements = [element].concat(Ember.$(element).parents().not('html').toArray());
    return elements.reverse();
}

export function pathSelectorFromElement(element) {
    const path = elementPath(element);
    return path.map(element => element.tagName.toLowerCase()).join(' > ');
}

export function pathAndClassSelectorFromElement(element) {
    const path = elementPath(element);
    return path.map(element => {
        const tag = element.tagName.toLowerCase();
        const classes = element.className.trim();
        if (tag === 'body' || !classes) {
            return tag;
        }
        return tag + [''].concat(classes.split(/\s+/g)).join('.');
    }).join(' > ');
}

export function uniquePathSelectorFromElement(element) {
    const path = elementPath(element);
    return path.map((element, index) => {
        const tag = element.tagName.toLowerCase();
        if (index === 0) {
            return tag;
        }
        const nodeIndex = Array.prototype.indexOf.call(element.parentNode.children, element) + 1;
        return `${tag}:nth-child(${nodeIndex})`;
    }).join(' > ');
}

class SelectorStructureNode {
    constructor(tag) {
        Object.defineProperties(this, {
            tag: {
                configurable: false,
                enumerable: false,
                writeable: false,
                value: tag
            },
            acceptedIndices: {
                configurable: false,
                enumerable: false,
                writeable: false,
                value: new Set()
            },
            rejectedIndices: {
                configurable: false,
                enumerable: false,
                writeable: false,
                value: new Set()
            }
        });
    }

    accept(selector) {
        this.add(selector, 'acceptedIndices');
    }

    reject(selector) {
        this.add(selector, 'rejectedIndices');
    }

    add(selector, setName) {
        this.addParts((selector + '>').split(/\s*>\s*/), setName);
    }

    addParts(parts, setName) {
        const part = parts.shift();
        const [, tag, number] = part.match(/^([^:]*)(?::nth-child\((\d+)\))?/);
        const child = this[tag] || (this[tag] = new SelectorStructureNode(tag));
        child[setName].add(number);
        if (parts.length) {
            child.addParts(parts, setName);
        }
    }

    generalize() {
        return this.generalizeParts().join(', ');
    }

    generalizeParts() {
        const tags = Object.keys(this);
        const selectors = this.generalizeSelector();

        const wholeSelectors = [];

        for (let tag of tags) {
            if (tag === '') {
                wholeSelectors.push(...selectors);
            } else {
                const childSelectors = this[tag].generalizeParts();
                if (this.tag) {
                    for (let childSelector of childSelectors) {
                        for (let selector of selectors) {
                            wholeSelectors.push(`${selector} > ${childSelector}`);
                        }
                    }
                } else {
                    wholeSelectors.push(...childSelectors);
                }
            }
        }

        return wholeSelectors;
    }

    generalizeSelector() {
        const selectors = [];

        if (this.acceptedIndices.has(/* undefined */)) {
            selectors.push(this.tag);
        } else {
            const rejected = new Set(this.rejectedIndices);
            for (let number of this.acceptedIndices.values()) {
                rejected.delete(number);
            }
            if (rejected.size || this.acceptedIndices.size < 2) {
                for (let number of this.acceptedIndices.values()) {
                    selectors.push(`${this.tag}:nth-child(${number})`);
                }
            } else {
                selectors.push(this.tag);
            }
        }

        return selectors;
    }

    extractParent() {
        const parts = [];
        let node = this;
        let tags;

        while ((tags = Object.keys(node)).length === 1) {
            const tag = tags[0];
            node = node[tag];
            if (node.acceptedIndices.has(/* undefined */)) {
                parts.push(tag);
            } else if (node.acceptedIndices.size === 1) {
                parts.push(`${tag}:nth-child(${node.acceptedIndices.values().next().value})`);
            } else {
                break;
            }
        }

        return parts.join(' > ');
    }
}

export function generalizeSelectors(acceptSelectors, rejectSelectors) {
    const matchStructure = new SelectorStructureNode();

    if (acceptSelectors) {
        for (let selector of acceptSelectors) {
            matchStructure.accept(selector);
        }
    }
    if (rejectSelectors) {
        for (let selector of rejectSelectors) {
            matchStructure.reject(selector);
        }
    }

    return matchStructure.generalize();
}

export function parentSelector(selectors) {
    const matchStructure = new SelectorStructureNode();

    if (selectors) {
        for (let multiSelector of selectors) {
            if (multiSelector) {
                for (let selector of multiSelector.split(/\s*,\s*/)) {
                    matchStructure.accept(selector);
                }
            }
        }
    }

    return matchStructure.extractParent();
}

export function replacePrefix(selector, newPrefix) {
    const prefixParts = newPrefix.split(/\s*>\s*/);
    return selector.split(/\s*,\s*/).map(selector => {
        let parts = selector.split(/\s*>\s*/);
        if (parts.length <= prefixParts.length) {
            parts = prefixParts.slice(0, parts.length);
        } else {
            parts.splice(0, prefixParts.length, ...prefixParts);
        }
        return parts.join(' > ');
    }).join(', ');
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
    let parentArrays = extractedElements.map(
            (element) => getParents(element, upto)),
        parentSets = parentArrays.map((array) => new Set(array)),
        intersection = parentSets[0] || new Set();
    for (let set of parentSets.slice(1, parentSets.length)) {
        intersection = setIntersection(intersection, set);
    }
    return Array.from(intersection);
}

export function findContainer(extractedElements) {
    return findContainers(extractedElements.map((item) => item.context.element))[0];
}


export function findRepeatedContainer(extracted, container) {
    let groupedItems = groupItems(extracted, container);
    let repeatedParents = groupedItems.map((item) => findContainers(item, container));
    let allEqualLength = true;
    for (let parents of repeatedParents) {
        allEqualLength = repeatedParents[0].length === parents.length;
    }
    if (repeatedParents.length === 0) {
        return [null, 0];
    }
    if (allEqualLength &&
            new Set(repeatedParents.map((item) => item[0])).size === repeatedParents.length) {
        return [repeatedParents[0].length ? repeatedParents[0][0] : null, 0];
    } else {
        let shortest = Math.min(...repeatedParents.map(e => e.length));
        repeatedParents = repeatedParents.map(
            (item) => item.slice(item.length - shortest, item.length));
        if (new Set(repeatedParents.map((item) => item[0])).size === repeatedParents.length) {
            return [repeatedParents[0].length ? repeatedParents[0][0] : null, 0];
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
    return [itemParents[0][0][0], siblingDistance];
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
    let groups = {};
    // Group fields based on their color
    // TODO: Group by schema too
    for (let item of extracted) {
        let color = item.context.color;
        if (color in groups) {
            groups[color].push(item.context.element);
        } else {
            groups[color] = [item.context.element];
        }
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
    let i, items = [];
    for (let key of Object.keys(groups)) {
        i = 0;
        for (let item of groups[key]) {
            if (!items[i]) {
                items[i] = [];
            }
            items[i].push(item);
            i += 1;
        }
    }
    return items;
}

export default {
    pathSelectorFromElement: pathSelectorFromElement,
    pathAndClassSelectorFromElement: pathAndClassSelectorFromElement,
    uniquePathSelectorFromElement: uniquePathSelectorFromElement,
    generalizeSelectors: generalizeSelectors,
    parentSelector: parentSelector,
    replacePrefix: replacePrefix,
    findContainer: findContainer,
    findRepeatedContainer: findRepeatedContainer
};
