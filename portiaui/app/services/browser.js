import Ember from 'ember';


export const DEFAULT_MODE = 'navigation';
export const ANNOTATION_MODE = 'annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);

export default Ember.Service.extend({
    backBuffer: [],
    disabled: true,
    document: null,
    forwardBuffer: [],
    loading: false,
    mode: DEFAULT_MODE,
    url: null,

    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    $document: Ember.computed('document', function() {
        const document = this.get('document');
        return document ? Ember.$(document) : null;
    }),

    go(url) {
        this.beginPropertyChanges();
        this.get('backBuffer').pushObject(this.get('url'));
        this.set('url', url);
        this.set('forwardBuffer', []);
        this.endPropertyChanges();
    },

    back() {
        if (this.get('backBuffer.length')) {
            this.beginPropertyChanges();
            this.get('forwardBuffer').pushObject(this.get('url'));
            this.set('url', this.get('backBuffer').popObject());
            this.endPropertyChanges();
        }
    },

    forward() {
        if (this.get('forwardBuffer.length')) {
            this.beginPropertyChanges();
            this.get('backBuffer').pushObject(this.get('url'));
            this.set('url', this.get('forwardBuffer').popObject());
            this.endPropertyChanges();
        }
    },

    reload() {
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
