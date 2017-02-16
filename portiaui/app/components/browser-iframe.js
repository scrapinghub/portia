import Ember from 'ember';
import { storageFor } from 'ember-local-storage';
import { cleanUrl, shortGuid } from '../utils/utils';
import interactionEvent from '../utils/interaction-event';
import treeMirrorDelegate from '../utils/tree-mirror-delegate';
import { NAVIGATION_MODE } from '../services/browser';


const BrowserIFrame = Ember.Component.extend({
    browser: Ember.inject.service(),
    overlays: Ember.inject.service(),
    webSocket: Ember.inject.service(),
    uiState: Ember.inject.service(),
    cookiesStore: storageFor('cookies'),
    extractedItems: Ember.inject.service(),

    tagName: 'iframe',
    classNames: ['browser-iframe'],
    classNameBindings: ['overlays.hasOverlays:has-overlays'],

    splashUrl: null,

    disabled: Ember.computed.alias('browser.disabled'),
    document: Ember.computed.alias('browser.document'),
    loading: Ember.computed.alias('browser.loading'),
    url: Ember.computed.readOnly('browser.url'),
    baseurl: Ember.computed.readOnly('browser.baseurl'),
    spider: Ember.computed.readOnly('uiState.models.spider.id'),
    project: Ember.computed.readOnly('uiState.models.project.id'),

    init() {
        this._super();
        this.loadCookies();
        this.frameEventListeners = [];
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
        const ws = this.get('webSocket');
        ws.connect();
        ws.addCommand('loadStarted', this, this.msgLoadStarted);
        ws.addCommand('metadata', this, this.msgMetadata);
        ws.addCommand('load', this, this.msgLoad);
        ws.addCommand('cookies', this, this.msgCookies);
        ws.addCommand('mutation', this, this.msgMutation);
        ws.addCommand('save_html', this, this.noop);
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
        const ws = this.get('webSocket');
        ws.removeCommand('loadStarted', this, this.msgLoadStarted);
        ws.removeCommand('metadata', this, this.msgMetadata);
        ws.removeCommand('load', this, this.msgLoad);
        ws.removeCommand('cookies', this, this.msgCookies);
        ws.removeCommand('mutation', this, this.msgMutation);
        ws.removeCommand('save_html', this, this.noop);
        ws.close();

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
    loadUrl: Ember.observer('url', 'baseurl', 'webSocket.closed', function() {
        Ember.run.scheduleOnce('sync', this, this._loadUrl);
    }),

    _loadUrl() {
        const url = this.get('url');
        let baseurl = this.get('baseurl');

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
                cookies: this.loadCookies(),
                project: this.get('project'),
                spider: this.get('spider'),
            },
            _command: 'load',
            url: url,
            baseurl: baseurl
        });
    },

    msgLoadStarted() {
        this.set('loading', true);
    },

    msgLoad(data) {
        this.msgMetadata(data);
    },

    msgMetadata(data) {
        if (data.loaded) {
            this.set('loading', false);
        }
        if (data.url) {
            this.splashUrl = data.url;
            this.set('browser.url', data.url);
        }
        if (data.error) {
            this.handleMetadataError();
        }
    },

    handleMetadataError() {
        this.set('loading', false);
        this.set('splashUrl', null);
        this.get('extractedItems').failExtraction('Failed Loading Page');
        this.get('browser').invalidateUrl();
        this.get('webSocket').send({
            _meta: {
                spider: this.get('spider'),
                project: this.get('project')
            },
            _command: 'interact'
        });
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
            const browser = this.get('browser');
            this.treeMirror.delegate.cssEnabled = browser.get('cssEnabled');
            this.treeMirror[action].apply(this.treeMirror, args);
            browser.trigger('contentChanged');
        });
    },

    cookieId: Ember.computed('spider', 'project', function() {
        if (this.get('project') && this.get('spider')) {
            return `cookies:${this.get('project')}/${this.get('spider')}`.replace(/\./g, '_');
        }
    }),

    msgCookies(data) {
        let cookies = data.cookies,
            cookieId = this.get('cookieId');
        if (cookies && cookies.length) {
            this.set(`cookiesStore.${cookieId}`, cookies);
        }
    },

    noop() {
        return null;
    },

    loadCookies(){
        let cookieId = this.get('cookieId');
        if(cookieId){
            let cookies = this.get(`cookiesStore.${cookieId}`);
            if (cookies) {
                return cookies;
            }
        }
        return {};
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
                return false;
            }
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
                spider: this.get('spider'),
                project: this.get('project')
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
        const iframe = Ember.$(this.element);
        const height = Math.max(iframe.innerHeight(), 10);

        if (iframe) {
            return iframe.innerWidth() + 'x' + height;
        }
        return null;
    }
});

BrowserIFrame.reopenClass({
    instances: 0
});

export default BrowserIFrame;
