import Ember from 'ember';
import startApp from 'portia-web/tests/helpers/start-app';
import WebDocument from 'portia-web/components/web-document-js/component';
import FerryWebsocket from 'portia-web/utils/ferry-websocket';
import { Canvas } from 'portia-web/utils/canvas';
import { lastRequest } from '../helpers/fixtures';

import NotificationManager from 'portia-web/utils/notification-manager';

export default function portiaTest(name, fn) {
    test(name, function(assert) {
        lastRequest.clear();
        var root = $('<div/>').appendTo(document.body);
        var canvas = $('<canvas/>').attr('id', 'testCanvas_' + Date.now()).appendTo(document.body);

        NotificationManager.reopen({
            add: function(obj){
                app.lastNotification = obj;
            }
        });

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
                ws: FerryWebsocket.create({}),
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

