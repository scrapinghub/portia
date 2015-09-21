import Ember from 'ember';
import ItemAnnotation from '../models/item-annotation';


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

        items.forEach(item => {
            let annotation = null;
            const annotations = [];
            const subItems = [];

            if (item instanceof ItemAnnotation) {
                annotation = item;
                item = annotation.get('item');
            }

            // split into annotations and nested items
            (item.get('annotations') || []).forEach(annotation => {
                if (annotation instanceof ItemAnnotation) {
                    subItems.push(annotation);
                } else {
                    annotations.push(annotation);
                }
            });

            // find root elements
            this.forEachAnnotationRoot(annotations, (rootNode, annotations) => {
                const match = {
                    item: item,
                    node: rootNode.node
                };

                if (annotation) {
                    match.annotation = annotation;
                }

                // find annotations
                const annotationMatches = new Map();
                rootNode.forEachAnnotationLeaf(annotations, (leafNode, annotations) => {
                    annotations.forEach(annotation => {
                        annotationMatches.set(annotation, {
                            annotation: annotation,
                            node: leafNode.node
                        });
                    });
                });
                if (annotationMatches.size) {
                    match.annotations = annotations
                        .map(annotation => annotationMatches.get(annotation))
                        .filter(match => match);
                }

                // find nested items
                const childMatches = rootNode.matchItems(subItems);
                if (childMatches.length) {
                    match.nestedItems = childMatches;
                }

                matches.push(match);
            });
        });

        return matches;
    }
}

export default Ember.Service.extend({
    uiState: Ember.inject.service(),

    annotations: Ember.computed.readOnly('uiState.models.sample.orderedAnnotations'),
    structure: Ember.computed('annotations', 'annotations.@each.elements', function() {
        let nodeStructure = null;
        (this.get('annotations') || []).forEach(annotation => {
            annotation.get('elements').forEach(element => {
                const newNode = nodeStructure ?
                    nodeStructure.add(element) :
                    (nodeStructure = StructureNode.fromDomNode(element));
                newNode.addAnnotation(annotation);
            });
        });

        return nodeStructure ?
            nodeStructure.matchItems(this.get('uiState.models.sample.items')) :
            [];
    })
});
