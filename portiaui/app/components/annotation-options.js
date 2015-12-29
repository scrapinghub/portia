import Ember from 'ember';
import { getAttributeList } from './inspector-panel';

export default Ember.Component.extend({
    uiState: Ember.inject.service(),

    tagName: '',

    annotation: null,

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

    actions: {
        save() {
            this.get('annotation').save();
        }
    }
});
