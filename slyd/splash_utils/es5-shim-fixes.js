// ES5 shim tries to fix a bug in Object.keys, unfortunatelly it creates another bug.
// This fixes the bug correctly so ES5 shim doesn't try to fix it.

var keysWorksWithArguments = Object.keys && (function () {
    // Old webkit bug
    return Object.keys(arguments).length === 2;
}(1, 2));

if(!keysWorksWithArguments) {
    var originalKeys = Object.keys;
    Object.defineProperty(Object, 'keys', {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function keys(object){
            if (Object.prototype.toString.call(object) === '[object Arguments]') {
                return originalKeys(Array.prototype.slice.call(object));
            } else {
                return originalKeys(object);
            }
        }
    });
}

