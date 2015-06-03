MutationObserver._period = 500;

var PortiaPage = function PortiaPage() {
    var that = this;
    this.mirrorClient = new TreeMirrorClient(document, {
        initialize: function(rootId, children, baseURI){
            that.sendMessage('mutation', ['initialize', rootId, children, baseURI]);
        },
        applyChanged: function(removed, addedOrMoved, attributes, text){
            that.sendMessage('mutation', ['applyChanged', removed, addedOrMoved, attributes, text]);
        }
    });
};

PortiaPage.prototype.sendMutation = function(){
    this.sendMessage('mutation', Array.prototype.splice.call(arguments, 0));
};

PortiaPage.prototype.sendMessage = function(action, message) {
    __portiaApi.sendMessage(JSON.stringify([action, message]));
};

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
    return {
        url: this.url,
        scroll: {
            x: this.scrollX(),
            y: this.scrollY(),
            v: this.screenX(),
            h: this.screenY(),
            mx: window.scrollMaxX,
            my: window.scrollMaxY
        }
    };
};

PortiaPage.sendEvent = {};

PortiaPage.sendEvent.keyboard = function(element, data, type){
    var ev = document.createEvent("KeyboardEvent");
    ev.initKeyEvent(type, true, true, window, data.ctrlKey, data.altKey, data.shiftKey, data.metaKey, data.keyCode, data.charCode);
    element.dispatchEvent(ev);
};

PortiaPage.sendEvent.simple = function(element, data, type) {
    var ev = document.createEvent('Event');
    ev.initEvent(type, true, false);
    element.dispatchEvent(ev);
};

PortiaPage.sendEvent.scroll = function(element, data){
    // Scroll events in the body are dispatched on the documentElement, reverse this
    if(element.scrollTopMax === 0 && element === document.documentElement){
        element = document.body;
    }
    // This will trigger the scroll event
    element.scrollTop = data.scrollTop;
    element.scrollLeft = data.scrollLeft;
};

PortiaPage.sendEvent.mouse = function(element, data, type) {
    var clientRect = element.getBoundingClientRect();
    var clientX = data.targetX + clientRect.left;
    var clientY = data.targetY + clientRect.top;

    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(type, true, true, window, data.detail || 0,
                      clientX, clientY, clientX, clientY,
                      data.ctrlKey, data.altKey, data.shiftKey, data.metaKey, data.button, null);
    element.dispatchEvent(ev);
};

PortiaPage.prototype.sendEvent = function(data) {
    var element = this.getByNodeId(data.target);
    if (!element) {
        throw new Error("Event target doesn't exist.");
    }
    Object.keys(data.propsBefore || {}).forEach(function(propName){
        element[propName] = data.propsBefore[propName];
    });

    PortiaPage.sendEvent[data.category].call(this, element, data, data.type);

    Object.keys(data.propsAfter || {}).forEach(function(propName){
        element[propName] = data.propsAfter[propName];
    });
};

PortiaPage.prototype.getByNodeId = function(nodeId){
    return this.mirrorClient.knownNodes.byId[nodeId];
};

PortiaPage.prototype.pyGetByNodeId = function(nodeId){
    // Workarround to return QWebElement in python
    var res = this.getByNodeId(nodeId);
    if(res) {
        __portiaApi.returnElement(res);
    }
};

if(!('livePortiaPage' in window)){
    window.livePortiaPage = new PortiaPage();
}
