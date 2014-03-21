document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

ASTool.rootElement = '#ember-testing';
ASTool.setupForTesting();

Ember.Test.registerAsyncHelper('iframeClick', function(app, selector, context) {
    var $el = $('#scraped-doc-iframe').contents().find(selector);
    Ember.run(function() {
        $el.mouseup();
    });
});

Ember.Test.registerAsyncHelper('focus', function(app, selector, context) {
    var $el = $(selector);
    Ember.run(function() {
        $el.focus();
    });
});

Ember.Test.registerAsyncHelper('blur', function(app, selector, context) {
    var $el = $(selector);
    Ember.run(function() {
        $el.blur();
    });
});

Ember.Test.registerAsyncHelper('iframeClick', function(app, selector, context) {
    var $el =$('#scraped-doc-iframe').contents().find(selector);
    Ember.run(function() {
        $el.mouseup();
    });
});

Ember.Test.registerAsyncHelper('sleep', function(app, value) {
    return Ember.Test.promise(function(resolve) {
        Ember.Test.adapter.asyncStart();
        setTimeout(function() {
            Ember.Test.adapter.asyncEnd();
            Em.run(null, resolve, value);
        }, 250);
    });
});


ASTool.injectTestHelpers();

function exists(selector) {
    return !!find(selector).length;
}

function hasAnnotation(annotatedDoc, attribute, field) {
    var pattern = "annotations&quot;:{&quot;" + attribute + "&quot;:&quot;" + field + "&quot;}";
    
    return annotatedDoc.indexOf(pattern) != -1;
}

/* Define Function.prototype.bind in case the installed version of
   PhantomJS does not implement it.
   Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
 */
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

