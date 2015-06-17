(function(){
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2015 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

// Add semicolon to prevent IIFE from being passed as argument to concatenated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    'use strict';

    /*global define, exports, module */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally.
var ArrayPrototype = Array.prototype;
var ObjectPrototype = Object.prototype;
var FunctionPrototype = Function.prototype;
var StringPrototype = String.prototype;
var NumberPrototype = Number.prototype;
var array_slice = ArrayPrototype.slice;
var array_splice = ArrayPrototype.splice;
var array_push = ArrayPrototype.push;
var array_unshift = ArrayPrototype.unshift;
var array_concat = ArrayPrototype.concat;
var call = FunctionPrototype.call;

// Having a toString local variable name breaks in Opera so use to_string.
var to_string = ObjectPrototype.toString;

var isArray = Array.isArray || function isArray(obj) {
    return to_string.call(obj) === '[object Array]';
};

var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var isCallable; /* inlined from https://npmjs.com/is-callable */ var fnToStr = Function.prototype.toString, tryFunctionObject = function tryFunctionObject(value) { try { fnToStr.call(value); return true; } catch (e) { return false; } }, fnClass = '[object Function]', genClass = '[object GeneratorFunction]'; isCallable = function isCallable(value) { if (typeof value !== 'function') { return false; } if (hasToStringTag) { return tryFunctionObject(value); } var strClass = to_string.call(value); return strClass === fnClass || strClass === genClass; };
var isRegex; /* inlined from https://npmjs.com/is-regex */ var regexExec = RegExp.prototype.exec, tryRegexExec = function tryRegexExec(value) { try { regexExec.call(value); return true; } catch (e) { return false; } }, regexClass = '[object RegExp]'; isRegex = function isRegex(value) { if (typeof value !== 'object') { return false; } return hasToStringTag ? tryRegexExec(value) : to_string.call(value) === regexClass; };
var isString; /* inlined from https://npmjs.com/is-string */ var strValue = String.prototype.valueOf, tryStringObject = function tryStringObject(value) { try { strValue.call(value); return true; } catch (e) { return false; } }, stringClass = '[object String]'; isString = function isString(value) { if (typeof value === 'string') { return true; } if (typeof value !== 'object') { return false; } return hasToStringTag ? tryStringObject(value) : to_string.call(value) === stringClass; };

var isArguments = function isArguments(value) {
    var str = to_string.call(value);
    var isArgs = str === '[object Arguments]';
    if (!isArgs) {
        isArgs = !isArray(value) &&
          value !== null &&
          typeof value === 'object' &&
          typeof value.length === 'number' &&
          value.length >= 0 &&
          isCallable(value.callee);
    }
    return isArgs;
};

/* inlined from http://npmjs.com/define-properties */
var defineProperties = (function (has) {
  var supportsDescriptors = Object.defineProperty && (function () {
      try {
          var obj = {};
          Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
          for (var _ in obj) { return false; }
          return obj.x === obj;
      } catch (e) { /* this is ES3 */
          return false;
      }
  }());

  // Define configurable, writable and non-enumerable props
  // if they don't exist.
  var defineProperty;
  if (supportsDescriptors) {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          Object.defineProperty(object, name, {
              configurable: true,
              enumerable: false,
              writable: true,
              value: method
          });
      };
  } else {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          object[name] = method;
      };
  }
  return function defineProperties(object, map, forceAssign) {
      for (var name in map) {
          if (has.call(map, name)) {
            defineProperty(object, name, map[name], forceAssign);
          }
      }
  };
}(ObjectPrototype.hasOwnProperty));

//
// Util
// ======
//

/* replaceable with https://npmjs.com/package/es-abstract /helpers/isPrimitive */
var isPrimitive = function isPrimitive(input) {
    var type = typeof input;
    return input === null || (type !== 'object' && type !== 'function');
};

var ES = {
    // ES5 9.4
    // http://es5.github.com/#x9.4
    // http://jsperf.com/to-integer
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToInteger */
    ToInteger: function ToInteger(num) {
        var n = +num;
        if (n !== n) { // isNaN
            n = 0;
        } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
        return n;
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToPrimitive */
    ToPrimitive: function ToPrimitive(input) {
        var val, valueOf, toStr;
        if (isPrimitive(input)) {
            return input;
        }
        valueOf = input.valueOf;
        if (isCallable(valueOf)) {
            val = valueOf.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        toStr = input.toString;
        if (isCallable(toStr)) {
            val = toStr.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        throw new TypeError();
    },

    // ES5 9.9
    // http://es5.github.com/#x9.9
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToObject */
    ToObject: function (o) {
        /*jshint eqnull: true */
        if (o == null) { // this matches both null and undefined
            throw new TypeError("can't convert " + o + ' to object');
        }
        return Object(o);
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToUint32 */
    ToUint32: function ToUint32(x) {
        return x >>> 0;
    }
};

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

var Empty = function Empty() {};

defineProperties(FunctionPrototype, {
    bind: function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (!isCallable(target)) {
            throw new TypeError('Function.prototype.bind called on incompatible ' + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = array_slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound;
        var binder = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = target.apply(
                    this,
                    array_concat.call(args, array_slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return target.apply(
                    that,
                    array_concat.call(args, array_slice.call(arguments))
                );

            }

        };

        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.

        var boundLength = Math.max(0, target.length - args.length);

        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            boundArgs.push('$' + i);
        }

        // XXX Build a dynamic function with desired amount of arguments is the only
        // way to set the length property of a function.
        // In environments where Content Security Policies enabled (Chrome extensions,
        // for ex.) all use of eval or Function costructor throws an exception.
        // However in all of these environments Function.prototype.bind exists
        // and so this code will never be executed.
        bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this, arguments); }')(binder);

        if (target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    }
});

// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// us it in defining shortcuts.
var owns = call.bind(ObjectPrototype.hasOwnProperty);

//
// Array
// =====
//

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
var spliceNoopReturnsEmptyArray = (function () {
    var a = [1, 2];
    var result = a.splice();
    return a.length === 2 && isArray(result) && result.length === 0;
}());
defineProperties(ArrayPrototype, {
    // Safari 5.0 bug where .splice() returns undefined
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) {
            return [];
        } else {
            return array_splice.apply(this, arguments);
        }
    }
}, !spliceNoopReturnsEmptyArray);

var spliceWorksWithEmptyObject = (function () {
    var obj = {};
    ArrayPrototype.splice.call(obj, 0, 0, 1);
    return obj.length === 1;
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) { return []; }
        var args = arguments;
        this.length = Math.max(ES.ToInteger(this.length), 0);
        if (arguments.length > 0 && typeof deleteCount !== 'number') {
            args = array_slice.call(arguments);
            if (args.length < 2) {
                args.push(this.length - start);
            } else {
                args[1] = ES.ToInteger(deleteCount);
            }
        }
        return array_splice.apply(this, args);
    }
}, !spliceWorksWithEmptyObject);

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) === undefined but should be "1"
var hasUnshiftReturnValueBug = [].unshift(0) !== 1;
defineProperties(ArrayPrototype, {
    unshift: function () {
        array_unshift.apply(this, arguments);
        return this.length;
    }
}, hasUnshiftReturnValueBug);

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
defineProperties(Array, { isArray: isArray });

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = Object('a');
var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

var properlyBoxesContext = function properlyBoxed(method) {
    // Check node 0.6.21 bug where third parameter is not boxed
    var properlyBoxesNonStrict = true;
    var properlyBoxesStrict = true;
    if (method) {
        method.call('foo', function (_, __, context) {
            if (typeof context !== 'object') { properlyBoxesNonStrict = false; }
        });

        method.call([1], function () {
            'use strict';

            properlyBoxesStrict = typeof this === 'string';
        }, 'x');
    }
    return !!method && properlyBoxesNonStrict && properlyBoxesStrict;
};

defineProperties(ArrayPrototype, {
    forEach: function forEach(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var i = -1;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
          T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.forEach callback must be a function');
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                if (typeof T !== 'undefined') {
                    callbackfn.call(T, self[i], i, object);
                } else {
                    callbackfn(self[i], i, object);
                }
            }
        }
    }
}, !properlyBoxesContext(ArrayPrototype.forEach));

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
defineProperties(ArrayPrototype, {
    map: function map(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;
        var result = Array(length);
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.map callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                if (typeof T !== 'undefined') {
                    result[i] = callbackfn.call(T, self[i], i, object);
                } else {
                    result[i] = callbackfn(self[i], i, object);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.map));

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
defineProperties(ArrayPrototype, {
    filter: function filter(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;
        var result = [];
        var value;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.filter callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (typeof T === 'undefined' ? callbackfn(value, i, object) : callbackfn.call(T, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.filter));

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
defineProperties(ArrayPrototype, {
    every: function every(callbackfn /*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.every callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !(typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return false;
            }
        }
        return true;
    }
}, !properlyBoxesContext(ArrayPrototype.every));

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
defineProperties(ArrayPrototype, {
    some: function some(callbackfn/*, thisArg */) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.some callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && (typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return true;
            }
        }
        return false;
    }
}, !properlyBoxesContext(ArrayPrototype.some));

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
var reduceCoercesToObject = false;
if (ArrayPrototype.reduce) {
    reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduce: function reduce(callbackfn /*, initialValue*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduce callback must be a function');
        }

        // no value to return if no initial value and an empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduce of empty array with no initial value');
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError('reduce of empty array with no initial value');
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        }

        return result;
    }
}, !reduceCoercesToObject);

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
var reduceRightCoercesToObject = false;
if (ArrayPrototype.reduceRight) {
    reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) { return list; }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduceRight: function reduceRight(callbackfn/*, initial*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? this.split('') : object;
        var length = self.length >>> 0;

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduceRight callback must be a function');
        }

        // no value to return if no initial value, empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduceRight of empty array with no initial value');
        }

        var result;
        var i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError('reduceRight of empty array with no initial value');
                }
            } while (true);
        }

        if (i < 0) {
            return result;
        }

        do {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        } while (i--);

        return result;
    }
}, !reduceRightCoercesToObject);

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var hasFirefox2IndexOfBug = Array.prototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
defineProperties(ArrayPrototype, {
    indexOf: function indexOf(searchElement /*, fromIndex */) {
        var self = splitString && isString(this) ? this.split('') : ES.ToObject(this);
        var length = self.length >>> 0;

        if (length === 0) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = ES.ToInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === searchElement) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2IndexOfBug);

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
var hasFirefox2LastIndexOfBug = Array.prototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
defineProperties(ArrayPrototype, {
    lastIndexOf: function lastIndexOf(searchElement /*, fromIndex */) {
        var self = splitString && isString(this) ? this.split('') : ES.ToObject(this);
        var length = self.length >>> 0;

        if (length === 0) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, ES.ToInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && searchElement === self[i]) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2LastIndexOfBug);

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14

// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
var hasDontEnumBug = !({ 'toString': null }).propertyIsEnumerable('toString'),
    hasProtoEnumBug = function () {}.propertyIsEnumerable('prototype'),
    hasStringEnumBug = !owns('x', '0'),
    dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
    ],
    dontEnumsLength = dontEnums.length;

defineProperties(Object, {
    keys: function keys(object) {
        var isFn = isCallable(object),
            isArgs = isArguments(object),
            isObject = object !== null && typeof object === 'object',
            isStr = isObject && isString(object);

        if (!isObject && !isFn && !isArgs) {
            throw new TypeError('Object.keys called on a non-object');
        }

        var theKeys = [];
        var skipProto = hasProtoEnumBug && isFn;
        if ((isStr && hasStringEnumBug) || isArgs) {
            for (var i = 0; i < object.length; ++i) {
                theKeys.push(String(i));
            }
        }

        if (!isArgs) {
            for (var name in object) {
                if (!(skipProto && name === 'prototype') && owns(object, name)) {
                    theKeys.push(String(name));
                }
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                skipConstructor = ctor && ctor.prototype === object;
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j];
                if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                    theKeys.push(dontEnum);
                }
            }
        }
        return theKeys;
    }
});

var keysWorksWithArguments = Object.keys && (function () {
    // Safari 5.0 bug
    return Object.keys(arguments).length === 2;
}(1, 2));
var originalKeys = Object.keys;
defineProperties(Object, {
    keys: function keys(object) {
        if (isArguments(object)) {
            return originalKeys(ArrayPrototype.slice.call(object));
        } else {
            return originalKeys(object);
        }
    }
}, !keysWorksWithArguments);

//
// Date
// ====
//

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000;
var negativeYearString = '-000001';
var hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;

defineProperties(Date.prototype, {
    toISOString: function toISOString() {
        var result, length, value, year, month;
        if (!isFinite(this)) {
            throw new RangeError('Date.prototype.toISOString called on non-finite value.');
        }

        year = this.getUTCFullYear();

        month = this.getUTCMonth();
        // see https://github.com/es-shims/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        result = [month + 1, this.getUTCDate(), this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
        year = (
            (year < 0 ? '-' : (year > 9999 ? '+' : '')) +
            ('00000' + Math.abs(year)).slice((0 <= year && year <= 9999) ? -4 : -6)
        );

        length = result.length;
        while (length--) {
            value = result[length];
            // pad months, days, hours, minutes, and seconds to have two
            // digits.
            if (value < 10) {
                result[length] = '0' + value;
            }
        }
        // pad milliseconds to have three digits.
        return (
            year + '-' + result.slice(0, 2).join('-') +
            'T' + result.slice(2).join(':') + '.' +
            ('000' + this.getUTCMilliseconds()).slice(-3) + 'Z'
        );
    }
}, hasNegativeDateBug);

// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = (function () {
    try {
        return Date.prototype.toJSON &&
            new Date(NaN).toJSON() === null &&
            new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
            Date.prototype.toJSON.call({ // generic
                toISOString: function () { return true; }
            });
    } catch (e) {
        return false;
    }
}());
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ES.ToPrimitive(O, hint Number).
        var O = Object(this);
        var tv = ES.ToPrimitive(O);
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === 'number' && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        var toISO = O.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (!isCallable(toISO)) {
            throw new TypeError('toISOString property is not callable');
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(O);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
var doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
if (!Date.parse || doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    /*global Date: true */
    /*eslint-disable no-undef*/
    Date = (function (NativeDate) {
    /*eslint-enable no-undef*/
        // Date.length === 7
        var DateShim = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            var date;
            if (this instanceof NativeDate) {
                date = length === 1 && String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(DateShim.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y) :
                                  new NativeDate();
            } else {
                date = NativeDate.apply(this, arguments);
            }
            // Prevent mixups with unfixed Date object
            defineProperties(date, { constructor: DateShim }, true);
            return date;
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp('^' +
            '(\\d{4}|[+-]\\d{6})' + // four-digit year capture or sign +
                                      // 6-digit extended year
            '(?:-(\\d{2})' + // optional month capture
            '(?:-(\\d{2})' + // optional day capture
            '(?:' + // capture hours:minutes:seconds.milliseconds
                'T(\\d{2})' + // hours capture
                ':(\\d{2})' + // minutes capture
                '(?:' + // optional :seconds.milliseconds
                    ':(\\d{2})' + // seconds capture
                    '(?:(\\.\\d{1,}))?' + // milliseconds capture
                ')?' +
            '(' + // capture UTC offset component
                'Z|' + // UTC capture
                '(?:' + // offset specifier +/-hours:minutes
                    '([-+])' + // sign capture
                    '(\\d{2})' + // hours offset capture
                    ':(\\d{2})' + // minutes offset capture
                ')' +
            ')?)?)?)?' +
        '$');

        var months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        var dayFromMonth = function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        };

        var toUTC = function toUTC(t) {
            return Number(new NativeDate(1970, 0, 1, 0, 0, 0, t));
        };

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            if (owns(NativeDate, key)) {
                DateShim[key] = NativeDate[key];
            }
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        defineProperties(DateShim, {
            now: NativeDate.now,
            UTC: NativeDate.UTC
        }, true);
        DateShim.prototype = NativeDate.prototype;
        defineProperties(DateShim.prototype, {
            constructor: DateShim
        }, true);

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        DateShim.parse = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = Number(match[1]),
                    month = Number(match[2] || 1) - 1,
                    day = Number(match[3] || 1) - 1,
                    hour = Number(match[4] || 0),
                    minute = Number(match[5] || 0),
                    second = Number(match[6] || 0),
                    millisecond = Math.floor(Number(match[7] || 0) * 1000),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    isLocalTime = Boolean(match[4] && !match[8]),
                    signOffset = match[9] === '-' ? 1 : -1,
                    hourOffset = Number(match[10] || 0),
                    minuteOffset = Number(match[11] || 0),
                    result;
                if (
                    hour < (
                        minute > 0 || second > 0 || millisecond > 0 ?
                        24 : 25
                    ) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (
                        dayFromMonth(year, month + 1) -
                        dayFromMonth(year, month)
                    )
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond;
                    if (isLocalTime) {
                        result = toUTC(result);
                    }
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };

        return DateShim;
    }(Date));
    /*global Date: false */
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

//
// Number
// ======
//

// ES5.1 15.7.4.5
// http://es5.github.com/#x15.7.4.5
var hasToFixedBugs = NumberPrototype.toFixed && (
  (0.00008).toFixed(3) !== '0.000' ||
  (0.9).toFixed(0) !== '1' ||
  (1.255).toFixed(2) !== '1.25' ||
  (1000000000000000128).toFixed(0) !== '1000000000000000128'
);

var toFixedHelpers = {
  base: 1e7,
  size: 6,
  data: [0, 0, 0, 0, 0, 0],
  multiply: function multiply(n, c) {
      var i = -1;
      var c2 = c;
      while (++i < toFixedHelpers.size) {
          c2 += n * toFixedHelpers.data[i];
          toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
          c2 = Math.floor(c2 / toFixedHelpers.base);
      }
  },
  divide: function divide(n) {
      var i = toFixedHelpers.size, c = 0;
      while (--i >= 0) {
          c += toFixedHelpers.data[i];
          toFixedHelpers.data[i] = Math.floor(c / n);
          c = (c % n) * toFixedHelpers.base;
      }
  },
  numToString: function numToString() {
      var i = toFixedHelpers.size;
      var s = '';
      while (--i >= 0) {
          if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
              var t = String(toFixedHelpers.data[i]);
              if (s === '') {
                  s = t;
              } else {
                  s += '0000000'.slice(0, 7 - t.length) + t;
              }
          }
      }
      return s;
  },
  pow: function pow(x, n, acc) {
      return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
  },
  log: function log(x) {
      var n = 0;
      var x2 = x;
      while (x2 >= 4096) {
          n += 12;
          x2 /= 4096;
      }
      while (x2 >= 2) {
          n += 1;
          x2 /= 2;
      }
      return n;
  }
};

defineProperties(NumberPrototype, {
    toFixed: function toFixed(fractionDigits) {
        var f, x, s, m, e, z, j, k;

        // Test for NaN and round fractionDigits down
        f = Number(fractionDigits);
        f = f !== f ? 0 : Math.floor(f);

        if (f < 0 || f > 20) {
            throw new RangeError('Number.toFixed called with invalid number of decimals');
        }

        x = Number(this);

        // Test for NaN
        if (x !== x) {
            return 'NaN';
        }

        // If it is too big or small, return the string value of the number
        if (x <= -1e21 || x >= 1e21) {
            return String(x);
        }

        s = '';

        if (x < 0) {
            s = '-';
            x = -x;
        }

        m = '0';

        if (x > 1e-21) {
            // 1e-21 < x < 1e21
            // -70 < log2(x) < 70
            e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
            z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
            z *= 0x10000000000000; // Math.pow(2, 52);
            e = 52 - e;

            // -18 < e < 122
            // x = z / 2 ^ e
            if (e > 0) {
                toFixedHelpers.multiply(0, z);
                j = f;

                while (j >= 7) {
                    toFixedHelpers.multiply(1e7, 0);
                    j -= 7;
                }

                toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
                j = e - 1;

                while (j >= 23) {
                    toFixedHelpers.divide(1 << 23);
                    j -= 23;
                }

                toFixedHelpers.divide(1 << j);
                toFixedHelpers.multiply(1, 1);
                toFixedHelpers.divide(2);
                m = toFixedHelpers.numToString();
            } else {
                toFixedHelpers.multiply(0, z);
                toFixedHelpers.multiply(1 << (-e), 0);
                m = toFixedHelpers.numToString() + '0.00000000000000000000'.slice(2, 2 + f);
            }
        }

        if (f > 0) {
            k = m.length;

            if (k <= f) {
                m = s + '0.0000000000000000000'.slice(0, f - k + 2) + m;
            } else {
                m = s + m.slice(0, k - f) + '.' + m.slice(k - f);
            }
        } else {
            m = s + m;
        }

        return m;
    }
}, hasToFixedBugs);

//
// String
// ======
//

// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14

// [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
// Many browsers do not split properly with regular expressions or they
// do not perform the split correctly under obscure conditions.
// See http://blog.stevenlevithan.com/archives/cross-browser-split
// I've tested in many browsers and this seems to cover the deviant ones:
//    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
//    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
//    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
//       [undefined, "t", undefined, "e", ...]
//    ''.split(/.?/) should be [], not [""]
//    '.'.split(/()()/) should be ["."], not ["", "", "."]

var string_split = StringPrototype.split;
if (
    'ab'.split(/(?:ab)*/).length !== 2 ||
    '.'.split(/(.?)(.?)/).length !== 4 ||
    'tesst'.split(/(s)*/)[1] === 't' ||
    'test'.split(/(?:)/, -1).length !== 4 ||
    ''.split(/.?/).length ||
    '.'.split(/()()/).length > 1
) {
    (function () {
        var compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group

        StringPrototype.split = function (separator, limit) {
            var string = this;
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }

            // If `separator` is not a regex, use native split
            if (!isRegex(separator)) {
                return string_split.call(this, separator, limit);
            }

            var output = [];
            var flags = (separator.ignoreCase ? 'i' : '') +
                        (separator.multiline ? 'm' : '') +
                        (separator.extended ? 'x' : '') + // Proposed for ES6
                        (separator.sticky ? 'y' : ''), // Firefox 3+
                lastLastIndex = 0,
                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;
            var separatorCopy = new RegExp(separator.source, flags + 'g');
            string += ''; // Type-convert
            if (!compliantExecNpcg) {
                // Doesn't need flags gy, but they don't hurt
                separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
            }
            /* Values for `limit`, per the spec:
             * If undefined: 4294967295 // Math.pow(2, 32) - 1
             * If 0, Infinity, or NaN: 0
             * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
             * If negative number: 4294967296 - Math.floor(Math.abs(limit))
             * If other: Type-convert, then use the above rules
             */
            var splitLimit = typeof limit === 'undefined' ?
                -1 >>> 0 : // Math.pow(2, 32) - 1
                ES.ToUint32(limit);
            match = separatorCopy.exec(string);
            while (match) {
                // `separatorCopy.lastIndex` is not reliable cross-browser
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    output.push(string.slice(lastLastIndex, match.index));
                    // Fix browsers whose `exec` methods don't consistently return `undefined` for
                    // nonparticipating capturing groups
                    if (!compliantExecNpcg && match.length > 1) {
                        /*eslint-disable no-loop-func */
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (typeof arguments[i] === 'undefined') {
                                    match[i] = void 0;
                                }
                            }
                        });
                        /*eslint-enable no-loop-func */
                    }
                    if (match.length > 1 && match.index < string.length) {
                        array_push.apply(output, match.slice(1));
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= splitLimit) {
                        break;
                    }
                }
                if (separatorCopy.lastIndex === match.index) {
                    separatorCopy.lastIndex++; // Avoid an infinite loop
                }
                match = separatorCopy.exec(string);
            }
            if (lastLastIndex === string.length) {
                if (lastLength || !separatorCopy.test('')) {
                    output.push('');
                }
            } else {
                output.push(string.slice(lastLastIndex));
            }
            return output.length > splitLimit ? output.slice(0, splitLimit) : output;
        };
    }());

// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
} else if ('0'.split(void 0, 0).length) {
    StringPrototype.split = function split(separator, limit) {
        if (typeof separator === 'undefined' && limit === 0) { return []; }
        return string_split.call(this, separator, limit);
    };
}

var str_replace = StringPrototype.replace;
var replaceReportsGroupsCorrectly = (function () {
    var groups = [];
    'x'.replace(/x(.)?/g, function (match, group) {
        groups.push(group);
    });
    return groups.length === 1 && typeof groups[0] === 'undefined';
}());

if (!replaceReportsGroupsCorrectly) {
    StringPrototype.replace = function replace(searchValue, replaceValue) {
        var isFn = isCallable(replaceValue);
        var hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
        if (!isFn || !hasCapturingGroups) {
            return str_replace.call(this, searchValue, replaceValue);
        } else {
            var wrappedReplaceValue = function (match) {
                var length = arguments.length;
                var originalLastIndex = searchValue.lastIndex;
                searchValue.lastIndex = 0;
                var args = searchValue.exec(match) || [];
                searchValue.lastIndex = originalLastIndex;
                args.push(arguments[length - 2], arguments[length - 1]);
                return replaceValue.apply(this, args);
            };
            return str_replace.call(this, searchValue, wrappedReplaceValue);
        }
    };
}

// ECMA-262, 3rd B.2.3
// Not an ECMAScript standard, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
var string_substr = StringPrototype.substr;
var hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';
defineProperties(StringPrototype, {
    substr: function substr(start, length) {
        var normalizedStart = start;
        if (start < 0) {
            normalizedStart = Math.max(this.length + start, 0);
        }
        return string_substr.call(this, normalizedStart, length);
    }
}, hasNegativeSubstrBug);

// ES5 15.5.4.20
// whitespace from: http://es5.github.io/#x15.5.4.20
var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
    '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
    '\u2029\uFEFF';
var zeroWidth = '\u200b';
var wsRegexChars = '[' + ws + ']';
var trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');
var hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
defineProperties(StringPrototype, {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    trim: function trim() {
        if (typeof this === 'undefined' || this === null) {
            throw new TypeError("can't convert " + this + ' to object');
        }
        return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    }
}, hasTrimWhitespaceBug);

// ES-5 15.1.2.2
if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
    /*global parseInt: true */
    parseInt = (function (origParseInt) {
        var hexRegex = /^0[xX]/;
        return function parseInt(str, radix) {
            var string = String(str).trim();
            var defaultedRadix = Number(radix) || (hexRegex.test(string) ? 16 : 10);
            return origParseInt(string, defaultedRadix);
        };
    }(parseInt));
}

}));

/*!
 * Shim for MutationObserver interface
 * Author: Graeme Yeates (github.com/megawac)
 * Repository: https://github.com/megawac/MutationObserver.js
 * License: WTFPL V2, 2004 (wtfpl.net).
 * Though credit and staring the repo will make me feel pretty, you can modify and redistribute as you please.
 * Attempts to follow spec (http:// www.w3.org/TR/dom/#mutation-observers) as closely as possible for native javascript
 * See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
 */

/**
 * prefix bugs:
    - https://bugs.webkit.org/show_bug.cgi?id=85161
    - https://bugzilla.mozilla.org/show_bug.cgi?id=749920
*/
window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || (function(undefined) {
    "use strict";
    /**
     * @param {function(Array.<MutationRecord>, MutationObserver)} listener
     * @constructor
     */
    function MutationObserver(listener) {
        /**
         * @type {Array.<Object>}
         * @private
         */
        this._watched = [];
        /** @private */
        this._listener = listener;
    }

    /**
     * Start a recursive timeout function to check all items being observed for mutations
     * @type {MutationObserver} observer
     * @private
     */
    function startMutationChecker(observer) {
        (function check() {
            var mutations = observer.takeRecords();

            if (mutations.length) { // fire away
                // calling the listener with context is not spec but currently consistent with FF and WebKit
                observer._listener(mutations, observer);
            }
            /** @private */
            observer._timeout = setTimeout(check, MutationObserver._period);
        })();
    }

    /**
     * Period to check for mutations (~32 times/sec)
     * @type {number}
     * @expose
     */
    MutationObserver._period = 30 /*ms+runtime*/ ;

    /**
     * Exposed API
     * @expose
     * @final
     */
    MutationObserver.prototype = {
        /**
         * see http:// dom.spec.whatwg.org/#dom-mutationobserver-observe
         * not going to throw here but going to follow the current spec config sets
         * @param {Node|null} $target
         * @param {Object|null} config : MutationObserverInit configuration dictionary
         * @expose
         * @return undefined
         */
        observe: function($target, config) {
            /**
             * Using slightly different names so closure can go ham
             * @type {!Object} : A custom mutation config
             */
            var settings = {
                attr: !! (config.attributes || config.attributeFilter || config.attributeOldValue),

                // some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                kids: !! config.childList,
                descendents: !! config.subtree,
                charData: !! (config.characterData || config.characterDataOldValue)
            };

            var watched = this._watched;

            // remove already observed target element from pool
            for (var i = 0; i < watched.length; i++) {
                if (watched[i].tar === $target) watched.splice(i, 1);
            }

            if (config.attributeFilter) {
                /**
                 * converts to a {key: true} dict for faster lookup
                 * @type {Object.<String,Boolean>}
                 */
                settings.afilter = reduce(config.attributeFilter, function(a, b) {
                    a[b] = true;
                    return a;
                }, {});
            }

            watched.push({
                tar: $target,
                fn: createMutationSearcher($target, settings)
            });

            // reconnect if not connected
            if (!this._timeout) {
                startMutationChecker(this);
            }
        },

        /**
         * Finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
         * @expose
         * @return {Array.<MutationRecord>}
         */
        takeRecords: function() {
            var mutations = [];
            var watched = this._watched;

            for (var i = 0; i < watched.length; i++) {
                watched[i].fn(mutations);
            }

            return mutations;
        },

        /**
         * @expose
         * @return undefined
         */
        disconnect: function() {
            this._watched = []; // clear the stuff being observed
            clearTimeout(this._timeout); // ready for garbage collection
            /** @private */
            this._timeout = null;
        }
    };

    /**
     * Simple MutationRecord pseudoclass. No longer exposing as its not fully compliant
     * @param {Object} data
     * @return {Object} a MutationRecord
     */
    function MutationRecord(data) {
        var settings = { // technically these should be on proto so hasOwnProperty will return false for non explicitly props
            type: null,
            target: null,
            addedNodes: [],
            removedNodes: [],
            previousSibling: null,
            nextSibling: null,
            attributeName: null,
            attributeNamespace: null,
            oldValue: null
        };
        for (var prop in data) {
            if (has(settings, prop) && data[prop] !== undefined) settings[prop] = data[prop];
        }
        return settings;
    }

    /**
     * Creates a func to find all the mutations
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     */
    function createMutationSearcher($target, config) {
        /** type {Elestuct} */
        var $oldstate = clone($target, config); // create the cloned datastructure

        /**
         * consumes array of mutations we can push to
         *
         * @param {Array.<MutationRecord>} mutations
         */
        return function(mutations) {
            var olen = mutations.length, dirty;

            // Alright we check base level changes in attributes... easy
            if (config.attr && $oldstate.attr) {
                findAttributeMutations(mutations, $target, $oldstate.attr, config.afilter);
            }

            // check childlist or subtree for mutations
            if (config.kids || config.descendents) {
                dirty = searchSubtree(mutations, $target, $oldstate, config);
            }

            // reclone data structure if theres changes
            if (dirty || mutations.length !== olen) {
                /** type {Elestuct} */
                $oldstate = clone($target, config);
            }
        };
    }

    /* attributes + attributeFilter helpers */

    /**
     * fast helper to check to see if attributes object of an element has changed
     * doesnt handle the textnode case
     *
     * @param {Array.<MutationRecord>} mutations
     * @param {Node} $target
     * @param {Object.<string, string>} $oldstate : Custom attribute clone data structure from clone
     * @param {Object} filter
     */
    function findAttributeMutations(mutations, $target, $oldstate, filter) {
        var checked = {};
        var attributes = $target.attributes;
        var attr;
        var name;
        var i = attributes.length;
        while (i--) {
            attr = attributes[i];
            name = attr.name;
            if (!filter || has(filter, name)) {
                if (attr.value !== $oldstate[name]) {
                    // The pushing is redundant but gzips very nicely
                    mutations.push(MutationRecord({
                        type: "attributes",
                        target: $target,
                        attributeName: name,
                        oldValue: $oldstate[name],
                        attributeNamespace: attr.namespaceURI // in ie<8 it incorrectly will return undefined
                    }));
                }
                checked[name] = true;
            }
        }
        for (name in $oldstate) {
            if (!(checked[name])) {
                mutations.push(MutationRecord({
                    target: $target,
                    type: "attributes",
                    attributeName: name,
                    oldValue: $oldstate[name]
                }));
            }
        }
    }

    /**
     * searchSubtree: array of mutations so far, element, element clone, bool
     * synchronous dfs comparision of two nodes
     * This function is applied to any observed element with childList or subtree specified
     * Sorry this is kind of confusing as shit, tried to comment it a bit...
     * codereview.stackexchange.com/questions/38351 discussion of an earlier version of this func
     *
     * @param {Array} mutations
     * @param {Node} $target
     * @param {!Object} $oldstate : A custom cloned node from clone()
     * @param {!Object} config : A custom mutation config
     */
    function searchSubtree(mutations, $target, $oldstate, config) {
        // Track if the tree is dirty and has to be recomputed (#14).
        var dirty;
        /*
         * Helper to identify node rearrangment and stuff...
         * There is no gaurentee that the same node will be identified for both added and removed nodes
         * if the positions have been shuffled.
         * conflicts array will be emptied by end of operation
         */
        function resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes) {
            // the distance between the first conflicting node and the last
            var distance = conflicts.length - 1;
            // prevents same conflict being resolved twice consider when two nodes switch places.
            // only one should be given a mutation event (note -~ is used as a math.ceil shorthand)
            var counter = -~((distance - numAddedNodes) / 2);
            var $cur;
            var oldstruct;
            var conflict;
            while ((conflict = conflicts.pop())) {
                $cur = $kids[conflict.i];
                oldstruct = $oldkids[conflict.j];

                // attempt to determine if there was node rearrangement... won't gaurentee all matches
                // also handles case where added/removed nodes cause nodes to be identified as conflicts
                if (config.kids && counter && Math.abs(conflict.i - conflict.j) >= distance) {
                    mutations.push(MutationRecord({
                        type: "childList",
                        target: node,
                        addedNodes: [$cur],
                        removedNodes: [$cur],
                        // haha don't rely on this please
                        nextSibling: $cur.nextSibling,
                        previousSibling: $cur.previousSibling
                    }));
                    counter--; // found conflict
                }

                // Alright we found the resorted nodes now check for other types of mutations
                if (config.attr && oldstruct.attr) findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                    mutations.push(MutationRecord({
                        type: "characterData",
                        target: $cur
                    }));
                }
                // now look @ subtree
                if (config.descendents) findMutations($cur, oldstruct);
            }
        }

        /**
         * Main worker. Finds and adds mutations if there are any
         * @param {Node} node
         * @param {!Object} old : A cloned data structure using internal clone
         */
        function findMutations(node, old) {
            var $kids = node.childNodes;
            var $oldkids = old.kids;
            var klen = $kids.length;
            // $oldkids will be undefined for text and comment nodes
            var olen = $oldkids ? $oldkids.length : 0;
            // if (!olen && !klen) return; // both empty; clearly no changes

            // we delay the intialization of these for marginal performance in the expected case (actually quite signficant on large subtrees when these would be otherwise unused)
            // map of checked element of ids to prevent registering the same conflict twice
            var map;
            // array of potential conflicts (ie nodes that may have been re arranged)
            var conflicts;
            var id; // element id from getElementId helper
            var idx; // index of a moved or inserted element

            var oldstruct;
            // current and old nodes
            var $cur;
            var $old;
            // track the number of added nodes so we can resolve conflicts more accurately
            var numAddedNodes = 0;

            // iterate over both old and current child nodes at the same time
            var i = 0, j = 0;
            // while there is still anything left in $kids or $oldkids (same as i < $kids.length || j < $oldkids.length;)
            while( i < klen || j < olen ) {
                // current and old nodes at the indexs
                $cur = $kids[i];
                oldstruct = $oldkids[j];
                $old = oldstruct && oldstruct.node;

                if ($cur === $old) { // expected case - optimized for this case
                    // check attributes as specified by config
                    if (config.attr && oldstruct.attr) /* oldstruct.attr instead of textnode check */findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                    // check character data if node is a comment or textNode and it's being observed
                    if (config.charData && oldstruct.charData !== undefined && $cur.nodeValue !== oldstruct.charData) {
                        mutations.push(MutationRecord({
                            type: "characterData",
                            target: $cur
                        }));
                    }

                    // resolve conflicts; it will be undefined if there are no conflicts - otherwise an array
                    if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);

                    // recurse on next level of children. Avoids the recursive call when there are no children left to iterate
                    if (config.descendents && ($cur.childNodes.length || oldstruct.kids && oldstruct.kids.length)) findMutations($cur, oldstruct);

                    i++;
                    j++;
                } else { // (uncommon case) lookahead until they are the same again or the end of children
                    dirty = true;
                    if (!map) { // delayed initalization (big perf benefit)
                        map = {};
                        conflicts = [];
                    }
                    if ($cur) {
                        // check id is in the location map otherwise do a indexOf search
                        if (!(map[id = getElementId($cur)])) { // to prevent double checking
                            // mark id as found
                            map[id] = true;
                            // custom indexOf using comparitor checking oldkids[i].node === $cur
                            if ((idx = indexOfCustomNode($oldkids, $cur, j)) === -1) {
                                if (config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: node,
                                        addedNodes: [$cur], // $cur is a new node
                                        nextSibling: $cur.nextSibling,
                                        previousSibling: $cur.previousSibling
                                    }));
                                    numAddedNodes++;
                                }
                            } else {
                                conflicts.push({ // add conflict
                                    i: i,
                                    j: idx
                                });
                            }
                        }
                        i++;
                    }

                    if ($old &&
                       // special case: the changes may have been resolved: i and j appear congurent so we can continue using the expected case
                       $old !== $kids[i]
                    ) {
                        if (!(map[id = getElementId($old)])) {
                            map[id] = true;
                            if ((idx = indexOf($kids, $old, i)) === -1) {
                                if (config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: old.node,
                                        removedNodes: [$old],
                                        nextSibling: $oldkids[j + 1], // praise no indexoutofbounds exception
                                        previousSibling: $oldkids[j - 1]
                                    }));
                                    numAddedNodes--;
                                }
                            } else {
                                conflicts.push({
                                    i: idx,
                                    j: j
                                });
                            }
                        }
                        j++;
                    }
                }// end uncommon case
            }// end loop

            // resolve any remaining conflicts
            if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);
        }
        findMutations($target, $oldstate);
        return dirty;
    }

    /**
     * Utility
     * Cones a element into a custom data structure designed for comparision. https://gist.github.com/megawac/8201012
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     * @return {!Object} : Cloned data structure
     */
    function clone($target, config) {
        var recurse = true; // set true so childList we'll always check the first level
        return (function copy($target) {
            var elestruct = {
                /** @type {Node} */
                node: $target
            };

            // Store current character data of target text or comment node if the config requests
            // those properties to be observed.
            if (config.charData && ($target.nodeType === 3 || $target.nodeType === 8)) {
                elestruct.charData = $target.nodeValue;
            }
            // its either a element, comment, doc frag or document node
            else {
                // Add attr only if subtree is specified or top level and avoid if
                // attributes is a document object (#13).
                if (config.attr && recurse && $target.nodeType === 1) {
                    /**
                     * clone live attribute list to an object structure {name: val}
                     * @type {Object.<string, string>}
                     */
                    elestruct.attr = reduce($target.attributes, function(memo, attr) {
                        if (!config.afilter || config.afilter[attr.name]) {
                            memo[attr.name] = attr.value;
                        }
                        return memo;
                    }, {});
                }

                // whether we should iterate the children of $target node
                if (recurse && ((config.kids || config.charData) || (config.attr && config.descendents)) ) {
                    /** @type {Array.<!Object>} : Array of custom clone */
                    elestruct.kids = map($target.childNodes, copy);
                }

                recurse = config.descendents;
            }
            return elestruct;
        })($target);
    }

    /**
     * indexOf an element in a collection of custom nodes
     *
     * @param {NodeList} set
     * @param {!Object} $node : A custom cloned node
     * @param {number} idx : index to start the loop
     * @return {number}
     */
    function indexOfCustomNode(set, $node, idx) {
        return indexOf(set, $node, idx, JSCompiler_renameProperty("node"));
    }

    // using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
    var counter = 1; // don't use 0 as id (falsy)
    /** @const */
    var expando = "mo_id";

    /**
     * Attempt to uniquely id an element for hashing. We could optimize this for legacy browsers but it hopefully wont be called enough to be a concern
     *
     * @param {Node} $ele
     * @return {(string|number)}
     */
    function getElementId($ele) {
        try {
            return $ele.id || ($ele[expando] = $ele[expando] || counter++);
        } catch (o_O) { // ie <8 will throw if you set an unknown property on a text node
            try {
                return $ele.nodeValue; // naive
            } catch (shitie) { // when text node is removed: https://gist.github.com/megawac/8355978 :(
                return counter++;
            }
        }
    }

    /**
     * **map** Apply a mapping function to each item of a set
     * @param {Array|NodeList} set
     * @param {Function} iterator
     */
    function map(set, iterator) {
        var results = [];
        for (var index = 0; index < set.length; index++) {
            results[index] = iterator(set[index], index, set);
        }
        return results;
    }

    /**
     * **Reduce** builds up a single result from a list of values
     * @param {Array|NodeList|NamedNodeMap} set
     * @param {Function} iterator
     * @param {*} [memo] Initial value of the memo.
     */
    function reduce(set, iterator, memo) {
        for (var index = 0; index < set.length; index++) {
            memo = iterator(memo, set[index], index, set);
        }
        return memo;
    }

    /**
     * **indexOf** find index of item in collection.
     * @param {Array|NodeList} set
     * @param {Object} item
     * @param {number} idx
     * @param {string} [prop] Property on set item to compare to item
     */
    function indexOf(set, item, idx, prop) {
        for (/*idx = ~~idx*/; idx < set.length; idx++) {// start idx is always given as this is internal
            if ((prop ? set[idx][prop] : set[idx]) === item) return idx;
        }
        return -1;
    }

    /**
     * @param {Object} obj
     * @param {(string|number)} prop
     * @return {boolean}
     */
    function has(obj, prop) {
        return obj[prop] !== undefined; // will be nicely inlined by gcc
    }

    // GCC hack see http:// stackoverflow.com/a/23202438/1517919
    function JSCompiler_renameProperty(a) {
        return a;
    }

    return MutationObserver;
})(void 0);

// Copyright 2011 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MutationObserverCtor;
if (typeof WebKitMutationObserver !== 'undefined')
    MutationObserverCtor = WebKitMutationObserver;
else
    MutationObserverCtor = MutationObserver;

if (MutationObserverCtor === undefined) {
    console.error('DOM Mutation Observers are required.');
    console.error('https://developer.mozilla.org/en-US/docs/DOM/MutationObserver');
    throw Error('DOM Mutation Observers are required');
}

var NodeMap = (function () {
    function NodeMap() {
        this.nodes = [];
        this.values = [];
    }
    NodeMap.prototype.isIndex = function (s) {
        return +s === s >>> 0;
    };

    NodeMap.prototype.nodeId = function (node) {
        var id = node[NodeMap.ID_PROP];
        if (!id)
            id = node[NodeMap.ID_PROP] = NodeMap.nextId_++;
        return id;
    };

    NodeMap.prototype.set = function (node, value) {
        var id = this.nodeId(node);
        this.nodes[id] = node;
        this.values[id] = value;
    };

    NodeMap.prototype.get = function (node) {
        var id = this.nodeId(node);
        return this.values[id];
    };

    NodeMap.prototype.has = function (node) {
        return this.nodeId(node) in this.nodes;
    };

    NodeMap.prototype.delete = function (node) {
        var id = this.nodeId(node);
        delete this.nodes[id];
        this.values[id] = undefined;
    };

    NodeMap.prototype.keys = function () {
        var nodes = [];
        for (var id in this.nodes) {
            if (!this.isIndex(id))
                continue;
            nodes.push(this.nodes[id]);
        }

        return nodes;
    };
    NodeMap.ID_PROP = '__mutation_summary_node_map_id__';
    NodeMap.nextId_ = 1;
    return NodeMap;
})();

function NodeIdMap(){
    NodeMap.call(this);
    this.byId = {}; // Id -> Node
}
NodeIdMap.prototype = new NodeMap();
NodeIdMap.prototype.delete = function(node) {
    var id = this.get(node);
    if(id){
        NodeMap.prototype.delete.call(this, node);
        delete this.byId[id];
    }
};
NodeIdMap.prototype.set = function(node, id) {
    NodeMap.prototype.set.call(this, node, id);
    this.byId[id] = node;
};
/**
*  var reachableMatchableProduct = [
*  //  STAYED_OUT,  ENTERED,     STAYED_IN,   EXITED
*    [ STAYED_OUT,  STAYED_OUT,  STAYED_OUT,  STAYED_OUT ], // STAYED_OUT
*    [ STAYED_OUT,  ENTERED,     ENTERED,     STAYED_OUT ], // ENTERED
*    [ STAYED_OUT,  ENTERED,     STAYED_IN,   EXITED     ], // STAYED_IN
*    [ STAYED_OUT,  STAYED_OUT,  EXITED,      EXITED     ]  // EXITED
*  ];
*/
var Movement;
(function (Movement) {
    Movement[Movement["STAYED_OUT"] = 0] = "STAYED_OUT";
    Movement[Movement["ENTERED"] = 1] = "ENTERED";
    Movement[Movement["STAYED_IN"] = 2] = "STAYED_IN";
    Movement[Movement["REPARENTED"] = 3] = "REPARENTED";
    Movement[Movement["REORDERED"] = 4] = "REORDERED";
    Movement[Movement["EXITED"] = 5] = "EXITED";
})(Movement || (Movement = {}));

function enteredOrExited(changeType) {
    return changeType === 1 /* ENTERED */ || changeType === 5 /* EXITED */;
}

var NodeChange = (function () {
    function NodeChange(node, childList, attributes, characterData, oldParentNode, added, attributeOldValues, characterDataOldValue) {
        if (typeof childList === "undefined") { childList = false; }
        if (typeof attributes === "undefined") { attributes = false; }
        if (typeof characterData === "undefined") { characterData = false; }
        if (typeof oldParentNode === "undefined") { oldParentNode = null; }
        if (typeof added === "undefined") { added = false; }
        if (typeof attributeOldValues === "undefined") { attributeOldValues = null; }
        if (typeof characterDataOldValue === "undefined") { characterDataOldValue = null; }
        this.node = node;
        this.childList = childList;
        this.attributes = attributes;
        this.characterData = characterData;
        this.oldParentNode = oldParentNode;
        this.added = added;
        this.attributeOldValues = attributeOldValues;
        this.characterDataOldValue = characterDataOldValue;
        this.isCaseInsensitive = this.node.nodeType === Node.ELEMENT_NODE && this.node instanceof HTMLElement && this.node.ownerDocument instanceof HTMLDocument;
    }
    NodeChange.prototype.getAttributeOldValue = function (name) {
        if (!this.attributeOldValues)
            return undefined;
        if (this.isCaseInsensitive)
            name = name.toLowerCase();
        return this.attributeOldValues[name];
    };

    NodeChange.prototype.getAttributeNamesMutated = function () {
        var names = [];
        if (!this.attributeOldValues)
            return names;
        for (var name in this.attributeOldValues) {
            names.push(name);
        }
        return names;
    };

    NodeChange.prototype.attributeMutated = function (name, oldValue) {
        this.attributes = true;
        this.attributeOldValues = this.attributeOldValues || {};

        if (name in this.attributeOldValues)
            return;

        this.attributeOldValues[name] = oldValue;
    };

    NodeChange.prototype.characterDataMutated = function (oldValue) {
        if (this.characterData)
            return;
        this.characterData = true;
        this.characterDataOldValue = oldValue;
    };

    // Note: is it possible to receive a removal followed by a removal. This
    // can occur if the removed node is added to an non-observed node, that
    // node is added to the observed area, and then the node removed from
    // it.
    NodeChange.prototype.removedFromParent = function (parent) {
        this.childList = true;
        if (this.added || this.oldParentNode)
            this.added = false;
        else
            this.oldParentNode = parent;
    };

    NodeChange.prototype.insertedIntoParent = function () {
        this.childList = true;
        this.added = true;
    };

    // An node's oldParent is
    //   -its present parent, if its parentNode was not changed.
    //   -null if the first thing that happened to it was an add.
    //   -the node it was removed from if the first thing that happened to it
    //      was a remove.
    NodeChange.prototype.getOldParent = function () {
        if (this.childList) {
            if (this.oldParentNode)
                return this.oldParentNode;
            if (this.added)
                return null;
        }

        return this.node.parentNode;
    };
    return NodeChange;
})();

var ChildListChange = (function () {
    function ChildListChange() {
        this.added = new NodeMap();
        this.removed = new NodeMap();
        this.maybeMoved = new NodeMap();
        this.oldPrevious = new NodeMap();
        this.moved = undefined;
    }
    return ChildListChange;
})();

var TreeChanges = (function (_super) {
    __extends(TreeChanges, _super);
    function TreeChanges(rootNode, mutations) {
        _super.call(this);

        this.rootNode = rootNode;
        this.reachableCache = undefined;
        this.wasReachableCache = undefined;
        this.anyParentsChanged = false;
        this.anyAttributesChanged = false;
        this.anyCharacterDataChanged = false;

        for (var m = 0; m < mutations.length; m++) {
            var mutation = mutations[m];
            switch (mutation.type) {
                case 'childList':
                    this.anyParentsChanged = true;
                    for (var i = 0; i < mutation.removedNodes.length; i++) {
                        var node = mutation.removedNodes[i];
                        this.getChange(node).removedFromParent(mutation.target);
                    }
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        this.getChange(node).insertedIntoParent();
                    }
                    break;

                case 'attributes':
                    this.anyAttributesChanged = true;
                    var change = this.getChange(mutation.target);
                    change.attributeMutated(mutation.attributeName, mutation.oldValue);
                    break;

                case 'characterData':
                    this.anyCharacterDataChanged = true;
                    var change = this.getChange(mutation.target);
                    change.characterDataMutated(mutation.oldValue);
                    break;
            }
        }
    }
    TreeChanges.prototype.getChange = function (node) {
        var change = this.get(node);
        if (!change) {
            change = new NodeChange(node);
            this.set(node, change);
        }
        return change;
    };

    TreeChanges.prototype.getOldParent = function (node) {
        var change = this.get(node);
        return change ? change.getOldParent() : node.parentNode;
    };

    TreeChanges.prototype.getIsReachable = function (node) {
        if (node === this.rootNode)
            return true;
        if (!node)
            return false;

        this.reachableCache = this.reachableCache || new NodeMap();
        var isReachable = this.reachableCache.get(node);
        if (isReachable === undefined) {
            isReachable = this.getIsReachable(node.parentNode);
            this.reachableCache.set(node, isReachable);
        }
        return isReachable;
    };

    // A node wasReachable if its oldParent wasReachable.
    TreeChanges.prototype.getWasReachable = function (node) {
        if (node === this.rootNode)
            return true;
        if (!node)
            return false;

        this.wasReachableCache = this.wasReachableCache || new NodeMap();
        var wasReachable = this.wasReachableCache.get(node);
        if (wasReachable === undefined) {
            wasReachable = this.getWasReachable(this.getOldParent(node));
            this.wasReachableCache.set(node, wasReachable);
        }
        return wasReachable;
    };

    TreeChanges.prototype.reachabilityChange = function (node) {
        if (this.getIsReachable(node)) {
            return this.getWasReachable(node) ? 2 /* STAYED_IN */ : 1 /* ENTERED */;
        }

        return this.getWasReachable(node) ? 5 /* EXITED */ : 0 /* STAYED_OUT */;
    };
    return TreeChanges;
})(NodeMap);

var MutationProjection = (function () {
    // TOOD(any)
    function MutationProjection(rootNode, mutations, selectors, calcReordered, calcOldPreviousSibling) {
        this.rootNode = rootNode;
        this.mutations = mutations;
        this.selectors = selectors;
        this.calcReordered = calcReordered;
        this.calcOldPreviousSibling = calcOldPreviousSibling;
        this.treeChanges = new TreeChanges(rootNode, mutations);
        this.entered = [];
        this.exited = [];
        this.stayedIn = new NodeMap();
        this.visited = new NodeMap();
        this.childListChangeMap = undefined;
        this.characterDataOnly = undefined;
        this.matchCache = undefined;

        this.processMutations();
    }
    MutationProjection.prototype.processMutations = function () {
        if (!this.treeChanges.anyParentsChanged && !this.treeChanges.anyAttributesChanged)
            return;

        var changedNodes = this.treeChanges.keys();
        for (var i = 0; i < changedNodes.length; i++) {
            this.visitNode(changedNodes[i], undefined);
        }
    };

    MutationProjection.prototype.visitNode = function (node, parentReachable) {
        if (this.visited.has(node))
            return;

        this.visited.set(node, true);

        var change = this.treeChanges.get(node);
        var reachable = parentReachable;

        // node inherits its parent's reachability change unless
        // its parentNode was mutated.
        if ((change && change.childList) || reachable == undefined)
            reachable = this.treeChanges.reachabilityChange(node);

        if (reachable === 0 /* STAYED_OUT */)
            return;

        // Cache match results for sub-patterns.
        this.matchabilityChange(node);

        if (reachable === 1 /* ENTERED */) {
            this.entered.push(node);
        } else if (reachable === 5 /* EXITED */) {
            this.exited.push(node);
            this.ensureHasOldPreviousSiblingIfNeeded(node);
        } else if (reachable === 2 /* STAYED_IN */) {
            var movement = 2 /* STAYED_IN */;

            if (change && change.childList) {
                if (change.oldParentNode !== node.parentNode) {
                    movement = 3 /* REPARENTED */;
                    this.ensureHasOldPreviousSiblingIfNeeded(node);
                } else if (this.calcReordered && this.wasReordered(node)) {
                    movement = 4 /* REORDERED */;
                }
            }

            this.stayedIn.set(node, movement);
        }

        if (reachable === 2 /* STAYED_IN */)
            return;

        for (var child = node.firstChild; child; child = child.nextSibling) {
            this.visitNode(child, reachable);
        }
    };

    MutationProjection.prototype.ensureHasOldPreviousSiblingIfNeeded = function (node) {
        if (!this.calcOldPreviousSibling)
            return;

        this.processChildlistChanges();

        var parentNode = node.parentNode;
        var nodeChange = this.treeChanges.get(node);
        if (nodeChange && nodeChange.oldParentNode)
            parentNode = nodeChange.oldParentNode;

        var change = this.childListChangeMap.get(parentNode);
        if (!change) {
            change = new ChildListChange();
            this.childListChangeMap.set(parentNode, change);
        }

        if (!change.oldPrevious.has(node)) {
            change.oldPrevious.set(node, node.previousSibling);
        }
    };

    MutationProjection.prototype.getChanged = function (summary, selectors, characterDataOnly) {
        this.selectors = selectors;
        this.characterDataOnly = characterDataOnly;

        for (var i = 0; i < this.entered.length; i++) {
            var node = this.entered[i];
            var matchable = this.matchabilityChange(node);
            if (matchable === 1 /* ENTERED */ || matchable === 2 /* STAYED_IN */)
                summary.added.push(node);
        }

        var stayedInNodes = this.stayedIn.keys();
        for (var i = 0; i < stayedInNodes.length; i++) {
            var node = stayedInNodes[i];
            var matchable = this.matchabilityChange(node);

            if (matchable === 1 /* ENTERED */) {
                summary.added.push(node);
            } else if (matchable === 5 /* EXITED */) {
                summary.removed.push(node);
            } else if (matchable === 2 /* STAYED_IN */ && (summary.reparented || summary.reordered)) {
                var movement = this.stayedIn.get(node);
                if (summary.reparented && movement === 3 /* REPARENTED */)
                    summary.reparented.push(node);
                else if (summary.reordered && movement === 4 /* REORDERED */)
                    summary.reordered.push(node);
            }
        }

        for (var i = 0; i < this.exited.length; i++) {
            var node = this.exited[i];
            var matchable = this.matchabilityChange(node);
            if (matchable === 5 /* EXITED */ || matchable === 2 /* STAYED_IN */)
                summary.removed.push(node);
        }
    };

    MutationProjection.prototype.getOldParentNode = function (node) {
        var change = this.treeChanges.get(node);
        if (change && change.childList)
            return change.oldParentNode ? change.oldParentNode : null;

        var reachabilityChange = this.treeChanges.reachabilityChange(node);
        if (reachabilityChange === 0 /* STAYED_OUT */ || reachabilityChange === 1 /* ENTERED */)
            throw Error('getOldParentNode requested on invalid node.');

        return node.parentNode;
    };

    MutationProjection.prototype.getOldPreviousSibling = function (node) {
        var parentNode = node.parentNode;
        var nodeChange = this.treeChanges.get(node);
        if (nodeChange && nodeChange.oldParentNode)
            parentNode = nodeChange.oldParentNode;

        var change = this.childListChangeMap.get(parentNode);
        if (!change)
            throw Error('getOldPreviousSibling requested on invalid node.');

        return change.oldPrevious.get(node);
    };

    MutationProjection.prototype.getOldAttribute = function (element, attrName) {
        var change = this.treeChanges.get(element);
        if (!change || !change.attributes)
            throw Error('getOldAttribute requested on invalid node.');

        var value = change.getAttributeOldValue(attrName);
        if (value === undefined)
            throw Error('getOldAttribute requested for unchanged attribute name.');

        return value;
    };

    MutationProjection.prototype.attributeChangedNodes = function (includeAttributes) {
        if (!this.treeChanges.anyAttributesChanged)
            return {};

        var attributeFilter;
        var caseInsensitiveFilter;
        if (includeAttributes) {
            attributeFilter = {};
            caseInsensitiveFilter = {};
            for (var i = 0; i < includeAttributes.length; i++) {
                var attrName = includeAttributes[i];
                attributeFilter[attrName] = true;
                caseInsensitiveFilter[attrName.toLowerCase()] = attrName;
            }
        }

        var result = {};
        var nodes = this.treeChanges.keys();

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            var change = this.treeChanges.get(node);
            if (!change.attributes)
                continue;

            if (2 /* STAYED_IN */ !== this.treeChanges.reachabilityChange(node) || 2 /* STAYED_IN */ !== this.matchabilityChange(node)) {
                continue;
            }

            var element = node;
            var changedAttrNames = change.getAttributeNamesMutated();
            for (var j = 0; j < changedAttrNames.length; j++) {
                var attrName = changedAttrNames[j];

                if (attributeFilter && !attributeFilter[attrName] && !(change.isCaseInsensitive && caseInsensitiveFilter[attrName])) {
                    continue;
                }

                var oldValue = change.getAttributeOldValue(attrName);
                if (oldValue === element.getAttribute(attrName))
                    continue;

                if (caseInsensitiveFilter && change.isCaseInsensitive)
                    attrName = caseInsensitiveFilter[attrName];

                result[attrName] = result[attrName] || [];
                result[attrName].push(element);
            }
        }

        return result;
    };

    MutationProjection.prototype.getOldCharacterData = function (node) {
        var change = this.treeChanges.get(node);
        if (!change || !change.characterData)
            throw Error('getOldCharacterData requested on invalid node.');

        return change.characterDataOldValue;
    };

    MutationProjection.prototype.getCharacterDataChanged = function () {
        if (!this.treeChanges.anyCharacterDataChanged)
            return [];

        var nodes = this.treeChanges.keys();
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var target = nodes[i];
            if (2 /* STAYED_IN */ !== this.treeChanges.reachabilityChange(target))
                continue;

            var change = this.treeChanges.get(target);
            if (!change.characterData || target.textContent == change.characterDataOldValue)
                continue;

            result.push(target);
        }

        return result;
    };

    MutationProjection.prototype.computeMatchabilityChange = function (selector, el) {
        if (!this.matchCache)
            this.matchCache = [];
        if (!this.matchCache[selector.uid])
            this.matchCache[selector.uid] = new NodeMap();

        var cache = this.matchCache[selector.uid];
        var result = cache.get(el);
        if (result === undefined) {
            result = selector.matchabilityChange(el, this.treeChanges.get(el));
            cache.set(el, result);
        }
        return result;
    };

    MutationProjection.prototype.matchabilityChange = function (node) {
        var _this = this;
        // TODO(rafaelw): Include PI, CDATA?
        // Only include text nodes.
        if (this.characterDataOnly) {
            switch (node.nodeType) {
                case Node.COMMENT_NODE:
                case Node.TEXT_NODE:
                    return 2 /* STAYED_IN */;
                default:
                    return 0 /* STAYED_OUT */;
            }
        }

        // No element filter. Include all nodes.
        if (!this.selectors)
            return 2 /* STAYED_IN */;

        // Element filter. Exclude non-elements.
        if (node.nodeType !== Node.ELEMENT_NODE)
            return 0 /* STAYED_OUT */;

        var el = node;

        var matchChanges = this.selectors.map(function (selector) {
            return _this.computeMatchabilityChange(selector, el);
        });

        var accum = 0 /* STAYED_OUT */;
        var i = 0;

        while (accum !== 2 /* STAYED_IN */ && i < matchChanges.length) {
            switch (matchChanges[i]) {
                case 2 /* STAYED_IN */:
                    accum = 2 /* STAYED_IN */;
                    break;
                case 1 /* ENTERED */:
                    if (accum === 5 /* EXITED */)
                        accum = 2 /* STAYED_IN */;
                    else
                        accum = 1 /* ENTERED */;
                    break;
                case 5 /* EXITED */:
                    if (accum === 1 /* ENTERED */)
                        accum = 2 /* STAYED_IN */;
                    else
                        accum = 5 /* EXITED */;
                    break;
            }

            i++;
        }

        return accum;
    };

    MutationProjection.prototype.getChildlistChange = function (el) {
        var change = this.childListChangeMap.get(el);
        if (!change) {
            change = new ChildListChange();
            this.childListChangeMap.set(el, change);
        }

        return change;
    };

    MutationProjection.prototype.processChildlistChanges = function () {
        if (this.childListChangeMap)
            return;

        this.childListChangeMap = new NodeMap();

        for (var i = 0; i < this.mutations.length; i++) {
            var mutation = this.mutations[i];
            if (mutation.type != 'childList')
                continue;

            if (this.treeChanges.reachabilityChange(mutation.target) !== 2 /* STAYED_IN */ && !this.calcOldPreviousSibling)
                continue;

            var change = this.getChildlistChange(mutation.target);

            var oldPrevious = mutation.previousSibling;

            function recordOldPrevious(node, previous) {
                if (!node || change.oldPrevious.has(node) || change.added.has(node) || change.maybeMoved.has(node))
                    return;

                if (previous && (change.added.has(previous) || change.maybeMoved.has(previous)))
                    return;

                change.oldPrevious.set(node, previous);
            }

            for (var j = 0; j < mutation.removedNodes.length; j++) {
                var node = mutation.removedNodes[j];
                recordOldPrevious(node, oldPrevious);

                if (change.added.has(node)) {
                    change.added.delete(node);
                } else {
                    change.removed.set(node, true);
                    change.maybeMoved.delete(node);
                }

                oldPrevious = node;
            }

            recordOldPrevious(mutation.nextSibling, oldPrevious);

            for (var j = 0; j < mutation.addedNodes.length; j++) {
                var node = mutation.addedNodes[j];
                if (change.removed.has(node)) {
                    change.removed.delete(node);
                    change.maybeMoved.set(node, true);
                } else {
                    change.added.set(node, true);
                }
            }
        }
    };

    MutationProjection.prototype.wasReordered = function (node) {
        if (!this.treeChanges.anyParentsChanged)
            return false;

        this.processChildlistChanges();

        var parentNode = node.parentNode;
        var nodeChange = this.treeChanges.get(node);
        if (nodeChange && nodeChange.oldParentNode)
            parentNode = nodeChange.oldParentNode;

        var change = this.childListChangeMap.get(parentNode);
        if (!change)
            return false;

        if (change.moved)
            return change.moved.get(node);

        change.moved = new NodeMap();
        var pendingMoveDecision = new NodeMap();

        function isMoved(node) {
            if (!node)
                return false;
            if (!change.maybeMoved.has(node))
                return false;

            var didMove = change.moved.get(node);
            if (didMove !== undefined)
                return didMove;

            if (pendingMoveDecision.has(node)) {
                didMove = true;
            } else {
                pendingMoveDecision.set(node, true);
                didMove = getPrevious(node) !== getOldPrevious(node);
            }

            if (pendingMoveDecision.has(node)) {
                pendingMoveDecision.delete(node);
                change.moved.set(node, didMove);
            } else {
                didMove = change.moved.get(node);
            }

            return didMove;
        }

        var oldPreviousCache = new NodeMap();
        function getOldPrevious(node) {
            var oldPrevious = oldPreviousCache.get(node);
            if (oldPrevious !== undefined)
                return oldPrevious;

            oldPrevious = change.oldPrevious.get(node);
            while (oldPrevious && (change.removed.has(oldPrevious) || isMoved(oldPrevious))) {
                oldPrevious = getOldPrevious(oldPrevious);
            }

            if (oldPrevious === undefined)
                oldPrevious = node.previousSibling;
            oldPreviousCache.set(node, oldPrevious);

            return oldPrevious;
        }

        var previousCache = new NodeMap();
        function getPrevious(node) {
            if (previousCache.has(node))
                return previousCache.get(node);

            var previous = node.previousSibling;
            while (previous && (change.added.has(previous) || isMoved(previous)))
                previous = previous.previousSibling;

            previousCache.set(node, previous);
            return previous;
        }

        change.maybeMoved.keys().forEach(isMoved);
        return change.moved.get(node);
    };
    return MutationProjection;
})();

var Summary = (function () {
    function Summary(projection, query) {
        var _this = this;
        this.projection = projection;
        this.added = [];
        this.removed = [];
        this.reparented = query.all || query.element ? [] : undefined;
        this.reordered = query.all ? [] : undefined;

        projection.getChanged(this, query.elementFilter, query.characterData);

        if (query.all || query.attribute || query.attributeList) {
            var filter = query.attribute ? [query.attribute] : query.attributeList;
            var attributeChanged = projection.attributeChangedNodes(filter);

            if (query.attribute) {
                this.valueChanged = attributeChanged[query.attribute] || [];
            } else {
                this.attributeChanged = attributeChanged;
                if (query.attributeList) {
                    query.attributeList.forEach(function (attrName) {
                        if (!_this.attributeChanged.hasOwnProperty(attrName))
                            _this.attributeChanged[attrName] = [];
                    });
                }
            }
        }

        if (query.all || query.characterData) {
            var characterDataChanged = projection.getCharacterDataChanged();

            if (query.characterData)
                this.valueChanged = characterDataChanged;
            else
                this.characterDataChanged = characterDataChanged;
        }

        if (this.reordered)
            this.getOldPreviousSibling = projection.getOldPreviousSibling.bind(projection);
    }
    Summary.prototype.getOldParentNode = function (node) {
        return this.projection.getOldParentNode(node);
    };

    Summary.prototype.getOldAttribute = function (node, name) {
        return this.projection.getOldAttribute(node, name);
    };

    Summary.prototype.getOldCharacterData = function (node) {
        return this.projection.getOldCharacterData(node);
    };

    Summary.prototype.getOldPreviousSibling = function (node) {
        return this.projection.getOldPreviousSibling(node);
    };
    return Summary;
})();

// TODO(rafaelw): Allow ':' and '.' as valid name characters.
var validNameInitialChar = /[a-zA-Z_]+/;
var validNameNonInitialChar = /[a-zA-Z0-9_\-]+/;

// TODO(rafaelw): Consider allowing backslash in the attrValue.
// TODO(rafaelw): There's got a to be way to represent this state machine
// more compactly???
function escapeQuotes(value) {
    return '"' + value.replace(/"/, '\\\"') + '"';
}

var Qualifier = (function () {
    function Qualifier() {
    }
    Qualifier.prototype.matches = function (oldValue) {
        if (oldValue === null)
            return false;

        if (this.attrValue === undefined)
            return true;

        if (!this.contains)
            return this.attrValue == oldValue;

        var tokens = oldValue.split(' ');
        for (var i = 0; i < tokens.length; i++) {
            if (this.attrValue === tokens[i])
                return true;
        }

        return false;
    };

    Qualifier.prototype.toString = function () {
        if (this.attrName === 'class' && this.contains)
            return '.' + this.attrValue;

        if (this.attrName === 'id' && !this.contains)
            return '#' + this.attrValue;

        if (this.contains)
            return '[' + this.attrName + '~=' + escapeQuotes(this.attrValue) + ']';

        if ('attrValue' in this)
            return '[' + this.attrName + '=' + escapeQuotes(this.attrValue) + ']';

        return '[' + this.attrName + ']';
    };
    return Qualifier;
})();

var Selector = (function () {
    function Selector() {
        this.uid = Selector.nextUid++;
        this.qualifiers = [];
    }
    Object.defineProperty(Selector.prototype, "caseInsensitiveTagName", {
        get: function () {
            return this.tagName.toUpperCase();
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Selector.prototype, "selectorString", {
        get: function () {
            return this.tagName + this.qualifiers.join('');
        },
        enumerable: true,
        configurable: true
    });

    Selector.prototype.isMatching = function (el) {
        return el[Selector.matchesSelector](this.selectorString);
    };

    Selector.prototype.wasMatching = function (el, change, isMatching) {
        if (!change || !change.attributes)
            return isMatching;

        var tagName = change.isCaseInsensitive ? this.caseInsensitiveTagName : this.tagName;
        if (tagName !== '*' && tagName !== el.tagName)
            return false;

        var attributeOldValues = [];
        var anyChanged = false;
        for (var i = 0; i < this.qualifiers.length; i++) {
            var qualifier = this.qualifiers[i];
            var oldValue = change.getAttributeOldValue(qualifier.attrName);
            attributeOldValues.push(oldValue);
            anyChanged = anyChanged || (oldValue !== undefined);
        }

        if (!anyChanged)
            return isMatching;

        for (var i = 0; i < this.qualifiers.length; i++) {
            var qualifier = this.qualifiers[i];
            var oldValue = attributeOldValues[i];
            if (oldValue === undefined)
                oldValue = el.getAttribute(qualifier.attrName);
            if (!qualifier.matches(oldValue))
                return false;
        }

        return true;
    };

    Selector.prototype.matchabilityChange = function (el, change) {
        var isMatching = this.isMatching(el);
        if (isMatching)
            return this.wasMatching(el, change, isMatching) ? 2 /* STAYED_IN */ : 1 /* ENTERED */;
        else
            return this.wasMatching(el, change, isMatching) ? 5 /* EXITED */ : 0 /* STAYED_OUT */;
    };

    Selector.parseSelectors = function (input) {
        var selectors = [];
        var currentSelector;
        var currentQualifier;

        function newSelector() {
            if (currentSelector) {
                if (currentQualifier) {
                    currentSelector.qualifiers.push(currentQualifier);
                    currentQualifier = undefined;
                }

                selectors.push(currentSelector);
            }
            currentSelector = new Selector();
        }

        function newQualifier() {
            if (currentQualifier)
                currentSelector.qualifiers.push(currentQualifier);

            currentQualifier = new Qualifier();
        }

        var WHITESPACE = /\s/;
        var valueQuoteChar;
        var SYNTAX_ERROR = 'Invalid or unsupported selector syntax.';

        var SELECTOR = 1;
        var TAG_NAME = 2;
        var QUALIFIER = 3;
        var QUALIFIER_NAME_FIRST_CHAR = 4;
        var QUALIFIER_NAME = 5;
        var ATTR_NAME_FIRST_CHAR = 6;
        var ATTR_NAME = 7;
        var EQUIV_OR_ATTR_QUAL_END = 8;
        var EQUAL = 9;
        var ATTR_QUAL_END = 10;
        var VALUE_FIRST_CHAR = 11;
        var VALUE = 12;
        var QUOTED_VALUE = 13;
        var SELECTOR_SEPARATOR = 14;

        var state = SELECTOR;
        var i = 0;
        while (i < input.length) {
            var c = input[i++];

            switch (state) {
                case SELECTOR:
                    if (c.match(validNameInitialChar)) {
                        newSelector();
                        currentSelector.tagName = c;
                        state = TAG_NAME;
                        break;
                    }

                    if (c == '*') {
                        newSelector();
                        currentSelector.tagName = '*';
                        state = QUALIFIER;
                        break;
                    }

                    if (c == '.') {
                        newSelector();
                        newQualifier();
                        currentSelector.tagName = '*';
                        currentQualifier.attrName = 'class';
                        currentQualifier.contains = true;
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '#') {
                        newSelector();
                        newQualifier();
                        currentSelector.tagName = '*';
                        currentQualifier.attrName = 'id';
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '[') {
                        newSelector();
                        newQualifier();
                        currentSelector.tagName = '*';
                        currentQualifier.attrName = '';
                        state = ATTR_NAME_FIRST_CHAR;
                        break;
                    }

                    if (c.match(WHITESPACE))
                        break;

                    throw Error(SYNTAX_ERROR);

                case TAG_NAME:
                    if (c.match(validNameNonInitialChar)) {
                        currentSelector.tagName += c;
                        break;
                    }

                    if (c == '.') {
                        newQualifier();
                        currentQualifier.attrName = 'class';
                        currentQualifier.contains = true;
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '#') {
                        newQualifier();
                        currentQualifier.attrName = 'id';
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '[') {
                        newQualifier();
                        currentQualifier.attrName = '';
                        state = ATTR_NAME_FIRST_CHAR;
                        break;
                    }

                    if (c.match(WHITESPACE)) {
                        state = SELECTOR_SEPARATOR;
                        break;
                    }

                    if (c == ',') {
                        state = SELECTOR;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case QUALIFIER:
                    if (c == '.') {
                        newQualifier();
                        currentQualifier.attrName = 'class';
                        currentQualifier.contains = true;
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '#') {
                        newQualifier();
                        currentQualifier.attrName = 'id';
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '[') {
                        newQualifier();
                        currentQualifier.attrName = '';
                        state = ATTR_NAME_FIRST_CHAR;
                        break;
                    }

                    if (c.match(WHITESPACE)) {
                        state = SELECTOR_SEPARATOR;
                        break;
                    }

                    if (c == ',') {
                        state = SELECTOR;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case QUALIFIER_NAME_FIRST_CHAR:
                    if (c.match(validNameInitialChar)) {
                        currentQualifier.attrValue = c;
                        state = QUALIFIER_NAME;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case QUALIFIER_NAME:
                    if (c.match(validNameNonInitialChar)) {
                        currentQualifier.attrValue += c;
                        break;
                    }

                    if (c == '.') {
                        newQualifier();
                        currentQualifier.attrName = 'class';
                        currentQualifier.contains = true;
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '#') {
                        newQualifier();
                        currentQualifier.attrName = 'id';
                        state = QUALIFIER_NAME_FIRST_CHAR;
                        break;
                    }
                    if (c == '[') {
                        newQualifier();
                        state = ATTR_NAME_FIRST_CHAR;
                        break;
                    }

                    if (c.match(WHITESPACE)) {
                        state = SELECTOR_SEPARATOR;
                        break;
                    }
                    if (c == ',') {
                        state = SELECTOR;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case ATTR_NAME_FIRST_CHAR:
                    if (c.match(validNameInitialChar)) {
                        currentQualifier.attrName = c;
                        state = ATTR_NAME;
                        break;
                    }

                    if (c.match(WHITESPACE))
                        break;

                    throw Error(SYNTAX_ERROR);

                case ATTR_NAME:
                    if (c.match(validNameNonInitialChar)) {
                        currentQualifier.attrName += c;
                        break;
                    }

                    if (c.match(WHITESPACE)) {
                        state = EQUIV_OR_ATTR_QUAL_END;
                        break;
                    }

                    if (c == '~') {
                        currentQualifier.contains = true;
                        state = EQUAL;
                        break;
                    }

                    if (c == '=') {
                        currentQualifier.attrValue = '';
                        state = VALUE_FIRST_CHAR;
                        break;
                    }

                    if (c == ']') {
                        state = QUALIFIER;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case EQUIV_OR_ATTR_QUAL_END:
                    if (c == '~') {
                        currentQualifier.contains = true;
                        state = EQUAL;
                        break;
                    }

                    if (c == '=') {
                        currentQualifier.attrValue = '';
                        state = VALUE_FIRST_CHAR;
                        break;
                    }

                    if (c == ']') {
                        state = QUALIFIER;
                        break;
                    }

                    if (c.match(WHITESPACE))
                        break;

                    throw Error(SYNTAX_ERROR);

                case EQUAL:
                    if (c == '=') {
                        currentQualifier.attrValue = '';
                        state = VALUE_FIRST_CHAR;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);

                case ATTR_QUAL_END:
                    if (c == ']') {
                        state = QUALIFIER;
                        break;
                    }

                    if (c.match(WHITESPACE))
                        break;

                    throw Error(SYNTAX_ERROR);

                case VALUE_FIRST_CHAR:
                    if (c.match(WHITESPACE))
                        break;

                    if (c == '"' || c == "'") {
                        valueQuoteChar = c;
                        state = QUOTED_VALUE;
                        break;
                    }

                    currentQualifier.attrValue += c;
                    state = VALUE;
                    break;

                case VALUE:
                    if (c.match(WHITESPACE)) {
                        state = ATTR_QUAL_END;
                        break;
                    }
                    if (c == ']') {
                        state = QUALIFIER;
                        break;
                    }
                    if (c == "'" || c == '"')
                        throw Error(SYNTAX_ERROR);

                    currentQualifier.attrValue += c;
                    break;

                case QUOTED_VALUE:
                    if (c == valueQuoteChar) {
                        state = ATTR_QUAL_END;
                        break;
                    }

                    currentQualifier.attrValue += c;
                    break;

                case SELECTOR_SEPARATOR:
                    if (c.match(WHITESPACE))
                        break;

                    if (c == ',') {
                        state = SELECTOR;
                        break;
                    }

                    throw Error(SYNTAX_ERROR);
            }
        }

        switch (state) {
            case SELECTOR:
            case TAG_NAME:
            case QUALIFIER:
            case QUALIFIER_NAME:
            case SELECTOR_SEPARATOR:
                // Valid end states.
                newSelector();
                break;
            default:
                throw Error(SYNTAX_ERROR);
        }

        if (!selectors.length)
            throw Error(SYNTAX_ERROR);

        return selectors;
    };
    Selector.nextUid = 1;
    Selector.matchesSelector = (function () {
        var element = document.createElement('div');
        if (typeof element['webkitMatchesSelector'] === 'function')
            return 'webkitMatchesSelector';
        if (typeof element['mozMatchesSelector'] === 'function')
            return 'mozMatchesSelector';
        if (typeof element['msMatchesSelector'] === 'function')
            return 'msMatchesSelector';

        return 'matchesSelector';
    })();
    return Selector;
})();

var attributeFilterPattern = /^([a-zA-Z:_]+[a-zA-Z0-9_\-:\.]*)$/;

function validateAttribute(attribute) {
    if (typeof attribute != 'string')
        throw Error('Invalid request opion. attribute must be a non-zero length string.');

    attribute = attribute.trim();

    if (!attribute)
        throw Error('Invalid request opion. attribute must be a non-zero length string.');

    if (!attribute.match(attributeFilterPattern))
        throw Error('Invalid request option. invalid attribute name: ' + attribute);

    return attribute;
}

function validateElementAttributes(attribs) {
    if (!attribs.trim().length)
        throw Error('Invalid request option: elementAttributes must contain at least one attribute.');

    var lowerAttributes = {};
    var attributes = {};

    var tokens = attribs.split(/\s+/);
    for (var i = 0; i < tokens.length; i++) {
        var name = tokens[i];
        if (!name)
            continue;

        var name = validateAttribute(name);
        var nameLower = name.toLowerCase();
        if (lowerAttributes[nameLower])
            throw Error('Invalid request option: observing multiple case variations of the same attribute is not supported.');

        attributes[name] = true;
        lowerAttributes[nameLower] = true;
    }

    return Object.keys(attributes);
}

function elementFilterAttributes(selectors) {
    var attributes = {};

    selectors.forEach(function (selector) {
        selector.qualifiers.forEach(function (qualifier) {
            attributes[qualifier.attrName] = true;
        });
    });

    return Object.keys(attributes);
}

var MutationSummary = (function () {
    function MutationSummary(opts) {
        var _this = this;
        this.connected = false;
        this.options = MutationSummary.validateOptions(opts);
        this.observerOptions = MutationSummary.createObserverOptions(this.options.queries);
        this.root = this.options.rootNode;
        this.callback = this.options.callback;

        this.elementFilter = Array.prototype.concat.apply([], this.options.queries.map(function (query) {
            return query.elementFilter ? query.elementFilter : [];
        }));
        if (!this.elementFilter.length)
            this.elementFilter = undefined;

        this.calcReordered = this.options.queries.some(function (query) {
            return query.all;
        });

        this.queryValidators = []; // TODO(rafaelw): Shouldn't always define this.
        if (MutationSummary.createQueryValidator) {
            this.queryValidators = this.options.queries.map(function (query) {
                return MutationSummary.createQueryValidator(_this.root, query);
            });
        }

        this.observer = new MutationObserverCtor(function (mutations) {
            _this.observerCallback(mutations);
        });

        this.reconnect();
    }
    MutationSummary.createObserverOptions = function (queries) {
        var observerOptions = {
            childList: true,
            subtree: true
        };

        var attributeFilter;
        function observeAttributes(attributes) {
            if (observerOptions.attributes && !attributeFilter)
                return;

            observerOptions.attributes = true;
            observerOptions.attributeOldValue = true;

            if (!attributes) {
                // observe all.
                attributeFilter = undefined;
                return;
            }

            // add to observed.
            attributeFilter = attributeFilter || {};
            attributes.forEach(function (attribute) {
                attributeFilter[attribute] = true;
                attributeFilter[attribute.toLowerCase()] = true;
            });
        }

        queries.forEach(function (query) {
            if (query.characterData) {
                observerOptions.characterData = true;
                observerOptions.characterDataOldValue = true;
                return;
            }

            if (query.all) {
                observeAttributes();
                observerOptions.characterData = true;
                observerOptions.characterDataOldValue = true;
                return;
            }

            if (query.attribute) {
                observeAttributes([query.attribute.trim()]);
                return;
            }

            var attributes = elementFilterAttributes(query.elementFilter).concat(query.attributeList || []);
            if (attributes.length)
                observeAttributes(attributes);
        });

        if (attributeFilter)
            observerOptions.attributeFilter = Object.keys(attributeFilter);

        return observerOptions;
    };

    MutationSummary.validateOptions = function (options) {
        for (var prop in options) {
            if (!(prop in MutationSummary.optionKeys))
                throw Error('Invalid option: ' + prop);
        }

        if (typeof options.callback !== 'function')
            throw Error('Invalid options: callback is required and must be a function');

        if (!options.queries || !options.queries.length)
            throw Error('Invalid options: queries must contain at least one query request object.');

        var opts = {
            callback: options.callback,
            rootNode: options.rootNode || document,
            observeOwnChanges: !!options.observeOwnChanges,
            oldPreviousSibling: !!options.oldPreviousSibling,
            queries: []
        };

        for (var i = 0; i < options.queries.length; i++) {
            var request = options.queries[i];

            // all
            if (request.all) {
                if (Object.keys(request).length > 1)
                    throw Error('Invalid request option. all has no options.');

                opts.queries.push({ all: true });
                continue;
            }

            // attribute
            if ('attribute' in request) {
                var query = {
                    attribute: validateAttribute(request.attribute)
                };

                query.elementFilter = Selector.parseSelectors('*[' + query.attribute + ']');

                if (Object.keys(request).length > 1)
                    throw Error('Invalid request option. attribute has no options.');

                opts.queries.push(query);
                continue;
            }

            // element
            if ('element' in request) {
                var requestOptionCount = Object.keys(request).length;
                var query = {
                    element: request.element,
                    elementFilter: Selector.parseSelectors(request.element)
                };

                if (request.hasOwnProperty('elementAttributes')) {
                    query.attributeList = validateElementAttributes(request.elementAttributes);
                    requestOptionCount--;
                }

                if (requestOptionCount > 1)
                    throw Error('Invalid request option. element only allows elementAttributes option.');

                opts.queries.push(query);
                continue;
            }

            // characterData
            if (request.characterData) {
                if (Object.keys(request).length > 1)
                    throw Error('Invalid request option. characterData has no options.');

                opts.queries.push({ characterData: true });
                continue;
            }

            throw Error('Invalid request option. Unknown query request.');
        }

        return opts;
    };

    MutationSummary.prototype.createSummaries = function (mutations) {
        if (!mutations || !mutations.length)
            return [];

        var projection = new MutationProjection(this.root, mutations, this.elementFilter, this.calcReordered, this.options.oldPreviousSibling);

        var summaries = [];
        for (var i = 0; i < this.options.queries.length; i++) {
            summaries.push(new Summary(projection, this.options.queries[i]));
        }

        return summaries;
    };

    MutationSummary.prototype.checkpointQueryValidators = function () {
        this.queryValidators.forEach(function (validator) {
            if (validator)
                validator.recordPreviousState();
        });
    };

    MutationSummary.prototype.runQueryValidators = function (summaries) {
        this.queryValidators.forEach(function (validator, index) {
            if (validator)
                validator.validate(summaries[index]);
        });
    };

    MutationSummary.prototype.changesToReport = function (summaries) {
        return summaries.some(function (summary) {
            var summaryProps = [
                'added', 'removed', 'reordered', 'reparented',
                'valueChanged', 'characterDataChanged'];
            if (summaryProps.some(function (prop) {
                return summary[prop] && summary[prop].length;
            }))
                return true;

            if (summary.attributeChanged) {
                var attrNames = Object.keys(summary.attributeChanged);
                var attrsChanged = attrNames.some(function (attrName) {
                    return !!summary.attributeChanged[attrName].length;
                });
                if (attrsChanged)
                    return true;
            }
            return false;
        });
    };

    MutationSummary.prototype.observerCallback = function (mutations) {
        if (!this.options.observeOwnChanges)
            this.observer.disconnect();

        var summaries = this.createSummaries(mutations);
        this.runQueryValidators(summaries);

        if (this.options.observeOwnChanges)
            this.checkpointQueryValidators();

        if (this.changesToReport(summaries))
            this.callback(summaries);

        // disconnect() may have been called during the callback.
        if (!this.options.observeOwnChanges && this.connected) {
            this.checkpointQueryValidators();
            this.observer.observe(this.root, this.observerOptions);
        }
    };

    MutationSummary.prototype.reconnect = function () {
        if (this.connected)
            throw Error('Already connected');

        this.observer.observe(this.root, this.observerOptions);
        this.connected = true;
        this.checkpointQueryValidators();
    };

    MutationSummary.prototype.takeSummaries = function () {
        if (!this.connected)
            throw Error('Not connected');

        var summaries = this.createSummaries(this.observer.takeRecords());
        return this.changesToReport(summaries) ? summaries : undefined;
    };

    MutationSummary.prototype.disconnect = function () {
        var summaries = this.takeSummaries();
        this.observer.disconnect();
        this.connected = false;
        return summaries;
    };
    MutationSummary.NodeMap = NodeMap;
    MutationSummary.NodeIdMap = NodeIdMap;
    MutationSummary.parseElementFilter = Selector.parseSelectors;

    MutationSummary.optionKeys = {
        'callback': true,
        'queries': true,
        'rootNode': true,
        'oldPreviousSibling': true,
        'observeOwnChanges': true
    };
    return MutationSummary;
})();


///<reference path='../src/mutation-summary.ts'/>

var TreeMirror = (function () {
    function TreeMirror(root, delegate) {
        this.root = root;
        this.delegate = delegate;
        this.idMap = {};
    }
    TreeMirror.prototype.initialize = function (rootId, children, baseURI) {
        this.baseURI = baseURI;
        this.idMap[rootId] = this.root;

        for (var i = 0; i < children.length; i++)
            this.deserializeNode(children[i], this.root);
    };

    TreeMirror.prototype.applyChanged = function (removed, addedOrMoved, attributes, text) {
        var _this = this;
        // NOTE: Applying the changes can result in an attempting to add a child
        // to a parent which is presently an ancestor of the parent. This can occur
        // based on random ordering of moves. The way we handle this is to first
        // remove all changed nodes from their parents, then apply.
        addedOrMoved.forEach(function (data) {
            var node = _this.deserializeNode(data);
            var parent = _this.deserializeNode(data.parentNode);
            var previous = _this.deserializeNode(data.previousSibling);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        });

        removed.forEach(function (data) {
            var node = _this.deserializeNode(data);
            if (node.parentNode)
                node.parentNode.removeChild(node);
        });

        addedOrMoved.forEach(function (data) {
            var node = _this.deserializeNode(data);
            var parent = _this.deserializeNode(data.parentNode);
            var previous = _this.deserializeNode(data.previousSibling);
            parent.insertBefore(node, previous ? previous.nextSibling : parent.firstChild);
        });

        attributes.forEach(function (data) {
            var node = _this.deserializeNode(data);
            Object.keys(data.attributes).forEach(function (attrName) {
                var newVal = data.attributes[attrName];
                if (newVal === null) {
                    node.removeAttribute(attrName);
                } else {
                    if (!_this.delegate || !_this.delegate.setAttribute || !_this.delegate.setAttribute(node, attrName, newVal)) {
                        node.setAttribute(attrName, newVal);
                    }
                }
            });
        });

        text.forEach(function (data) {
            var node = _this.deserializeNode(data);
            node.textContent = data.textContent;
        });

        removed.forEach(function (node) {
            delete _this.idMap[node.id];
        });
    };

    TreeMirror.prototype.deserializeNode = function (nodeData, parent) {
        var _this = this;
        if (nodeData === null)
            return null;

        var node = this.idMap[nodeData.id];
        if (node)
            return node;

        var doc = this.root.ownerDocument;
        if (doc === null)
            doc = this.root;

        switch (nodeData.nodeType) {
            case Node.COMMENT_NODE:
                node = doc.createComment(nodeData.textContent);
                break;

            case Node.TEXT_NODE:
                node = doc.createTextNode(nodeData.textContent);
                break;

            case Node.DOCUMENT_TYPE_NODE:
                node = doc.implementation.createDocumentType(nodeData.name, nodeData.publicId, nodeData.systemId);
                break;

            case Node.ELEMENT_NODE:
                if (this.delegate && this.delegate.createElement)
                    node = this.delegate.createElement(nodeData.tagName);
                if (!node)
                    node = doc.createElement(nodeData.tagName);
                node.setAttribute('data-tagid', nodeData.id);

                Object.keys(nodeData.attributes).forEach(function (name) {
                    if (!_this.delegate || !_this.delegate.setAttribute || !_this.delegate.setAttribute(node, name, nodeData.attributes[name])) {
                        node.setAttribute(name, nodeData.attributes[name]);
                    }
                });

                break;
        }

        if (!node) {
            throw new Error("No node with id " + nodeData.id);
        }

        this.idMap[nodeData.id] = node;
        node.nodeid = nodeData.id;

        if (parent)
            parent.appendChild(node);

        if (nodeData.childNodes) {
            for (var i = 0; i < nodeData.childNodes.length; i++)
                this.deserializeNode(nodeData.childNodes[i], node);
        }

        return node;
    };
    return TreeMirror;
})();

var URL_ATTRIBUTES = {
    img_src: true,
    link_href: true,
    input_src: true,
    body_background: true,
    table_background: true,
    td_background: true,
    tr_background: true,
    th_background: true,
    tbody_background: true,
    thead_background: true,
    tfoot_background: true,
    col_background: true,
    colgroup_background: true,
    section_background: true,
    head_profile: true,
    html_manifest: true,
    command_icon: true,
    embed_src: true,
    object_data: true,
    video_poster: true,
    iframe_src: true
};
function isUrlAttribute(tagName, attribute) {
    var key = tagName.toLowerCase() + '_' + attribute.toLowerCase();
    return URL_ATTRIBUTES[key] || false;
}

var TreeMirrorClient = (function () {
    function TreeMirrorClient(target, mirror, testingQueries) {
        var _this = this;
        this.target = target;
        this.mirror = mirror;
        this.nextId = 1;
        this.knownNodes = new MutationSummary.NodeIdMap();
        //this.knownNodes = new MutationSummary.NodeMap();

        var rootId = this.serializeNode(target).id;
        var children = [];
        for (var child = target.firstChild; child; child = child.nextSibling)
            children.push(this.serializeNode(child, true));

        this.mirror.initialize(rootId, children, target.baseURI);

        var self = this;

        var queries = [{ all: true }];

        if (testingQueries)
            queries = queries.concat(testingQueries);

        this.mutationSummary = new MutationSummary({
            rootNode: target,
            callback: function (summaries) {
                _this.applyChanged(summaries);
            },
            queries: queries
        });
    }
    TreeMirrorClient.prototype.disconnect = function () {
        if (this.mutationSummary) {
            this.mutationSummary.disconnect();
            this.mutationSummary = undefined;
        }
    };

    TreeMirrorClient.prototype.rememberNode = function (node) {
        var id = this.nextId++;
        this.knownNodes.set(node, id);
        return id;
    };

    TreeMirrorClient.prototype.forgetNode = function (node) {
        this.knownNodes.delete(node);
    };

    TreeMirrorClient.prototype.getAttribute = function (node, attr) {
        var value = node.getAttribute(attr);
        var tagName = node.tagName;

        if(!value) { return value; }

        if(attr === "style"){
            return __portiaApi.processCss(value, node.baseURI);
        } else if (isUrlAttribute(tagName, attr)){
            return __portiaApi.wrapUrl(value, node.baseURI);
        } else if (tagName === 'A' && attr === 'href') {
            return node.href;
        }
        return value;
    };

    TreeMirrorClient.prototype.serializeNode = function (node, recursive) {
        if (node === null)
            return null;

        var id = this.knownNodes.get(node);
        if (id !== undefined) {
            return { id: id };
        }

        var data = {
            nodeType: node.nodeType,
            id: this.rememberNode(node)
        };


        switch (data.nodeType) {
            case Node.DOCUMENT_TYPE_NODE:
                var docType = node;
                data.name = docType.name;
                data.publicId = docType.publicId;
                data.systemId = docType.systemId;
                break;

            case Node.COMMENT_NODE:
            case Node.TEXT_NODE:
                data.textContent = node.textContent;
                if(node.parentNode && node.parentNode.tagName == "STYLE"){
                    data.textContent = __portiaApi.processCss(data.textContent, node.baseURI);
                }
                break;

            case Node.ELEMENT_NODE:
                var elm = node;
                data.tagName = elm.tagName;
                data.attributes = {};
                for (var i = 0; i < elm.attributes.length; i++) {
                    var attr = elm.attributes[i];
                    data.attributes[attr.name] = this.getAttribute(node, attr.name);
                }

                if (recursive && elm.childNodes.length) {
                    data.childNodes = [];

                    for (var child = elm.firstChild; child; child = child.nextSibling)
                        data.childNodes.push(this.serializeNode(child, true));
                }
                break;
        }

        return data;
    };

    TreeMirrorClient.prototype.serializeAddedAndMoved = function (added, reparented, reordered) {
        var _this = this;
        var all = added.concat(reparented).concat(reordered);

        var parentMap = new MutationSummary.NodeMap();

        all.forEach(function (node) {
            var parent = node.parentNode;
            var children = parentMap.get(parent);
            if (!children) {
                children = new MutationSummary.NodeMap();
                parentMap.set(parent, children);
            }

            children.set(node, true);
        });

        var moved = [];

        parentMap.keys().forEach(function (parent) {
            var children = parentMap.get(parent);

            var keys = children.keys();
            while (keys.length) {
                var node = keys[0];
                while (node.previousSibling && children.has(node.previousSibling))
                    node = node.previousSibling;

                while (node && children.has(node)) {
                    var data = _this.serializeNode(node);
                    data.previousSibling = _this.serializeNode(node.previousSibling);
                    data.parentNode = _this.serializeNode(node.parentNode);
                    moved.push(data);
                    children.delete(node);
                    node = node.nextSibling;
                }

                var keys = children.keys();
            }
        });

        return moved;
    };

    TreeMirrorClient.prototype.serializeAttributeChanges = function (attributeChanged) {
        var _this = this;
        var map = new MutationSummary.NodeMap();

        Object.keys(attributeChanged).forEach(function (attrName) {
            attributeChanged[attrName].forEach(function (element) {
                var record = map.get(element);
                if (!record) {
                    record = _this.serializeNode(element);
                    record.attributes = {};
                    map.set(element, record);
                }

                record.attributes[attrName] = _this.getAttribute(element, attrName);
            });
        });

        return map.keys().map(function (node) {
            return map.get(node);
        });
    };

    TreeMirrorClient.prototype.applyChanged = function (summaries) {
        var _this = this;
        var summary = summaries[0];

        var removed = summary.removed.map(function (node) {
            return _this.serializeNode(node);
        });

        var moved = this.serializeAddedAndMoved(summary.added, summary.reparented, summary.reordered);

        var attributes = this.serializeAttributeChanges(summary.attributeChanged);

        var text = summary.characterDataChanged.map(function (node) {
            var data = _this.serializeNode(node);
            data.textContent = node.textContent;
            return data;
        });

        this.mirror.applyChanged(removed, moved, attributes, text);

        summary.removed.forEach(function (node) {
            _this.forgetNode(node);
        });
    };
    return TreeMirrorClient;
})();

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
    if(element.scrollTopMax === 0 && element === document.documentElement){
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

})();