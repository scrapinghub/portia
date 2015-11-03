import Ember from 'ember';

export default Ember.Component.extend({
    dataStructure: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    extractedItems: Ember.computed.filter('dataStructure.structure', function(structureItem) {
        const item = this.get('item.content');
        return structureItem.item === item;
    }),
    numItems: Ember.computed.readOnly('extractedItems.length'),

    actions: {
        removeItem() {
            const item = this.get('item.content');
            this.get('dispatcher').removeItem(item);
        }
    }
});
