function getEventCategory (evt) {
    switch (evt.constructor.name) {
        case 'MouseEvent': return 'mouse';
        case 'KeyboardEvent': return 'keyboard';
        case 'UIEvent': return 'scroll';
        case 'FocusEvent': return 'focus';
        case 'Event': case 'InputEvent': return 'simple';
        default: return 'unknown';
    }
}

var interactionEvent = function(evt) {
    var target = evt.target;
    var doc = target.ownerDocument;

    if(target.nodeType === Node.DOCUMENT_NODE){
        doc = target;
        target = doc.documentElement;
    }

    var data = {
        category: getEventCategory(evt.originalEvent || evt),
        type: evt.type,
        target: target.nodeid,
        propsBefore: {},
        propsAfter: {}
    };


    if(data.category === 'mouse') {
        // Send coordinates as a offset of the element instead of the document
        var clientRect = target.getBoundingClientRect();
        data.targetX = evt.clientX - clientRect.left;
        data.targetY = evt.clientY - clientRect.top;
        data.relatedTarget = evt.relatedTarget && evt.relatedTarget.nodeid;
    } else if (data.type === 'scroll') {
        let scrollTarget = target;
        // Scroll events in the body are dispatched in the document, reverse
        if(scrollTarget === doc.documentElement && !(target.scrollTopMax || target.scrollLeftMax)) {
            scrollTarget = doc.body;
        }
        if (scrollTarget) {
            data.scrollTop = scrollTarget.scrollTop;
            data.scrollLeft  = scrollTarget.scrollLeft;
        } else {
            data.scrollTop = 0;
            data.scrollLeft  = 0;
        }
    }

    ATTRIBUTE_WHITELIST.forEach((attr) => {
        if (attr in evt) {
            data[attr] = evt[attr];
        }
    });
    function copyProperties(update_props, obj){
        if(evt.type in update_props) {
            update_props[evt.type].forEach(function(propName){
                if(propName in target) {
                    obj[propName] = target[propName];
                }
            });
        }
    }
    copyProperties(UPDATE_PROPS_BEFORE, data.propsBefore);
    copyProperties(UPDATE_PROPS_AFTER, data.propsAfter);
    return data;
};

var ATTRIBUTE_WHITELIST = [
    'altKey', 'bubbles', 'button', 'buttons', 'cancelable', 'code', 'ctrlKey',
    'deltaX', 'deltaY', 'deltaZ', 'deltaMode', 'detail', 'isComposing',
    'isTrusted', 'key', 'keyCode', 'location', 'metaKey', 'relatedTargetId',
    'shiftKey', 'type'
];

// When this events are fired, update the specified properties in the server
// to the ones in the client before sending the event
var UPDATE_PROPS_BEFORE = {
    'change': ['selectedIndex'], // selects
    'input': ['value'], // text input, textareas
    'keyup': ['value'], // text input, textareas
    'click': ['checked'] // input type radio or check
};
var UPDATE_PROPS_AFTER = {
    'keydown': ['value'], // text input, textareas
    'keypress': ['value'] // text input, textareas
};

export default interactionEvent;
