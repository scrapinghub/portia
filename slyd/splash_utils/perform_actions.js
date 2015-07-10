;(function(){

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

function log(x){
    document.title += "\n" + x;
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
        waitAsync.setTimeout.call(window, callback, timeout);
    },
    click: function(data, callback) {
        var events = ["mousemove", "mouseover", "mousedown", "mouseup", "click"];
        var elements = document.querySelectorAll(data.selector);
        waitAsync(function(){
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
    set: function(data, callback) {
        var elements = document.querySelectorAll(data.selector);
        waitAsync(function(){
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
        log('do' + action.type);
        var tid = waitAsync.setTimeout.call(window, function(){
            log('to' + action.type);
            callback();
        }, 2000);
        actions[action.type](action, function(){
            waitAsync.clearTimeout.call(window, tid);
            log('done' + action.type);
            callback();
        });
    }catch(e){
        log('err' + action.type + e);
        callback();
    }
}

function performEvents(eventList, callback) {
    callback = once(callback);
    waitAsync.setTimeout.call(window, callback, 8000);
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
