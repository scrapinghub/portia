MutationObserver._period = 500;

// Note: Variables here are not leaked to the global scope because the compiler wraps it in a function
function hashString(string, seed) { // Non cryptographic hash of an string
    var hash = seed || 0;
    for (var i = 0, len = string.length; i < len; i++) {
        var chr = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/**
 * Returns a non-cryptographic hash of a shallow object
 * > hashObject({a: '1', b: '2'}) === hashObject({b: '2', a: '1'})
 * > hashObject({a: '1', b: '2', c:1}) !== hashObject({b: '2', a: '1'})
 */
function hashObject(obj, seed) {
    var keys = Object.keys(obj).sort();
    var hash = seed || 0;
    for (var i = 0, len = keys.length; i < len; i++) {
        hash = hashString(keys[i] + '\n' + obj[keys[i]] + '\n', hash);
    }
    return hash;
}

var MAX_DIALOGS = 15;  // Maximum number of dialogs (alert, confirm, prompt) before throwing an exception

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
    ev.initKeyboardEvent(type, true, true, window, data.ctrlKey, data.altKey, data.shiftKey, data.metaKey, data.keyCode, data.charCode);
    element.dispatchEvent(ev);
};

PortiaPage.sendEvent.simple = function(element, data, type) {
    var ev = document.createEvent('Event');
    ev.initEvent(type, true, false);
    element.dispatchEvent(ev);
};

PortiaPage.sendEvent.focus = function(element, data, type) {
    if(type in element){
        element[type](); // This will trigger the event
    }
};

PortiaPage.sendEvent.scroll = function(element, data){
    // Scroll events in the body are dispatched on the documentElement, reverse this
    if(element === document.documentElement && element.scrollHeight === document.body.scrollHeight){
        element = document.body;
    }
    // This will trigger the scroll event
    element.scrollTop = data.scrollTop;
    element.scrollLeft = data.scrollLeft;
};

PortiaPage.sendEvent.unknown = function(element, data, type) {
    console.log('Unknown event category for event ' + type);
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

PortiaPage.prototype.localStorageUpdated = function(local, session) {
    if(this._localStorageLoading) {
        return;
    }
    var hash = hashObject(local, 1) + hashObject(session, 2);
    if(hash !== this._prevStorageHash) {
        this.sendMessage('storage', {
            local: local,
            session: session,
            origin: location.origin,
        });
        this._prevStorageHash = hash;
    }
};

PortiaPage.prototype.setLocalStorage = function(localData, sessionData){
    this._localStorageLoading = true;
    var local = window.localStorage;
    var session = window.sessionStorage;
    for(var k in localData) {
        if(localData.hasOwnProperty(k)){
            local[k] = localData[k];
        }
    }
    for(k in sessionData) {
        if(sessionData.hasOwnProperty(k)){
            session[k] = sessionData[k];
        }
    }

    this._prevStorageHash = hashObject(local, 1) + hashObject(session, 2);
    this._localStorageLoading = false;
};

PortiaPage.prototype.pyGetByNodeId = function(nodeId){
    // Workarround to return QWebElement in python
    var res = this.getByNodeId(nodeId);
    if(res) {
        __portiaApi.returnElement(res);
    }
};

var incrementDialogCounter = function(){
    if(++incrementDialogCounter.count > MAX_DIALOGS) {
        throw new Error('Not allowed');
    }
};
incrementDialogCounter.count = 0;

window.alert = function(){};

window.prompt = function(){
    incrementDialogCounter();
    return null; // dismiss the prompt (clicking cancel or closing the window)
};
window.confirm = function(){
    incrementDialogCounter();
    return true;
};

if(!('livePortiaPage' in window)){
    window.livePortiaPage = new PortiaPage();
}
