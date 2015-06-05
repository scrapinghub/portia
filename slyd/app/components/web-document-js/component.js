/*global $:false */
/*global TreeMirror:false */
import Ember from 'ember';

import ApplicationUtils from '../../mixins/application-utils';
import WebDocument from '../web-document';
import interactionEvent from '../../utils/interaction-event';

function treeMirrorDelegate(webdoc){
    return {
        createElement: function(tagName) {
            var node = null;
            if(tagName === 'SCRIPT' || tagName === 'META' || tagName === 'BASE') {
                node = document.createElement('NOSCRIPT');
            } else if(tagName === 'HEAD') {
                node = document.createElement('HEAD');
                var base = document.createElement('BASE');
                base.setAttribute('href', webdoc.treeMirror.baseURI);
                node.appendChild(base);
            } else if(tagName === 'FORM') {
                node = document.createElement(tagName);
                $(node).on('submit', ()=>false);
            }
            return node;
        },
        setAttribute: function(node, attrName, value){
            if(/^on/.test(attrName)) {
                return true;
            }
            node.setAttribute(attrName, value);
            return true;
        }
    };
}

export default WebDocument.extend(ApplicationUtils, {
    ws_deferreds: {},
    connect: function() {
        var ws = this.get('ws');

        ws.addCommand('loadStarted', function() {
            this.showLoading(true);
        }.bind(this));

        ws.addCommand('metadata', function(data) {
            if (data.id && this.get('ws_deferreds.' + data.id)) {
                var deferred = this.get('ws_deferreds.' + data.id);
                this.set('ws_deferreds.' + data.id, undefined);
                if (data.error) {
                    deferred.reject(data);
                } else {
                    deferred.resolve(data);
                }
            }
            this[data.loading ? 'showLoading' : 'hideLoading']();

            var listener = this.get('listener');
            if(listener && listener.updateExtractedItems) {
                listener.updateExtractedItems(data.items || []);
                listener.set('followedLinks', data.links || []);
                listener.set('loadedPageFp', data.fp);
            }
            this.set('loadedPageFp', data.fp);
            this.set('followedLinks', data.links);
            this.set('currentUrl', data.url);
            Ember.run.next(this, function() {
                this.redrawNow();
            });
        }.bind(this));

        ws.addCommand('mutation', function(data){
            data = data._data;
            var action = data[0];
            var args = data.slice(1);
            if(action === 'initialize') {
                this.iframePromise = this.clearIframe().then(function(){
                    var doc = this.getIframeNode().contentWindow.document;
                    this.treeMirror = new TreeMirror(doc, treeMirrorDelegate(this));
                }.bind(this));
            }
            this.iframePromise.then(function() {
                this.treeMirror[action].apply(this.treeMirror, args);
            }.bind(this));
        }.bind(this));

        ws.addCommand('cookies', msg => this.saveCookies(msg._data));
    }.on('init'),

    connectionStatusType: 'warning',
    connectionStatusMessage: '',
    reconnectInteractions: null,
    _reconnectClock: function() {
        if (Number(this.get('connectionStatusTime')) >= 2) {
            this.decrementProperty('connectionStatusTime');
            this.set('connectionStatusMessage', 'Reconnecting to server in ' + this.get('connectionStatusTime') + ' seconds.');
            this.set('connectionAction', true);
        } else {
            this.set('connectionStatusMessage', 'Reconnecting...');
            this.set('connectionAction', null);
        }
    },

    connectionLost: function() {
        if (this.get('ws.closed')) {
            Ember.run.later(this, function() {
                this.set('showConnectionLost', true);
            }, 500);
            if (this.get('reconnectInteractions') === null) {
                var reconnect = this.get('canvas._interactionsBlocked');
                this.setInteractionsBlocked(true);
                this.set('reconnectInteractions', reconnect);
            }            this.set('connectionStatusTime', this.get('ws.reconnectTimeout') / 1000);
            this.addObserver('clock.second', this, this._reconnectClock);
        } else {
            this.removeObserver('clock.second', this, this._reconnectClock);
        }
    }.observes('ws.closed'),

    connectionReEstablished: function() {
        if (this.get('ws.opened')) {
            if (this.get('reconnectInteractions') !== null) {
                var reconnect = this.get('reconnectInteractions');
                this.set('reconnectInteractions', null);
                this.setInteractionsBlocked(reconnect);
            }
            this.set('connectionStatusMessage', null);
            this.set('connectionAction', null);
            this.set('showConnectionLost', false);
        }
    }.observes('ws.opened'),

    connectionConnecting: function() {
        if (this.get('ws.connecting')) {
            this.set('connectionStatusMessage', 'Reconnecting...');
            this.set('connectionAction', null);
        }
    }.observes('ws.connecting'),

    fetchDocument: function(url, spider, fp, command) {
        var unique_id = this.shortGuid(),
            deferred = new Ember.RSVP.defer(),
            ifWindow = this.getIframeNode().contentWindow;
        this.set('ws_deferreds.' + unique_id, deferred);
        this.get('ws').send({
            _meta: {
                spider: spider,
                project: this.get('slyd.project'),
                id: unique_id,
                viewport: ifWindow.innerWidth + 'x' + ifWindow.innerHeight,
                user_agent: navigator.userAgent,
                cookies: this.cookies
            },
            _command: command || 'load',
            url: url
        });
        return deferred.promise;
    },

    setInteractionsBlocked: function(blocked) {
        if (this.get('reconnectInteractions') !== null) {
            this.set('reconnectInteractions', blocked);
            return;
        }
        if (this.get('canvas.interactionsBlocked') !== blocked) {
            this.set('canvas.interactionsBlocked', blocked);
        }
    },

    setIframeContent: function(doc) {
        if(typeof doc !== 'string') {
            return;
        }
        var iframe = Ember.$('#' + this.get('iframeId'));
        iframe.attr('srcdoc', doc);
        this.set('document.iframe', iframe);
    },

    clearIframe: function() {
        var defer = new Ember.RSVP.defer();
        var iframe = this.getIframeNode();
        var id = this.shortGuid();
        // Using a empty static page because using srcdoc or an data:uri gives
        // permission problems and/or broken baseURI behaviour in different browsers.
        iframe.setAttribute('src', '/static/empty-frame.html?' + id);
        iframe.removeAttribute('srcdoc');
        // Using a message to workaround onload bug on some browsers (cough IE cough).
        var $win = $(window).bind('message', function onMessage(e){
            if(e.originalEvent.data.frameReady === id){
                $win.unbind('message', onMessage);
                defer.resolve();
            }
        });
        return defer.promise;
    },

    frameEventListeners: [],
    addFrameEventListener: function(event, fn, useCapture=false){
        this.frameEventListeners.push([event, fn, useCapture]);
        this.getIframe()[0].addEventListener(event, fn, useCapture);
    },

    installEventHandlersForBrowsing: function() {
        this._super();
        var iframe = this.getIframe();
        iframe.on('scroll.portia', e => Ember.run.throttle(this, this.postEvent, e, 200));
        iframe.on('keyup.portia keydown.portia keypress.portia input.portia ' +
                  'mousedown.portia mouseup.portia', this.postEvent.bind(this));
        this.addFrameEventListener('focus', this.postEvent.bind(this), true);
        this.addFrameEventListener('blur', this.postEvent.bind(this), true);
        this.addFrameEventListener('change', this.postEvent.bind(this), true);
    },

    uninstallEventHandlers: function(){
        var frameDoc = this.getIframe()[0];
        this.frameEventListeners.forEach(([event, fn, useCapture]) => {
            frameDoc.removeEventListener(event, fn, useCapture);
        });
        this.frameEventListeners = [];
        this._super();
    },

    clickHandlerBrowse: function(evt) {
        if(evt.which > 1 || evt.ctrlKey) { // Ignore right/middle click or Ctrl+click
            return;
        }
        this.postEvent(evt);
        return this._super(evt);
    },

    postEvent: function(event){
        this.get('ws').send({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            interaction: interactionEvent(event)
        });
    },

    bindResizeEvent: function() {
        Ember.$(window).on('resize', Ember.run.bind(this, this.handleResize));
    }.on('init'),

    handleResize: function() {
        var iframe_window = this.getIframeNode().contentWindow;
        this.get('ws').send({
            _command: 'resize',
            size: iframe_window.innerWidth + 'x' + iframe_window.innerHeight
        });
    },

    saveCookies: function(cookies){
        this.cookies = cookies;
        if(window.sessionStorage){
            window.sessionStorage.portia_cookies = JSON.stringify(cookies);
        }
    },
    loadCookies: function(){
        if(window.sessionStorage && sessionStorage.portia_cookies){
            this.cookies = JSON.parse(sessionStorage.portia_cookies);
        }
    }.on('init'),

    actions: {
        reconnectWebsocket: function() {
            this.get('ws').connect();
        }
    }
});
