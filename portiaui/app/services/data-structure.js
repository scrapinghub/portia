import Ember from 'ember';

class StructureNode {
    constructor(domPath, parent) {
        this.path = domPath;
        this.parent = parent;
        this.children = new Map();
        this.annotations = new Map();
    }

    get node() {
        return this.path[this.path.length - 1];  // undefined for length 0
    }

    get ancestors() {
        return this.path.slice(0, -1);
    }

    get items() {
        return Math.min(...this.annotations.values());
    }

    static fromDomNode(domNode) {
        const domPath = StructureNode.getNodePath(domNode);
        return new StructureNode(domPath);
    }

    static getNodeAncestors(domNode, untilDomNode) {
        return Array.from(Ember.$(domNode).parentsUntil(untilDomNode)).reverse();
    }

    static getNodePath(domNode, fromDomNode) {
        const path = StructureNode.getNodeAncestors(domNode, fromDomNode);
        path.push(domNode);
        return path;
    }

    add(newDomNode) {
        const path = this.path;
        const newPath = StructureNode.getNodePath(newDomNode, this.parent && this.parent.node);
        const length = Math.min(path.length, newPath.length);

        let sameNodes = 0;
        for (;sameNodes < length; sameNodes++) {
            if (newPath[sameNodes] !== path[sameNodes]) {
                break;
            }
        }

        if (sameNodes === path.length) {
            if (sameNodes < newPath.length) {
                const child = this.children.get(newPath[sameNodes]);
                if (child) {
                    return child.add(newDomNode);
                } else {
                    let newNode = new StructureNode(newPath.slice(sameNodes), this);
                    this.children.set(newPath[sameNodes], newNode);
                    return newNode;
                }
            } else {  // sameNodes === newPath.length
                return this;
            }
        } else {  // sameNodes < path.length
            if (sameNodes === newPath.length) {
                let oldNodeCopy = new StructureNode(path.slice(sameNodes), this);
                this.path = newPath;
                oldNodeCopy.annotations = new Map(this.annotations);
                this.children.set(path[sameNodes], oldNodeCopy);
                return this;
            } else {  // sameNodes < newPath.length
                let oldNodeCopy = new StructureNode(path.slice(sameNodes), this);
                let newNode = new StructureNode(newPath.slice(sameNodes), this);
                this.path = path.slice(0, sameNodes);
                oldNodeCopy.annotations = new Map(this.annotations);
                this.children.set(path[sameNodes], oldNodeCopy);
                this.children.set(newPath[sameNodes], newNode);
                return newNode;
            }
        }
    }

    addAnnotation(annotation) {
        this.annotations.set(
            annotation.get('id'),
            (this.annotations.get(annotation.get('id')) || 0) + 1);
        if (this.parent) {
            this.parent.addAnnotation(annotation);
        }
    }

    forEachAnnotationRoot(annotations, callback) {
        const matchingAnnotations = annotations.filter(annotation =>
            this.annotations.get(annotation.get('id')));
        const annotationCounts = matchingAnnotations.map(annotation =>
            this.annotations.get(annotation.get('id')));
        const maxAnnotationCount = annotationCounts.length && Math.max(...annotationCounts);

        if (maxAnnotationCount === 1) {
            callback(this, matchingAnnotations);
        } else if (maxAnnotationCount > 1) {
            this.children.forEach(childNode => {
                childNode.forEachAnnotationRoot(annotations, callback);
            });
        }
    }

    forEachAnnotationLeaf(annotations, callback) {
        const matchingAnnotations = annotations.filter(annotation =>
            this.annotations.get(annotation.get('id')));

        if (matchingAnnotations.length) {
            if (!this.children.size) {
                callback(this, matchingAnnotations);
            } else {
                this.children.forEach(childNode => {
                    childNode.forEachAnnotationLeaf(annotations, callback);
                });
            }
        }
    }

    matchItems(items) {
        if (!items) {
            return [];
        }

        const matches = [];

        items.forEach(node => {
            let item;
            let annotation = node.annotation;
            const annotations = [];
            const subItems = [];

            if (annotation.constructor.modelName === 'item') {
                item = annotation;
                annotation = undefined;
            } else if (annotation.constructor.modelName === 'item-annotation') {
                item = annotation.get('item');
            } else if (annotation.constructor.modelName === 'annotation') {
                item = undefined;
            } else {
                return;
            }

            // split into annotations and nested items
            if (node.children) {
                node.children.forEach(child => {
                    const annotation = child.annotation;
                    if (annotation.constructor.modelName === 'item-annotation') {
                        subItems.push(child);
                    } else if (annotation.constructor.modelName === 'annotation') {
                        annotations.push(annotation);
                    }
                });
            }

            // find root elements
            this.forEachAnnotationRoot(annotations, (rootNode, annotations) => {
                const match = {
                    annotation,
                    item,
                    node: rootNode.node
                };

                // find annotations
                if (annotations.length) {
                    const annotationMatches = new Map();
                    rootNode.forEachAnnotationLeaf(annotations, (leafNode, annotations) => {
                        annotations.forEach(annotation => {
                            annotationMatches.set(annotation, {
                                annotation,
                                node: leafNode.node
                            });
                        });
                    });
                    if (annotationMatches.size) {
                        match.annotations = annotations
                            .map(annotation => annotationMatches.get(annotation))
                            .filter(match => match);
                    }
                }

                // find nested items
                if (subItems.length) {
                    const childMatches = rootNode.matchItems(subItems);
                    if (childMatches.length) {
                        match.nestedItems = childMatches;
                    }
                }

                matches.push(match);
            });
        });

        return matches;
    }
}

export default Ember.Service.extend({
    annotationStructure: Ember.inject.service(),
    uiState: Ember.inject.service(),

    structure: [],

    init() {
        this._super();
        this.get('annotationStructure').registerAnnotations(this, this.updateStructure);
    },

    updateStructure(annotations) {
        let nodeStructure = null;
        annotations.forEach(node => {
            const annotation = node.annotation;
            if (annotation.constructor.modelName === 'annotation') {
                node.elements.forEach(element => {
                    const newNode = nodeStructure ?
                        nodeStructure.add(element) :
                        (nodeStructure = StructureNode.fromDomNode(element));
                    newNode.addAnnotation(annotation);
                });
            }
        });

        this.set('structure', nodeStructure ?
            nodeStructure.matchItems(this.get('annotationStructure').definition) :
            []);
    }
});
