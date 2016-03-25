import Ember from 'ember';
import { cleanUrl } from '../utils/utils';


export const NAVIGATION_MODE = 'navigation';
export const ANNOTATION_MODE = 'data-annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);
export const DEFAULT_MODE = NAVIGATION_MODE;

export default Ember.Service.extend({
    webSocket: Ember.inject.service(),

    backBuffer: [],
    document: null,
    forwardBuffer: [],
    loading: false,
    mode: DEFAULT_MODE,
    _disabled: true,
    _url: null,
    baseurl: null,

    disabled: Ember.computed('_disabled', 'webSocket.closed', 'mode', {
        get() {
            return this.get('_disabled') || this.get('webSocket.closed') ||
                this.get('mode') !== NAVIGATION_MODE;
        },

        set(key, value) {
            this.set('_disabled', value);
            return value || this.get('webSocket.closed') || this.get('mode') !== NAVIGATION_MODE;
        }
    }),
    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    url: Ember.computed('_url', {
        get() {
            return this.get('_url');
        },

        set(key, value) {
            return this.go(value);
        }
    }),
    $document: Ember.computed('document', function() {
        const document = this.get('document');
        return document ? Ember.$(document) : null;
    }),

    resetUrl: Ember.observer('document', function() {
        if (!this.get('document')) {
            this.setProperties({
                '_url': null,
                'baseurl': null
            });
        }
    }),

    go(url) {
        const currentUrl = this.get('_url');
        url = cleanUrl(url);
        if (url && url !== currentUrl) {
            this.beginPropertyChanges();
            if (currentUrl) {
                this.get('backBuffer').pushObject(currentUrl);
            }
            this.set('_url', url);
            this.set('forwardBuffer', []);
            this.endPropertyChanges();
        }
        return url;
    },

    back() {
        if (this.get('backBuffer.length')) {
            this.beginPropertyChanges();
            this.get('forwardBuffer').pushObject(this.get('_url'));
            this.setProperties({
                '_url': this.get('backBuffer').popObject(),
                'baseurl': null
            });
            this.endPropertyChanges();
        }
    },

    forward() {
        if (this.get('forwardBuffer.length')) {
            this.beginPropertyChanges();
            this.get('backBuffer').pushObject(this.get('_url'));
            this.setProperties({
                '_url': this.get('forwardBuffer').popObject(),
                'baseurl': null
            });
            this.endPropertyChanges();
        }
    },

    reload() {
        this.notifyPropertyChange('_url');
    },

    setAnnotationMode() {
        this.set('mode', ANNOTATION_MODE);
    },

    clearAnnotationMode() {
        if (this.get('mode') === ANNOTATION_MODE) {
            this.set('mode', DEFAULT_MODE);
        }
    }
});
