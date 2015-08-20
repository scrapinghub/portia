import Ember from 'ember';
import utils from '../utils/utils';
import treeMirrorDelegate from '../utils/tree-mirror-delegate';
import { NAVIGATION_MODE } from '../services/browser';


const BrowserIFrame = Ember.Component.extend({
    browser: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    tagName: 'iframe',

    disabled: Ember.computed.alias('browser.disabled'),
    document: Ember.computed.alias('browser.document'),
    loading: Ember.computed.alias('browser.loading'),
    url: Ember.computed.readOnly('browser.url'),

    init() {
        this._super();
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
        return false;
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
        });

        this.$().off('.portia-iframe')
            .on('load.portia.portia-iframe', () => {
                this.setupEventHandlers();
                Ember.run(this, this.documentLoaded);
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
        this.setProperties({
            document: this.element.contentDocument,
            loading: false
        });
    },

    setupEventHandlers() {
        Ember.$(this.element.contentDocument).off('.portia-iframe')
            .on('click.portia.portia-iframe', this.click.bind(this));
    },

    /**
     * Loads and displays a url interactively
     * Can only be called in "browse" mode.
     */
    loadUrl: Ember.observer('url', function() {
        const url = this.get('url');
        let spider, baseurl;  //???
        Ember.assert('loadUrl can only be called in navigation mode',
                     this.get('browser.mode') === NAVIGATION_MODE);
        Ember.assert('Passed a malformed url', url.includes('://') && utils.cleanUrl(url));
        // TODO show loading

        this.get('webSocket').send({
            _meta: {
                // TODO: Send current project and spider to see followed links and extracted items?
                id: utils.shortGuid(),
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
        // TODO: show loading, remove this message and use metadata instead?
    },

    msgMetadata(data) {
        data = data._data;
        // TODO set loading depending on data.loading
        // TODO: update data.url in browser, adding to history if necessary
    },

    msgMutation(data) {
        var [action, ...args] = data._data;
        if(action === 'initialize') {
            this.iframePromise = this.clearIframe().then(() => {
                var doc = this.iframe.contentWindow.document;
                this.treeMirror = new TreeMirror(doc, treeMirrorDelegate(this));
            }).catch(function(e){
                console.log(e);
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

    loadCookies: function(){
        if(window.sessionStorage && sessionStorage.portia_cookies){
            this.cookies = JSON.parse(sessionStorage.portia_cookies);
        }
    }.on('init'),

    clearIframe() {
        let defer = new Ember.RSVP.defer();
        let iframe = this.iframe;
        let id = utils.shortGuid();
        // Using a empty static page because using srcdoc or an data:uri gives
        // permission problems and/or broken baseURI behaviour in different browsers.
        iframe.setAttribute('src', '/static/empty-frame.html?' + id);
        iframe.removeAttribute('srcdoc');
        // Using a message to workaround onload bug on some browsers (cough IE cough).
        let $win = $(window).bind('message', function onMessage(e){
            if(e.originalEvent.data.frameReady === id){
                //that.rebindEventHandlers() TODO!
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