import Ember from 'ember';

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
                const tagName = tagAndClasses[0];
                const classes = tagAndClasses.slice(1);
                classes.sort();
                const match = part.match(/:nth\-child\((\d+)\)/);

                return {
                    tagName,
                    classes,
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
