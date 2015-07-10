/*global $:false */
/*global TreeMirror:false */
/*global DomPredictionHelper:false */
import Ember from 'ember';

import ApplicationUtils from '../../mixins/application-utils';
import WebDocument from '../web-document';
import interactionEvent from '../../utils/interaction-event';

var predictionHelper = DomPredictionHelper.prototype;

function paintCanvasMessage(canvas) {
    var ctx = canvas.getContext('2d');

    var pattern = document.createElement('canvas');
    pattern.width = 20;
    pattern.height = 20;
    var pctx = pattern.getContext('2d');
    pctx.fillStyle = "#ccc";
    pctx.fillRect(0,0,10,10);
    pctx.fillRect(10,10,10,10);
    pattern = ctx.createPattern(pattern, "repeat");

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText('Displaying the content of the canvas is not supported', 10, canvas.height / 2);
}
function treeMirrorDelegate(){
    return {
        createElement: function(tagName) {
            var node = null;
            if(tagName === 'SCRIPT' || tagName === 'META' || tagName === 'BASE') {
                node = document.createElement('NOSCRIPT');
            } else if(tagName === 'FORM') {
                node = document.createElement(tagName);
                $(node).on('submit', ()=>false);
            } else if (tagName === 'IFRAME' || tagName === 'FRAME') {
                node = document.createElement(tagName);
                node.setAttribute('src', '/static/frames-not-supported.html');
            } else if (tagName === 'CANVAS') {
                node = document.createElement(tagName);
                paintCanvasMessage(node);
            }
            return node;
        },
        setAttribute: function(node, attrName, value){
            if(
                /^on/.test(attrName) ||  // Disallow JS attributes
                ((node.tagName === 'FRAME' || node.tagName === 'IFRAME') &&
                (attrName === 'src' || attrName === 'srcdoc')) // Frames not supported
            ) {
                return true;
            }

            try{
                node.setAttribute(attrName, value);
            }catch(e){
                console.log(e, attrName, value);
            }

            if(node.tagName === 'CANVAS' && (attrName === 'width' || attrName === 'height')) {
                paintCanvasMessage(node);
            }

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
                var pageMap = listener.get('pageMap');
                // Handle page change in browser tab on the server caused by event
                if (!pageMap[data.fp] || data.fp !== listener.get('loadedPageFp')) {
                    pageMap[data.fp] = data;
                    this.installEventHandlersForBrowsing();
                    this.hideLoading();
                    listener.get('browseHistory').pushObject(data.fp);
                    Ember.run.later(this, function() {
                        var doc = this.getIframeNode().contentWindow.document;
                        doc.onscroll = this.redrawNow.bind(this);
                    }, 500);
                }
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
                var listener = this.get('listener');
                if(listener && listener.reload && listener.get('loadedPageFp')) {
                    listener.reload();
                }
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
        // Wait until iframe has fully loaded before setting iframe to the current iframe
        iframe.load(function() {
            this.set('document.iframe', iframe);
        }.bind(this));
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
        iframe.on('keyup.portia keydown.portia keypress.portia input.portia ' +
                  'mousedown.portia mouseup.portia', this.postEvent.bind(this));
        this.addFrameEventListener("scroll", e => Ember.run.throttle(this, this.postEvent, e, 200), true);
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
        if(evt.target.tagName !== 'INPUT') {
            return this._super(evt);
        }
    },

    postEvent: function(evt){
        var interaction =  interactionEvent(evt);
        this.get('ws').send({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            interaction: interaction
        });
        this.saveAction(interaction, evt);
    },

    saveAction: function (interactionEvent, nativeEvent) {
        var pageActions = this.get('pageActions');
        var type = interactionEvent.type;

        // Filter actions we are not interested in
        if (!pageActions || (type !== 'click' && type !== 'input' && type !== 'change')) {
            return null; // We don't record that king of actions
        }
        var target = nativeEvent.target;
        if ((type === 'click' && $(target).is('option,select,input:text,body,textarea,html')) || // Ignore click events in some elements
            (type === 'change' && !$(target).is('select'))){ // We only care about change events in select elements
            return null;
        }

        // If we are inputting more text into a field, or changing again a select make it only one interaction
        if((type === 'input' || type === 'change') && pageActions.length){
            var lastAction = pageActions[pageActions.length-1];
            if(lastAction.type === 'set' && lastAction.target === target && !lastAction._edited){
                lastAction.set('value', $(target).val());
                return;
            }
        }

        // Record the action
        var nonmatches = this.getIframe().find('*').not(target);
        var selector = predictionHelper.predictCss($(target), nonmatches);
        var action = Ember.Object.create({
            type: type === 'click' ? 'click' : 'set',
            selector: selector,
            target: target
        });
        if(action.type === 'set'){
            action.value = $(target).val();
        }
        pageActions.pushObject(action);
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
