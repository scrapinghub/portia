import Ember from 'ember';

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

export default Ember.Helper.extend({
    dataStructure: Ember.inject.service(),
    compute([item]) {
        const structure = this.get('dataStructure.structure');
        const itemHierarchy = [];

        do {
            itemHierarchy.unshift(item);
        } while (item = item.get('itemAnnotation.parent'));

        return structure ? countItems(structure, itemHierarchy, 0) : 0;
    },
    countMatches: Ember.observer('dataStructure.structure', function() {
        this.recompute();
    })
});
