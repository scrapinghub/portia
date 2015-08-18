import Ember from 'ember';

export const DEFAULT_MODE = 'navigation';
export const ANNOTATION_MODE = 'annotation';
export const INTERACTION_MODES = new Set([ANNOTATION_MODE]);

export default Ember.Service.extend({
    disabled: Ember.computed.equal('viewPort', null),
    backBuffer: [],
    forwardBuffer: [],
    isInteractionMode: Ember.computed('mode', function() {
        return INTERACTION_MODES.has(this.get('mode'));
    }),
    loading: false,
    mode: DEFAULT_MODE,
    viewPort: null,
    url: 'owlkingdom.com',

    registerViewPort(component) {
        this.set('viewPort', component);
    },

    unRegisterViewPort(component) {
        if (this.get('viewPort') === component) {
            this.set('viewPort', null);
        }
    },

    go(url) {
        this.get('backBuffer').pushObject(this.get('url'));
        this.setProperties({
            url: url,
            forwardBuffer: []
        });
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
