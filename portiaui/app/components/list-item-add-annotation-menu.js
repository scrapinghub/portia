import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    item: null,

    actions: {
        addAnnotation() {
            const item = this.get('item');
            this.get('dispatcher').addAnnotation(item, undefined, undefined, /* redirect = */true);
        },

        addItemAnnotation() {
            const item = this.get('item');
            this.get('dispatcher').addItemAnnotation(item, /* redirect = */true);
        }
    }
});
