import Ember from 'ember';


export default Ember.Component.extend({
    tagName: '',

    dataStructure: Ember.inject.service(),

    itemAnnotation: Ember.computed.readOnly('item.content'),
    numItems: Ember.computed('dataStructure.structure', (() => {
        function countItems(itemMatches, itemHierarchy, hierarchyIndex) {
            let count = 0;
            const item = itemHierarchy[hierarchyIndex];
            const lastItem = hierarchyIndex === itemHierarchy.length - 1;

            for (let itemMatch of itemMatches) {
                if (itemMatch.item === item) {
                    count += lastItem ? 1 : (
                        itemMatch.nestedItems ?
                        countItems(itemMatch.nestedItems, itemHierarchy, hierarchyIndex + 1) :
                        0
                    );
                }
            }

            return count;
        }

        return function() {
            let item = this.get('itemAnnotation.item');
            const structure = this.get('dataStructure.structure');
            const itemHierarchy = [];

            do {
                itemHierarchy.unshift(item);
            } while (item = item.get('itemAnnotation.parent'));

            return structure ? countItems(structure, itemHierarchy, 0) : 0;
        };
    })())
});
