import Ember from 'ember';
import startApp from 'portia-web/tests/helpers/start-app';
import WebDocument from 'portia-web/components/web-document';
import { Canvas } from 'portia-web/utils/canvas';

export default function portiaTest(name, fn) {
    test(name, function(assert) {
        var root = $('<div/>').appendTo(document.body);
        var canvas = $('<canvas/>').attr('id', 'testCanvas_' + Date.now()).appendTo(document.body);
        var app = startApp({
            rootElement: root[0],
            LOG_TRANSITIONS: true, // basic logging of successful transitions
            LOG_TRANSITIONS_INTERNAL: true // detailed logging of all routing steps
        });
        var that = this;
        Ember.run(function() {
            app.setupForTesting();
            app.injectTestHelpers();
            var doc = app.registry.resolve('document:obj');
            WebDocument.create({
                document: doc,
                canvas: Canvas.create({
                    canvasId: canvas.attr('id')
                })
            });
            fn.call(that, app, assert);
            andThen(function() {
                app.destroy();
                root.remove();
                canvas.remove();
            });
        });
    });
}

