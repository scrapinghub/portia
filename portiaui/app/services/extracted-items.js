import Ember from 'ember';


export default Ember.Service.extend({
    dataStructure: Ember.inject.service(),
    uiState: Ember.inject.service(),

    annotations: Ember.computed.readOnly('uiState.models.sample.orderedChildren'),
    items: Ember.computed(
        'dataStructure.structure', 'annotations.@each.name', 'annotations.@each.attribute', (() => {
            function extractItem(itemMatch) {
                const item = {};

                if (itemMatch.annotations) {
                    itemMatch.annotations.forEach(({annotation, node}) => {
                        const attribute = annotation.get('attribute');
                        item[annotation.get('name')] = attribute ?
                            node.getAttribute(attribute) :
                            node.textContent;
                    });
                }

                if (itemMatch.nestedItems) {
                    itemMatch.nestedItems.forEach(itemMatch => {
                        const fieldName = itemMatch.annotation.get('name');
                        const itemList = item[fieldName] || (item[fieldName] = []);
                        itemList.push(extractItem(itemMatch));
                    });
                }

                return item;
            }

            return function computeStructure() {
                const structure = this.get('dataStructure.structure');
                return (structure || []).map(extractItem);
            };
        })())
});
