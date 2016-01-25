import Ember from 'ember';

import WebDocument from '../web-document';
import interactionEvent from '../../utils/interaction-event';
import utils from '../../utils/utils';
import { predictCss, matchesExactly } from '../../utils/selector-prediction';

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

function addEmbedBlockedMessage(node) {
    if(!node || !node.parentNode || /EMBED|OBJECT/.test(node.parentNode.tagName)) {
        return;
    }
    var computedStyle = window.getComputedStyle(node);

    var width = node.hasAttribute("width") ? node.getAttribute("width")+"px" : computedStyle.width;
    var height = node.hasAttribute("height") ? node.getAttribute("height")+"px" : computedStyle.height;

    var errorMsg = $("<div/>").css({
        'background-color': '#269',
        'background-image': 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), ' +
                            'linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
        'background-size': '20px 20px, 20px 20px',
        'text-align': "center",
        'overflow': "hidden",
        'font-size': "18px",
        'display': "block",
        'font-family': 'sans-serif',
        'color': 'white',
        'text-shadow': '1px black',
        'width': width,
        'height': height,
        'lineHeight': height,
    }).text("Portia doesn't support browser plugins.");
    node.style.display = "none";
    node.parentNode.insertBefore(errorMsg[0], node);
}

function treeMirrorDelegate(){
    return {
        createElement: function(tagName) {
            var node = null;
            if(tagName === 'SCRIPT' || tagName === 'BASE') {
                node = document.createElement('NOSCRIPT');
            } else {
                try {
                    node = document.createElement(tagName);
                } catch(e) {
                    // Invalid tag name
                    node = document.createElement('NOSCRIPT');
                }
            }
            if(tagName === 'FORM') {
                $(node).on('submit', ()=>false);
            } else if (tagName === 'IFRAME' || tagName === 'FRAME') {
                node.setAttribute('src', '/static/frames-not-supported.html');
            } else if (tagName === 'CANVAS') {
                paintCanvasMessage(node);
            } else if (tagName === 'OBJECT' || tagName === 'EMBED') {
                setTimeout(addEmbedBlockedMessage.bind(null, node), 100);
            }
            return node;
        },
        setAttribute: function(node, attrName, value){
            if(
                /^on/.test(attrName) ||  // Disallow JS attributes
                ((node.tagName === 'FRAME' || node.tagName === 'IFRAME') &&
                (attrName === 'src' || attrName === 'srcdoc')) || // Frames not supported
                ((node.tagName === 'OBJECT' || node.tagName === 'EMBED') &&
                (attrName === 'data' || attrName === 'src')) || // Block embed / object
                (node.tagName === 'META' && attrName === 'http-equiv') // Disallow meta http-equiv
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

export default WebDocument.extend({
    loading: false, // Whatever a page is being loaded at the moment
    currentUrl: "", // Current URL
    currentFp: "",  // Hash of the url.
    mutationsAfterLoaded: 0,

    connect: function() {
        var ws = this.get('ws');

        ws.addCommand('loadStarted', function() {
            this.showLoading(true);
        }.bind(this));

        ws.addCommand('metadata', function(data) {
            this[data.loaded ? 'hideLoading' : 'showLoading']();
            this.set('loading', !data.loaded);
            this.set('currentUrl', data.url);
            this.set('currentFp', data.fp);

            this.sendDocumentEvent('pageMetadata', data);

            Ember.run.next(this, this.redrawNow);
        }.bind(this));

        ws.addCommand('mutation', function(data){
            this.assertInMode('browse');
            data = data._data;
            var action = data[0];
            var args = data.slice(1);
            if(action === 'initialize') {
                this.iframePromise = this.clearIframe().then(function(){
                    this.set('mutationsAfterLoaded', 0);
                    this._updateEventHandlers();
                    var doc = this.getIframeNode().contentWindow.document;
                    this.treeMirror = new TreeMirror(doc, treeMirrorDelegate(this));
                }.bind(this));
            }
            this.iframePromise.then(function() {
                if(action === 'applyChanged') {
                    this.incrementProperty('mutationsAfterLoaded');
                }
                this.treeMirror[action].apply(this.treeMirror, args);
            }.bind(this));
        }.bind(this));

        ws.addCommand('cookies', msg => this.saveCookies(msg._data));
    }.on('init'),

    /**
     * Loads and displays a url interactively
     * Can only be called in "browse" mode.
     */
    loadUrl: function(url, spider, baseurl) {
        this.assertInMode('browse');
        this.set('loading', true);
        this.showLoading(true);
        this.get('ws').send({
            _meta: {
                spider: spider,
                project: this.get('slyd.project'),
                id: utils.shortGuid(),
                viewport: this.iframeSize(),
                user_agent: navigator.userAgent,
                cookies: this.cookies,
            },
            _command: 'load',
            url: url,
            baseurl: baseurl,
        });
    },

    _wsOpenChange: function(){
        this.setInteractionsBlocked(this.get('ws.closed'), 'ws');
    }.observes('ws.closed'),

    /**
        Displays a document by setting it as the content of the iframe.
        readyCallback will be called when the document finishes rendering.

        Only allowed in "select" mode
    */
    displayDocument: function(documentContents, readyCallback) {
        Ember.run.next(() => {
            this.assertInMode('select');
            // We need to disable all interactions with the document we are loading
            // until we trigger the callback.
            this.blockInteractions('loadingDoc');
            this.set('loadingDoc', true);
            this.set('cssEnabled', true);

            this.clearIframe().then(() => {
                var iframeDoc = this.getIframe()[0];
                iframeDoc.open('text/html', 'replace');
                iframeDoc.write(documentContents);
                iframeDoc.close();
                this._updateEventHandlers();
            }).finally(() => {
                this.unblockInteractions('loadingDoc');
                this.set('loadingDoc', false);
                if (readyCallback) {
                    readyCallback(this.getIframe());
                }
            });
        });
    },

    clearIframe: function() {
        var defer = new Ember.RSVP.defer();
        var iframe = this.getIframeNode();
        var id = utils.shortGuid();
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
        this.uninstallEventHandlers();
        var iframe = this.getIframe();
        iframe.on('keyup.portia keydown.portia keypress.portia input.portia ' +
                  'mousedown.portia mouseup.portia', this.postEvent.bind(this));
        iframe.on('click.portia', this.clickHandlerBrowse.bind(this));
        iframe.on('scroll.portia', this.redrawNow.bind(this));
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
        if(evt.which <= 1 && !evt.ctrlKey) { // Ignore right/middle click or Ctrl+click
            if(evt.target.tagName !== 'INPUT') {
                evt.preventDefault();
            }
            this.postEvent(evt);
        }
    },

    postEvent: function(evt){
        var interaction =  interactionEvent(evt);
        if(!interaction) {
            return;
        }
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
        if(!this.get('recording')) {
            return;
        }
        var pageActions = this.get('pageActions');
        var type = interactionEvent.type;

        let typemap = {
            'click': 'click',
            'input': 'set',
            'change': 'set',
            'scroll': 'scroll',
        };

        // Filter actions we are not interested in
        if (!pageActions || !(type in typemap)) {
            return null; // We don't record that kind of actions
        }

        let actionType = typemap[type];

        var target = nativeEvent.target;
        if(target.nodeType === Node.DOCUMENT_NODE){
            target = target.documentElement;
        }
        if ((type === 'click' && $(target).is('option,select,input:text,body,textarea,html')) || // Ignore click events in some elements
            (type === 'change' && !$(target).is('select'))){ // We only care about change events in select elements
            return null;
        }

        var selector = predictCss(matchesExactly($(target)));

        // If we are inputting more text into a field, or changing again a select make it only one interaction
        if((actionType === 'set' || actionType === 'scroll') && pageActions.length){
            var lastAction = pageActions[pageActions.length-1];

            if(lastAction.type === actionType && lastAction.selector === selector && !lastAction._edited){
                if(actionType === 'set') {
                    Ember.set(lastAction, 'value', $(target).val());
                } else if (actionType === 'scroll') {
                    Ember.set(lastAction, 'percent', Math.max(lastAction.percent, interactionEvent.scrollTopPercent));
                }
                return;
            }
        }

        // Record the action
        var action = Ember.Object.create({
            type: actionType,
            selector: selector,
            target: target
        });
        if(actionType === 'set'){
            action.value = $(target).val();
        } else if(actionType === 'scroll') {
            action.percent = interactionEvent.scrollTopPercent;
        }
        pageActions.pushObject(action);
    },

    bindResizeEvent: function() {
        if (!Ember.testing){
            Ember.$(window).on('resize', Ember.run.bind(this, this.handleResize));
        }
    }.on('init'),

    handleResize: function() {
        this.get('ws').send({
            _command: 'resize',
            size: this.iframeSize()
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
