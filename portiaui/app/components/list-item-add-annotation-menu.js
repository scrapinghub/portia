import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    item: null,

    allowNesting: Ember.computed.lt('item.depth', 4), 

    actions: {
        addAnnotation() {
            const item = this.get('item');
            this.get('dispatcher').addAnnotation(item, undefined, undefined, /* redirect = */true);
        },

        addNestedItem() {
            const item = this.get('item');
            this.get('dispatcher').addNestedItem(item, /* redirect = */true);
        }
    }
});
