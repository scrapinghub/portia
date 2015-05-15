var interactionEvent = function(evt) {
    return this.createEvent(evt.originalEvent);
};

interactionEvent.prototype.createEvent = function(evt) {
    return {
        eventType: this.getType(evt),
        target: this.getElementId(evt),
        data: this.getData(evt)
    };
};

interactionEvent.prototype.getType = function(evt) {
    switch (evt.constructor.name) {
        case 'MouseEvent': return 'mouse';
        case 'KeyboardEvent': return 'keyboard';
        case 'WheelEvent': return 'wheel';
        default: return 'event';
    }
};

interactionEvent.prototype.getElementId = function(evt) {
    return evt.originalTarget.getAttribute('data-tagid');
};

interactionEvent.prototype.getData = function(evt) {
    var data = {};
    ATTRIBUTE_WHITELIST.forEach(function(attr) {
        if (attr in evt) {
            data[attr] = evt[attr];
        }
    });
    return data;
};

var ATTRIBUTE_WHITELIST = [
    'altKey', 'bubbles', 'button', 'buttons', 'cancelable', 'code', 'ctrlKey',
    'deltaX', 'deltaY', 'deltaZ', 'deltaMode', 'detail', 'isComposing',
    'isTrusted', 'key', 'keyCode', 'location', 'metaKey', 'relatedTargetId',
    'shiftKey', 'type'
];

export default interactionEvent;