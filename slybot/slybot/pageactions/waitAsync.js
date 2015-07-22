
var waitAsync = (function(global){
var currentContext = null;
var waitAsyncSymbol = ('Symbol' in global) ? Symbol() : '__waitAsync__symbol__';
var xhrs = 0;

// http://stackoverflow.com/a/20261974/1322817
function locationOf(element, array, comparer, start, end) {
    if (array.length === 0)
        return -1;

    start = start || 0;
    end = end || array.length;
    var pivot = (start + end) >> 1;

    var c = comparer(element, array[pivot]);
    if (end - start <= 1) return c == -1 ? pivot - 1 : pivot;

    switch (c) {
        case -1: return locationOf(element, array, comparer, start, pivot);
        case 0: return pivot;
        case 1: return locationOf(element, array, comparer, pivot, end);
    }
}

function canUseFastTimeouts() {
    return waitAsync.fastTimeouts && xhrs === 0;
}

function openContext(ctx) {
    currentContext = ctx;
}

function notifyError(err) {
    oldSetTimeout(function(){
        throw err;
    }, 0);
    console.error(err);
}

function closeContext(context){
    currentContext = null;
    if(context.timeouts === 0 && context.xhrs === 0) {
        context.onFinish();
    }
}

function wrapInContext(fn, context) {
    if(!context || waitAsyncSymbol in fn) return fn;
    var wrapped = function contextWrapper() {
        openContext(context);
        var res, err;
        try{
            res = fn.apply(this, arguments);
        } catch(e) {
            err = e;
        }
        closeContext(context);
        if(err) {
            throw err;
        }
        return res;
    };
    wrapped[waitAsyncSymbol] = context;
    return wrapped;
}

function compareTimeouts(t1, t2){
    if (t1.time > t2.time) {
        return 1;
    } else if (t1.time < t2.time){
        return -1;
    } else {
        if(t1.tid > t2.tid) {
            return 1;
        } else if (t1.tid < t2.tid) {
            return -1;
        } else {
            return 0;
        }
    }
}

function FakeDate(y, m, d, h, M, s, ms) {
    if(arguments.length === 0){
        return new oldDate(FakeDate.now());
    } else if (arguments.length === 1){
        return new oldDate(y);
    }
    return new oldDate(y, m, d, h, M, s, ms);
}
FakeDate.timeTraveled = 0; // Length of time we have travelled, in milliseconds
FakeDate.travel = function(ammount){
    FakeDate.timeTraveled += ammount;
};
FakeDate.now = function(){
    return oldDate.now() + FakeDate.timeTraveled;
};

// List of "waiting" timeout/intervals.
var timeouts = [];
var timeoutsByTid = {};

var lastTid = 1;

function insertTimeout(fn, timeout, repeat){
    if(currentContext.timeoutCredits <= 0) {
        return;
    }
    currentContext.timeoutCredits--;
    var tid = ++lastTid;
    timeout = Math.max(+timeout, 0);
    if(currentContext) {
        currentContext.timeouts++;
    }
    var timeoutObj = {
        time: FakeDate.now() + timeout,
        context: currentContext,
        fn: wrapInContext(fn, currentContext),
        timeout: timeout,
        tid: tid,
        repeat: repeat,
        cleared: false,
    };
    timeouts.splice(locationOf(timeoutObj, timeouts, compareTimeouts) + 1, 0, timeoutObj);
    timeoutsByTid[tid] = timeoutObj;
    scheduleIfNeccessary();
    return tid;
}

function setTimeout(fn, timeout){
    return insertTimeout(fn, timeout, false);
}

function setInterval(fn, timeout){
    return insertTimeout(fn, timeout, true);
}

function clearTimeout(tid) {
    var timeoutObj = timeoutsByTid[tid];
    if(timeoutObj) {
        timeoutObj.context.timeoutCredits++;
        clearTimeoutObj(timeoutObj, true);
    }
}

function clearTimeoutObj(timeoutObj, removeFromArray){
    if(timeoutObj.context) {
        timeoutObj.context.timeouts--;
    }
    if(removeFromArray) {
        var loc = locationOf(timeoutObj, timeouts, compareTimeouts);
        timeouts.splice(loc, 1);
    }
    delete timeoutsByTid[timeoutObj.tid];
}

function clearInterval(tid) {
    clearTimeout(tid);
}

function timeTravel(){
    if(canUseFastTimeouts() && timeouts.length){
        FakeDate.travel(Math.max(0, timeouts[0].time - FakeDate.now()));
    }
}

function runTimeouts() {
    timeTravel();
    while(timeouts.length && FakeDate.now() >= timeouts[0].time) {
        var timeoutObj = timeouts.shift();
        // Run the timeout
        if(timeoutObj.repeat && !timeoutObj.cleared && timeoutObj.context.timeoutCredits > 0) {
            timeoutObj.context.timeoutCredits--;
            timeoutObj.time = FakeDate.now() + timeoutObj.timeout;
            timeouts.splice(locationOf(timeoutObj, timeouts, compareTimeouts) + 1, 0, timeoutObj);
        } else {
            clearTimeoutObj(timeoutObj, false);
        }
        try {
            timeoutObj.fn.call(global);
        } catch(e) {
            notifyError(e);
        }
        timeTravel();
    }
    scheduleIfNeccessary();
}

var scheduledTid = null;
function scheduleIfNeccessary(){
    if(scheduledTid) {
        oldClearTimeout(scheduledTid);
    }
    if(timeouts.length) {
        var time = canUseFastTimeouts() ? 0 : timeouts[0].time - FakeDate.now();
        scheduledTid = oldSetTimeout(function(){
            scheduledTid = null;
            runTimeouts();
        }, time);
    }
}

function waitAsync(fn, config, callback) {
    if(typeof config == 'function') {
        callback = config;
        config = {};
    }
    var ctx = {
        xhrCredits: typeof config.maxXhr === 'number' ? config.maxXhr : Number.MAX_VALUE,
        timeoutCredits: typeof config.maxTimeouts === 'number' ? config.maxTimeouts : Number.MAX_VALUE,
        config: config,
        timeouts: 0,
        xhrs: 0,
        onFinish: callback
    };
    openContext(ctx);
    fn();
    closeContext(ctx);
}


var xhrEvents = ['abort', 'error', 'load', 'loadend', 'loadstart', 'progress', 'readystatechange'];
function Xhr(){
    var context = currentContext;
    var xhr = new oldXhr();

    var oldSend = patch(xhr, 'send', function(){
        context = currentContext || context;
        if(context) {
            console.log('xhr credits:', context.xhrCredits);
            if(context.xhrCredits <= 0) {
                return;
            }
            context.xhrCredits--;
            context.xhrs++;
            xhrs++;
        }
        return oldSend.apply(this, arguments);
    });

    var oldAEL = patch(xhr, 'addEventListener', function(event, fn){
        return oldAEL.call(this, event, wrapInContext(fn, context));
    });

    function patchEventProp(event){
        var handler = xhr['on' + event];
        if(typeof handler === 'function' && !(waitAsyncSymbol in handler)){
            xhr['on' + event] = wrapInContext(handler, context);
        }
    }

    xhrEvents.forEach(function(event){
        oldAEL.call(xhr, event, function(){
            patchEventProp(event);
        });
    });

    oldSetTimeout(function(){
        xhrEvents.forEach(function(event){
            patchEventProp(event);
        });

        xhr.addEventListener('loadend', function(){
            context.xhrs--;
            xhrs--;
        });
    }, 0);

    return xhr;
}

function requestAnimationFrame(fn){
    return setTimeout(fn, 16);
}

function cancelAnimationFrame(tid){
    return clearTimeout(tid);
}

function patch(obj, key, newval) {
    var old = obj[key];
    obj[key] = newval;
    return old;
}

var oldSetTimeout = patch(global, 'setTimeout', setTimeout);
var oldSetInterval = patch(global, 'setInterval', setInterval);
var oldClearInterval = patch(global, 'clearInterval', clearInterval);
var oldClearTimeout = patch(global, 'clearTimeout', clearTimeout);
var oldXhr = patch(global, 'XMLHttpRequest', Xhr);
var oldDate = patch(global, 'Date', FakeDate);

var oldRequestAnimationFrame = null;
['requestAnimationFrame', 'webkitRequestAnimationFrame', 'mozRequestAnimationFrame'].forEach(function(prop){
    if(!(prop in global)) return;
    oldRequestAnimationFrame = patch(global, prop, requestAnimationFrame);
});
var oldCancelAnimationFrame = null;
['cancelAnimationFrame', 'webkitCancelAnimationFrame', 'mozCancelAnimationFrame'].forEach(function(prop){
    if(!(prop in global)) return;
    patch(global, prop, requestAnimationFrame);
});

waitAsync.fastTimeouts = false;
waitAsync.setTimeout = oldSetTimeout;
waitAsync.setInterval = oldSetInterval;
waitAsync.clearTimeout = oldClearTimeout;
waitAsync.clearInterval = oldClearInterval;
waitAsync.XMLHttpRequest = oldXhr;
waitAsync.Date = oldDate;
return waitAsync;

})(this);

