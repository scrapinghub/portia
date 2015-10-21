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

export default {
    pathSelectorFromElement: pathSelectorFromElement,
    pathAndClassSelectorFromElement: pathAndClassSelectorFromElement,
    uniquePathSelectorFromElement: uniquePathSelectorFromElement,
    generalizeSelectors: generalizeSelectors,
    parentSelector: parentSelector,
    replacePrefix: replacePrefix
};
