import Ember from 'ember';
import { getAttributeList } from './inspector-panel';

export default Ember.Component.extend({
    uiState: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    annotation: null,
    invalidSelector: false,

    selectionModeOptions: [
        {
            value: 'auto',
            label: 'Automatic'
        },
        {
            value: 'css',
            label: 'CSS selector'
        },
        {
            value: 'xpath',
            label: 'XPath selector'
        }
    ],

    attribute: Ember.computed('annotation.attribute', 'attributes.[]', {
        get() {
            return this.get('attributes').findBy('attribute', this.get('annotation.attribute'));
        },

        set(key, value) {
            this.set('annotation.attribute', value.attribute);
            return value;
        }
    }),
    attributes: Ember.computed('uiState.viewPort.selectedElement', function() {
        return getAttributeList(this.get('uiState.viewPort.selectedElement'));
    }),
    selectionMode: Ember.computed('annotation.selectionMode', {
        get() {
            return this.selectionModeOptions.findBy('value', this.get('annotation.selectionMode'));
        },

        set(key, value) {
            this.set('annotation.selectionMode', value.value);
            return value;
        }
    }),
    cssSelector: Ember.computed({
        get() {
            return this.get('annotation.selector');
        },

        set(key, value) {
            if (this.get('invalidSelector')) {
                return this.get('cssSelector');
            } else {
                const annotation = this.get('annotation');
                this.setAnnotationSelector(annotation, value);
                return value;
            }
        }
    }),
    editedCssSelector: Ember.computed({
        get() {
            return null;
        },

        set(key, value) {
            const annotation = this.get('annotation');
            if (value === null) {
                this.set('invalidSelector', false);
                this.setAnnotationSelector(annotation, this.get('cssSelector'));
            } else {
                let invalidSelector = false;

                try {
                    document.querySelectorAll(value);
                } catch (e) {
                    invalidSelector = true;
                }

                this.set('invalidSelector', invalidSelector);
                if (!invalidSelector) {
                    this.setAnnotationSelector(annotation, value);
                }
            }
            return value;
        }
    }),

    updateCssSelector: Ember.observer('annotation.selector', function() {
        if (this.get('editedCssSelector') === null) {
            this.set('cssSelector', this.get('annotation.selector'));
        }
    }),

    setAnnotationSelector(annotation, selector) {
        return annotation.get('sample').then(sample => {
            annotation.setSelector(selector);
            return this.updateSelector(sample);
        });
    },

    updateSelector(sample) {
        if (!this._updateSelectorPromise) {
            this._updateSelectorPromise = this._updateSelector(sample);
        } else if (!this._updateSelectorPromise.pending) {
            this._updateSelectorPromise.pending = true;
            this._updateSelectorPromise.then(() => {
                return (this._updateSelectorPromise = this._updateSelector(sample));
            });
        }

        return this._updateSelectorPromise;
    },

    _updateSelector(sample) {
        const dispatcher = this.get('dispatcher');
        const promise = dispatcher.updateSampleSelectors(sample).then(() => {
            if (this._updateSelectorPromise === promise) {
                delete this._updateSelectorPromise;
            }
        });
        return promise;
    },

    actions: {
        save() {
            const promise = this.get('annotation').save();
            return this._updateSelectorPromise ?
                this._updateSelectorPromise.then(() => promise) :
                promise;
        }
    }
});
