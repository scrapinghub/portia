import Ember from 'ember';
import DS from 'ember-data';
import Annotation from './annotation';

export default Annotation.extend({
    name: DS.attr('string'),
    item: DS.belongsTo({
        async: true,
        inverse: 'itemAnnotation'
    }),
    repeated: DS.attr('boolean', {
        defaultValue() {
            return false;
        }
    }),
    repeatedAcceptSelectors: DS.attr('array'), // Selector of repeated container inside container
    siblings: DS.attr('number'),     // Number of siblings to look at for repeated container
    field: DS.attr('string'),   // Field to extract to in parent container

    acceptSelectors: DS.attr('array'),
    rejectSelectors: DS.attr('array'),

    orderedAnnotations: Ember.computed.readOnly('item.orderedAnnotations'),
    orderedChildren: Ember.computed.readOnly('item.orderedChildren'),

    save() {
        return this._super(...arguments).then(result => {
            const annotations = this.get('item.annotations');
            if (!annotations) {
                return;
            } 
            return annotations.then(children => {
                const promises = [];
                children.forEach(child => {
                    const promise = this.syncRelative(child);
                    if (promise) {
                        promises.push(promise);
                    }
                });
                return Ember.RSVP.all(promises).then(() => {
                    return result;
                });
            });
        });
    }
});
