;(function(){

var _waitAsync = waitAsync;
var setTimeout = waitAsync.setTimeout;
var clearTimeout = waitAsync.clearTimeout;

function log() {
    console.log.apply(console, arguments);
}

function _select_set_value(select, value) {
    for (var i = 0, len = select.options.length; i < len; i++) {
        var option = select.options[ i ];
        if (option.value === value) {
            option.selected = true;
            return;
        }
    }
    select.selectedIndex = -1;
}

function forEach(arr, fn){
    Array.prototype.forEach.call(arr, fn);
}

var WAIT_ASYNC_OPTS = {
    maxXhr: 5,
    maxTimeouts: 400
};

var actions = {
    wait: function(data, callback){
        setTimeout.call(window, callback, data.timeout);
    },
    click: function(data, callback) {
        var events = ["mousemove", "mouseover", "mousedown", "mouseup", "click"];
        var elements = document.querySelectorAll(data.selector);
        _waitAsync(function(){
            forEach(elements, function(element){
                var clientRect = element.getBoundingClientRect();
                var clientX = clientRect.left + clientRect.width / 2;
                var clientY = clientRect.top + clientRect.height / 2;
                forEach(events, function(event){
                    var ev = document.createEvent("MouseEvent");
                    ev.initMouseEvent(event, true, true, window, 0,
                                      clientX, clientY, clientX, clientY,
                                      false, false, false, false, 0, null);
                    element.dispatchEvent(ev);
                });
            });
        }, WAIT_ASYNC_OPTS, callback);
    },
    scroll: function(data, callback){
        var elements = document.querySelectorAll(data.selector);
        _waitAsync(function(){
            forEach(elements, function(element){
                // Scroll events in the body are dispatched on the documentElement, reverse this
                if(element === document.documentElement && element.scrollHeight === document.body.scrollHeight){
                    element = document.body;
                }
                var maxY = element.scrollMaxY || element.scrollHeight;
                element.scrollTop = (data.percent/100)*maxY;
            });
        }, WAIT_ASYNC_OPTS, callback);
    },
    set: function(data, callback) {
        var elements = document.querySelectorAll(data.selector);
        _waitAsync(function(){
            forEach(elements, function(element){
                var type;
                if(element.tagName === 'SELECT') {
                    type = 'change';
                    _select_set_value(element, data.value);
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    type = 'input';
                    element.value = data.value;
                }
                var ev = document.createEvent('Event');
                ev.initEvent(type, true, false);
                element.dispatchEvent(ev);
            });
        }, WAIT_ASYNC_OPTS, callback);
    }
};

function once(fn){
    var called = false;
    return function(){
        if(!called) {
            called = true;
            return fn.apply(this, arguments);
        }
    };
}

function performAction(action, callback){
    callback = once(callback);
    try{
        var tid = setTimeout.call(window, function(){
            callback();
        }, 2000);
        actions[action.type](action, function(){
            clearTimeout.call(window, tid);
            callback();
        });
    }catch(e){
        callback();
    }
}

function performEvents(eventList, callback) {
    callback = once(callback);
    setTimeout.call(window, callback, 8000);
    function performNext() {
        if(eventList.length) {
            performAction(eventList.shift(), performNext);
        } else {
            callback();
        }
    }
    performNext();
}
window.__slybot__performEvents = performEvents;

})();
