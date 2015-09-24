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
        this.addParts(selector.split(' > '), setName);
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

        if (!tags.length) {
            return [...selectors];
        }

        const wholeSelectors = [];

        for (let tag of tags) {
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

        console.log('generalizeParts', wholeSelectors);
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
            console.log(rejected.size, Array.from(rejected.values()));
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

    console.log('generalizeSelectors', matchStructure, matchStructure.generalize());

    return matchStructure.generalize();
}

export default {
    pathSelectorFromElement: pathSelectorFromElement,
    pathAndClassSelectorFromElement: pathAndClassSelectorFromElement,
    uniquePathSelectorFromElement: uniquePathSelectorFromElement,
    generalizeSelectors: generalizeSelectors
};
