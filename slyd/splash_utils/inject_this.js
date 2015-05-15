var VNode = require('virtual-dom/vnode/vnode');
var VText = require('virtual-dom/vnode/vtext');
var diff = require('virtual-dom/diff');

var convertHTML = require('html-to-vdom')({
    VNode: VNode,
    VText: VText
});

var PortiaPage = function() {
    this.page = null;
    this.events = {
        mouse: MouseEvent,
        keyboard: KeyboardEvent,
        wheel: WheelEvent
    };
};

PortiaPage.prototype.init = function() {
    var root = document.documentElement;
    if (!root.getAttribute('data-tagid')) {
        this.maxElement = 0;
        root.setAttribute('data-tagid', 0);
        root.setAttribute('data-parentid', 0);
        this._tagUntaggedElements();
    }
    this.page = this.currentState();
}

PortiaPage.prototype.url = function() {
    return window.location;
};

PortiaPage.prototype.scrollX = function() {
    return window.scrollX;
};

PortiaPage.prototype.scrollY = function() {
    return window.scrollY;
};

PortiaPage.prototype.screenX = function() {
    return window.screenX;
};

PortiaPage.prototype.screenY = function() {
    return window.screenY;
};

PortiaPage.prototype.currentState = function() {
    body = this._html();
    return {
        url: this.url,
        scroll: {
            x: this.scrollX(),
            y: this.scrollY(),
            v: this.screenX(),
            h: this.screenY(),
            mx: window.scrollMaxX,
            my: window.scrollMaxY
        },
        vtree: convertHTML({
            getVNodeKey: function (attributes) {
                return JSON.stringify({
                    id: Number(attributes['data-tagid']),
                    pid: Number(attributes['data-parentid'])
                });
            }
        }, body)
    };
};

PortiaPage.prototype.diff = function(a, b) {
    var d = diff(a, b), res = {};
    if (Object.keys(d).length <= 1) {
        return null;
    }
    delete d['a'];
    for (var key in d) {
        var vpatch = d[key], patch;
        if (this.isArray(vpatch)) {
            res[key] = [];
            for (var i=0; i < vpatch.length; i++) {
                var patch = this.cleanVPatch(vpatch[i]);
                if (patch) {
                    res[key].push(patch);
                }
            }
            if (!res[key].length) {
                delete res[key];
            }
        } else {
            res[key] = this.cleanVPatch(vpatch);
        }
    }
    return JSON.stringify(res);
};

PortiaPage.prototype.cleanVPatch = function(vpatch) {
    var res = {};
    if (vpatch.type) {
        res = {type: vpatch.type}
        if (vpatch.vNode instanceof Object) {
            res.vNode = this.cleanVNode(vpatch.vNode, vpatch.type);
        } else {
            res.vNode = vpatch.vNode;
        }
        if (vpatch.patch instanceof Object && vpatch.patch.tagName) {
            res.patch = this.cleanVNode(vpatch.patch, vpatch.type);
        } else {
            res.patch = vpatch.patch;
        }
        return res;
    }
};

PortiaPage.prototype.isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
};

PortiaPage.prototype.cleanVNode = function(vNode, type) {
    try {
        vNode.key = JSON.parse(vNode.key);
    } catch (e) {
    }
    if (type === 7 || type === 5 || type === 3 || type === 4) {
        return {
            key: Number(vNode.key.id)
        };
    }
    vNode.key = Number(type === 6 ? vNode.key.pid : vNode.key.id);
    if (vNode.properties) {
        for (var attr in vNode.properties) {
            if (attr.substring(0, 5) === 'data-') {
                delete vNode.properties[attr];
            }
        }
    }
    for (var i=0; i < (vNode.children || []).length; i++) {
        vNode.children[i] = this.cleanVNode(vNode.children[i], type);
    }
    vNode.p = vNode.properties;
    vNode.t = vNode.tagName;
    vNode.c = vNode.children;
    vNode.n = vNode.namespace;
    delete vNode.properties;
    delete vNode.tagName;
    delete vNode.children;
    delete vNode.descendantHooks;
    delete vNode.namespace;
    delete vNode.count;
    delete vNode.hasWidgets;
    delete vNode.hasThunks;
    return vNode;
}

PortiaPage.prototype.sendEvent = function(eventType, target, data) {
    var ev,
        element = this._findElement(target);
    if (element) {
        data = this._injectCoords(element, data);
        data.cancelable = true;
        data.bubbles = true;
        try {
            switch (eventType) {
                case 'mouse':
                    ev = document.createEvent("MouseEvent");
                    ev.initMouseEvent(data.type, true, true, window, data.detail || 0,
                                      data.screenX, data.screenY, data.clientX,
                                      data.clientY, data.ctrlKey, data.altKey,
                                      data.shiftKey, data.metaKey, data.button, null);
                    break;
                case 'wheel':
                    ev = new WheelEvent(data.type, data);
                    break;
                case 'keyboard':
                    ev = document.createEvent("KeyboardEvent");
                    ev.initKeyEvent(data.type, true, true, window, data.ctrlKey,
                                    data.altKey, data.shiftKey, data.metaKey,
                                    data.keyCode, data.charCode || 0);
                    break;
                default:
                    ev = new Event(data.type, data);
            }
        } catch (e) {
        }
        if (data.type === 'click' && element.click) {
            element.click();
        } else {
            element.dispatchEvent(ev);
        }
    }
    var body = document.body,
        html = document.documentElement,
        height = Math.max( body.scrollHeight, body.offsetHeight,
                           html.clientHeight, html.scrollHeight, html.offsetHeight ),
        width = Math.max( body.scrollWidth, body.offsetWidth,
                          html.clientWidth, html.scrollWidth, html.offsetWidth );
    if (data.scrollX || data.scrollY) {
        window.scroll((data.scrollX * width) || window.scrollX,
                      (data.scrollY * height) || window.scrollY);
    }
};

PortiaPage.prototype._injectCoords = function(elem, data) {
    var rect = elem.getBoundingClientRect(),
        x = (rect.x + rect.width) / 2,
        y = (rect.y + rect.height) / 2;
    data.clientX = x;
    data.screenX = x;
    data.clientY = y;
    data.screenY = y;
    return data;
};

PortiaPage.prototype._html = function() {
    return document.body.outerHTML;
};

// Return first matching element
PortiaPage.prototype._findElement = function(id) {
    return document.querySelector('[data-tagid="'+id+'"]');
};

PortiaPage.prototype._findUntaggedElements = function() {
    return document.querySelectorAll(':not([data-tagid])');
};

PortiaPage.prototype._tagUntaggedElements = function() {
    var nodes = this._findUntaggedElements();
    for (var i=0; i < nodes.length; i++) {
        elem = nodes[i];
        var id = this._getElemId(elem);
        if (id > this.maxElement) {
            this.maxElement = Math.ceil(id);
        }
        elem.setAttribute('data-parentid', elem.parentElement.getAttribute('data-tagid'))
        elem.setAttribute('data-tagid', id);
    }
};

PortiaPage.prototype._getNextSiblingId = function(elem) {
    var next = elem.nextSibling;
    if (next !== null) {
        if (next.getAttribute && next.getAttribute('data-tagid')) {
            return parseFloat(next.getAttribute('data-tagid'));
        }
        return this._getNextSiblingId(next);
    } else {
        var parent = elem.parentElement;
        if (parent) {
            return this._getNextSiblingId(parent);
        }
        return -1;
    }
};

PortiaPage.prototype._getElemId = function(elem) {
    // Find siblings and parent to get correct id
    var previous, next, unique_id = 0, previous_id, next_id,
        parent = elem.parentElement,
        parent_id = parseFloat(parent.getAttribute('data-tagid') || 0);
        siblings = parent.children;

    for (i = 0; i < siblings.length; i++) {
        previous_id = -1, next_id = -1;
        next = siblings[i+1];
        if (siblings[i] === elem) {
            if (previous) {
                previous_id = parseFloat(previous.getAttribute('data-tagid') || -1);
            }

            if (next) {
                next_id = parseFloat(next.getAttribute('data-tagid') || -1);
            }

            if (previous_id < parent_id) {
                previous_id = parent_id;
            }
            if (next_id < parent_id) {
                next_id = this._getNextSiblingId(parent);
                if (next_id === -1) {
                    return this.maxElement + 1;
                }
            }

            return (previous_id + next_id) / 2;
        }
        previous = siblings[i];
    }
    return -1;
};

PortiaPage.prototype.interact = function(interaction) {
    var page = this.page, diff;
    if (interaction) {
        this.sendEvent(interaction.eventType, interaction.target, interaction.data);
    }
    this._tagUntaggedElements();
    var updatedPage = this.currentState();
    this.page = updatedPage;
    diff =this.diff(page.vtree, updatedPage.vtree);
    if (diff !== this.previous_diff) {
        this.previous_diff = diff;
        return diff;
    }
    return null;
};
window.livePortiaPage = new PortiaPage();
window.livePortiaPage.init();