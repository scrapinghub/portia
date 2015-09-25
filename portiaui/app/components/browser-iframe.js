import Ember from 'ember';
import { cleanUrl, shortGuid } from '../utils/utils';
import interactionEvent from '../utils/interaction-event';
import treeMirrorDelegate from '../utils/tree-mirror-delegate';
import { NAVIGATION_MODE } from '../services/browser';


const BrowserIFrame = Ember.Component.extend({
    browser: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    tagName: 'iframe',

    splashUrl: null,

    disabled: Ember.computed.alias('browser.disabled'),
    document: Ember.computed.alias('browser.document'),
    loading: Ember.computed.alias('browser.loading'),
    url: Ember.computed.readOnly('browser.url'),

    init() {
        this._super();
        this.loadCookies();
        this.frameEventListeners = [];
        let ws = this.get('webSocket');
        ws.addCommand('loadStarted', this.msgLoadStarted.bind(this));
        ws.addCommand('metadata', this.msgMetadata.bind(this));
        ws.addCommand('cookies', this.msgCookies.bind(this));
        ws.addCommand('mutation', this.msgMutation.bind(this));
    },

    click() {
        if (this.attrs.clickHandler) {
            /*
                For some reason, when using Ember.run, if the handler initiates
                a route transition and the page in the iframe has a <base> tag,
                the url is changed to the route uri concatenated to the iframe's
                <base> url.
                Using Ember.run.next fixes this.
             */
            Ember.run.next(this, this.attrs.clickHandler, ...arguments);
        }
    },

    willInsertElement() {
        if (BrowserIFrame.instances) {
            throw new Error('The can be only one browser-iframe instance!');
        }
        BrowserIFrame.instances++;
    },

    didInsertElement() {
        Ember.run.schedule('afterRender', () => {
            this.setProperties({
                disabled: false,
                document: null
            });
            this.loadUrl();
        });
    },

    willDestroyElement() {
        this.setProperties({
            disabled: true,
            document: null
        });
        BrowserIFrame.instances--;
    },

    documentLoaded() {
        this.set('document', this.element.contentDocument);
    },

    /**
     * Loads and displays a url interactively
     * Can only be called in "browse" mode.
     */
    loadUrl: Ember.observer('url', 'webSocket.closed', function() {
        const url = this.get('url');
        let spider, baseurl;  //???

        if (!url || !url.includes('://') || !cleanUrl(url)) {
            return;
        }
        if (this.get('webSocket.closed')) {
            this.splashUrl = null;
            return;
        }
        if (this.splashUrl === url) {
            return;
        }

        this.set('loading', true);
        this.get('webSocket').send({
            _meta: {
                // TODO: Send current project and spider to see followed links and extracted items?
                id: shortGuid(),
                viewport: this.iframeSize(),
                user_agent: navigator.userAgent,
                cookies: this.cookies
            },
            _command: 'load',
            url: url,
            baseurl: baseurl
        });
    }),

    msgLoadStarted() {
        this.set('loading', true);
    },

    msgMetadata(data) {
        if (data.loaded) {
            this.set('loading', false);
        }
        if (data.url) {
            this.splashUrl = data.url;
            this.set('browser.url', data.url);
        }
    },

    msgMutation(data) {
        var [action, ...args] = data._data;
        if(action === 'initialize') {
            this.iframePromise = this.clearIframe().then(() => {
                var doc = this.element.contentDocument;
                this.treeMirror = new TreeMirror(doc, treeMirrorDelegate(this));
            });
        }
        this.iframePromise.then(() => {
            this.treeMirror[action].apply(this.treeMirror, args);
        });
    },

    msgCookies(data) {
        let cookies = data._data;
        this.cookies = cookies;
        if(window.sessionStorage){
            window.sessionStorage.portia_cookies = JSON.stringify(cookies);
        }
    },

    loadCookies(){
        if(window.sessionStorage && sessionStorage.portia_cookies){
            this.cookies = JSON.parse(sessionStorage.portia_cookies);
        }
    },

    unbindEventHandlers() {
        $(this.element.contentDocument).off('.portia-iframe');
        this.frameEventListeners.forEach(([target, event, fn, useCapture]) => {
            target.removeEventListener(event, fn, useCapture);
        });
        this.frameEventListeners = [];
    },

    addFrameEventListener(event, fn, useCapture=false) {
        let frameDoc = this.element.contentDocument;
        frameDoc.addEventListener(event, fn, useCapture);
        this.frameEventListeners.push([frameDoc, event, fn, useCapture]);
    },

    bindEventHandlers() {
        this.unbindEventHandlers();
        var $iframe = $(this.element.contentDocument);
        $iframe.on(
            ['keyup', 'keydown', 'keypress', 'input', 'mousedown', 'mouseup'].map(
                eventName => `${eventName}.portia.portia-iframe`).join(' '),
            e => {
                if (this.get('browser.mode') === NAVIGATION_MODE) {
                    this.postEvent(e);
                }
            });
        $iframe.on('click.portia.portia-iframe', e => {
            if (this.get('browser.mode') === NAVIGATION_MODE) {
                this.clickHandlerBrowse(e);
            } else {
                this.click();
            }
            return false;
        });
        this.addFrameEventListener('focus', this.postEvent.bind(this), true);
        this.addFrameEventListener('blur', this.postEvent.bind(this), true);
        this.addFrameEventListener('change', this.postEvent.bind(this), true);
        this.addFrameEventListener('scroll', e =>
            Ember.run.throttle(this, this.postEvent, e, 200), true);
    },

    clickHandlerBrowse(evt) {
        if (evt.which <= 1 && !evt.ctrlKey) { // Ignore right/middle click or Ctrl+click
            if(evt.target.tagName !== 'INPUT') {
                evt.preventDefault();
            }
            this.postEvent(evt);
        }
    },

    postEvent(evt) {
        this.get('webSocket').send({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project')
            },
            _command: 'interact',
            interaction: interactionEvent(evt)
        });
    },

    clearIframe() {
        let defer = new Ember.RSVP.defer();
        let iframe = this.element;
        let id = shortGuid();
        let that = this;
        // Using a empty static page because using srcdoc or an data:uri gives
        // permission problems and/or broken baseURI behaviour in different browsers.
        iframe.setAttribute('src', '/static/empty-frame.html?' + id);
        iframe.removeAttribute('srcdoc');
        // Using a message to workaround onload bug on some browsers (cough IE cough).
        let $win = $(window).bind('message', function onMessage(e){
            if(e.originalEvent.data.frameReady === id){
                that.bindEventHandlers();
                Ember.run(that, that.documentLoaded);
                $win.unbind('message', onMessage);
                defer.resolve();
            }
        });
        return defer.promise;
    },

    iframeSize() {
        var iframeWindow = this.element.contentWindow;
        if (iframeWindow) {
            return iframeWindow.innerWidth + 'x' + iframeWindow.innerHeight;
        }
        return null;
    }
});

BrowserIFrame.reopenClass({
    instances: 0
});

export default BrowserIFrame;