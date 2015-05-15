export function patchDom(rootNode, patches, doc) {
    var renderOptions = {
        patch: patchRecursive,
        render: createElement,
        document: doc
    };
    return patchRecursive(rootNode, patches, renderOptions);
}

export function VirtualText(text) {
    this.text = String(text);
    this.type = "VirtualText";
}

export function VirtualPatch(type, vNode, patch) {
    this.type = Number(type);
    this.vNode = vNode;
    this.patch = patch;
}

export function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName;
    this.properties = properties || {};
    this.children = children || [];
    this.key = key != null ? String(key) : undefined;
    this.namespace = (typeof namespace === "string") ? namespace : null;
    this.count = (children && children.length) || 0;
    this.hasWidgets = false;
    this.hasThunks = false;
    this.hooks = null;
    this.descendantHooks = false;
    this.type = "VirtualNode";
}


var OPERATION = {
    NONE: 0,
    VTEXT: 1,
    VNODE: 2,
    WIDGET: 3,
    PROPS: 4,
    ORDER: 5,
    INSERT: 6,
    REMOVE: 7,
    THUNK: 8
};

var RESTRICTED_PROPS = new Set(['tagName']);

function patchRecursive(rootNode, patches, renderOptions) {
    if (Object.keys(patches).length === 0) {
        return rootNode;
    }
    var ownerDocument = rootNode.ownerDocument;
    if (!renderOptions.document && ownerDocument !== document) {
        renderOptions.document = ownerDocument;
    }
    for (var key in patches) {
        rootNode = applyPatch(rootNode,
            patches[key],
            renderOptions);
    }
    return rootNode;
}

function applyPatch(rootNode, patchList, renderOptions) {
    var newNode, domNode;
    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            domNode = findNode(patchList[i], renderOptions);
            newNode = patchOp(patchList[i], domNode, renderOptions);

            if (domNode === rootNode) {
                rootNode = newNode;
            }
        }
    } else {
        domNode = findNode(patchList, renderOptions);
        newNode = patchOp(patchList, domNode, renderOptions);
        if (domNode === rootNode) {
            rootNode = newNode;
        }
    }
    return rootNode;
}

function patchOp(vpatch, domNode, renderOptions) {
    var type = vpatch.type, vNode = vpatch.vNode, patch = vpatch.patch;
    if (!domNode) {
        return domNode;
    }
    switch (type) {
        case OPERATION.REMOVE:
            return removeNode(domNode, vNode);
        case OPERATION.INSERT:
            return insertNode(domNode, patch, renderOptions);
        case OPERATION.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions);
        case OPERATION.WIDGET:
            console.log('Updating Widget');
            return domNode;
        case OPERATION.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions);
        case OPERATION.ORDER:
            // reorderChildren(domNode, patch);
            console.log('Reording node: ' + domNode);
            return domNode;
        case OPERATION.PROPS:
            applyProperties(domNode, patch, vNode.properties);
            return domNode;
        case OPERATION.THUNK:
            console.log('Updating Thunk');
            return domNode;
        default:
            return domNode;
    }
}

function findNode(vpatch, renderOptions) {
    var vnode = vpatch.vNode || {},
        patch = vpatch.patch || {},
        key = patch.key || vnode.key;
    if (!key) {
        return null;
    }
    if (isObject(key)) {
        key = vpatch.type === OPERATION.INSERT ? key.pid : key.id;
    }
    return renderOptions.document.querySelector('[data-tagid="'+key+'"]');
}

function removeNode(domNode) {
    var parentNode = domNode.parentNode;
    if (parentNode) {
        parentNode.removeChild(domNode);
    }
    return null;
}

function insertNode(parentNode, vNode, renderOptions) {
    var node = renderOptions.render(vNode, renderOptions);
    if (node && parentNode) {
        parentNode.appendChild(node);
    }
    return parentNode;
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode;
    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text);
        newNode = domNode;
    } else {
        var parentNode = domNode.parentNode;
        newNode = renderOptions.render(vText, renderOptions);
        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode);
        }
    }
    return newNode;
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode,
        newNode = renderOptions.render(vNode, renderOptions);
    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode);
    }
    return newNode;
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes, keyMap = {},  node, remove, insert;
    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i];
        node = childNodes[remove.from];
        if (remove.key) {
            keyMap[remove.key] = node;
        }
        if (node) {
            domNode.removeChild(node);
        }
    }
    var length = childNodes.length;
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j];
        node = keyMap[insert.key];
        // Handle bug in webkit
        if (node) {
            domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to]);
        }
    }
}

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document;
    if (isVirtualText(vnode)) {
        return doc.createTextNode(vnode.text);
    } else if (!isVirtualNode(vnode)) {
        return null;
    }
    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName);
    var props = vnode.properties;
    applyProperties(node, props);
    var children = vnode.children;
    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts);
        if (childNode) {
            node.appendChild(childNode);
        }
    }
    return node;
}

function isVirtualText(x) {
    return x && x.text;
}

function isVirtualNode(x) {
    return x && x.tagName && x.properties;
}

function isObject(x) {
    return typeof x === 'object' && x !== null;
}

var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
};

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName];
        if (propName && !RESTRICTED_PROPS.has(propName)) {
            if (propValue === undefined) {
                removeProperty(node, propName);
            } else {
                if (isObject(propValue)) {
                    patchObject(node, props, previous, propName, propValue);
                } else {
                    node[propName] = propValue;
                }
            }
        }
    }
}

function removeProperty(node, propName) {
    var previousValue = node[propName];
    if (previousValue) {
        if (typeof previousValue === "string") {
            node[propName] = "";
        } else {
            node[propName] = null;
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined;
    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName];
            if (attrValue === undefined) {
                node.removeAttribute(attrName);
            } else {
                node.setAttribute(attrName, attrValue);
            }
        }
        return;
    }
    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue;
        return;
    }
    if (!isObject(node[propName])) {
        node[propName] = {};
    }
    var replacer = propName === "style" ? "" : undefined;
    for (var k in propValue) {
        var value = propValue[k];
        node[propName][k] = (value === undefined) ? replacer : value;
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value);
    } else if (value.constructor) {
        return value.constructor.prototype;
    }
}