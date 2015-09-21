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
