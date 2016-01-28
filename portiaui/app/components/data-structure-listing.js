import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    annotationColors: [],

    actions: {
        addItem(sample) {
            this.get('dispatcher').addItem(sample, /* redirect = */true);
        },

        removeItem(item) {
            this.get('dispatcher').removeItem(item);
        }
    }
});
