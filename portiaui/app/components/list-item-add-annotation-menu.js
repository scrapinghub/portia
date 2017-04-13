import Ember from 'ember';
import config from '../config/environment';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    item: null,

    allowNesting: config.APP.allow_nesting,

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
