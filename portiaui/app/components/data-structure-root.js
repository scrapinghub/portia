import Ember from 'ember';


export default Ember.Component.extend({
    dataStructure: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    numItems: Ember.computed.readOnly('dataStructure.structure.length'),

    actions: {
        addItem() {
            this.get('dispatcher').addItem();
        }
    }
});
