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

PortiaPage.prototype.sendEvent = function(eventType, target, data) {
    var ev, element = this.getByNodeId(target);
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
        x = rect.x + rect.width/2,
        y = rect.y + rect.height/2;
    data.clientX = x;
    data.screenX = x;
    data.clientY = y;
    data.screenY = y;
    return data;
};

PortiaPage.prototype._html = function() {
    return document.body.outerHTML;
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

PortiaPage.prototype.interact = function(interaction) {
    if (interaction && interaction.target && interaction.data) {
        this.sendEvent(interaction.eventType, interaction.target, interaction.data);
    }
    return null;
};
if(!('livePortiaPage' in window)){
    window.livePortiaPage = new PortiaPage();
}
