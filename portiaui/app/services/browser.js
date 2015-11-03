import Ember from 'ember';


export const NAVIGATION_MODE = 'navigation';
export const ANNOTATION_MODE = 'annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);
export const DEFAULT_MODE = NAVIGATION_MODE;

export const MODE_DESCRIPTIONS = {
    [NAVIGATION_MODE]: 'Browsing',
    [ANNOTATION_MODE]: 'Annotating'
};

export default Ember.Service.extend({
    backBuffer: [],
    document: null,
    forwardBuffer: [],
    loading: false,
    mode: DEFAULT_MODE,
    _disabled: true,
    _url: null,

    disabled: Ember.computed('_disabled', 'mode', {
        get() {
            return this.get('_disabled') || this.get('mode') !== NAVIGATION_MODE;
        },

        set(key, value) {
            this.set('_disabled', value);
            return value || this.get('mode') !== NAVIGATION_MODE;
        }
    }),
    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    modeDescription: Ember.computed('mode', function() {
        const mode = this.get('mode');
        return MODE_DESCRIPTIONS[mode];
    }),
    url: Ember.computed('_url', {
        get() {
            return this.get('_url');
        },

        set(key, value) {
            this.go(value);
            return value;
        }
    }),
    $document: Ember.computed('document', function() {
        const document = this.get('document');
        return document ? Ember.$(document) : null;
    }),

    resetUrl: Ember.observer('document', function() {
        if (!this.get('document')) {
            this.set('_url', null);
        }
    }),

    go(url) {
        const currentUrl = this.get('_url');
        if (url && url !== currentUrl) {
            this.beginPropertyChanges();
            if (currentUrl) {
                this.get('backBuffer').pushObject(currentUrl);
            }
            this.set('_url', url);
            this.set('forwardBuffer', []);
            this.endPropertyChanges();
        }
    },

    back() {
        if (this.get('backBuffer.length')) {
            this.beginPropertyChanges();
            this.get('forwardBuffer').pushObject(this.get('_url'));
            this.set('_url', this.get('backBuffer').popObject());
            this.endPropertyChanges();
        }
    },

    forward() {
        if (this.get('forwardBuffer.length')) {
            this.beginPropertyChanges();
            this.get('backBuffer').pushObject(this.get('_url'));
            this.set('_url', this.get('forwardBuffer').popObject());
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
