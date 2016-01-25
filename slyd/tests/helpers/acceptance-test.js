import Ember from 'ember';
import startApp from 'portia-web/tests/helpers/start-app';
import WebDocument from 'portia-web/components/web-document-js/component';
import FerryWebsocket from 'portia-web/utils/ferry-websocket';
import { Canvas } from 'portia-web/utils/canvas';
import { lastRequest } from '../helpers/fixtures';
import NotificationManager from 'portia-web/utils/notification-manager';
import ws from '../helpers/websocket-mock';
import { waitFor } from '../helpers/wait';

var oldSend = FerryWebsocket.create().send;
FerryWebsocket.reopen({
    url: 'ws://localhost:8787/ws',
    send: function(msg) {
        if(msg._command && !/(resize|heartbeat|pause|resume)/.test(msg._command)) {
            ws.lastMessage = msg;
        }
        return oldSend.apply(this, arguments);
    }
});

Ember.assert = function(m, a){
    if(!a) {
        try{
            throw new Error();
        }catch(e){
            m += e.stack;
        }
        throw new Error(m);
    }
};

export default function portiaTest(name, fn) {
    test(name, function(assert) {
        lastRequest.clear();
        var root = $('<div/>').appendTo(document.body);
        var canvas = $('<canvas/>').attr('id', 'testCanvas_' + Date.now()).appendTo(document.body);

        NotificationManager.reopen({
            add: function(obj){
                if(app) app.lastNotification = obj;
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
            Ember.Test.adapter.asyncStart();

            visit('/')
            .then(() => waitFor(function(){
                var doc = app.registry.resolve('document:obj');
                return doc && doc.view && doc.view.ws.get('opened');
            }, 'ws open'))
            .then(function(){
                return fn.call(that, app, assert);
            }).then(function() {
                var doc = app.registry.resolve('document:obj');
                if(doc && doc.view && doc.view.ws) {
                    doc.view.ws.set('deferreds', {});
                    doc.view.ws.close();
                }
                app.destroy();
                root.remove();
                canvas.remove();
                Ember.Test.adapter.asyncEnd();
            });
        });
    });
}

