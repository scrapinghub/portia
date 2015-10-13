import Ember from 'ember';


export default Ember.Component.extend({
    dataStructure: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    numItems: Ember.computed.readOnly('dataStructure.structure.length'),

    actions: {
        addItem() {
            const sample = this.get('uiState.models.sample');
            this.get('dispatcher').addItem(sample, /* redirect = */true);
        }
    }
});
