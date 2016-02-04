import Ember from 'ember';
import DS from 'ember-data';
import {
    ElementPath,
    findCssSelector
} from '../utils/selectors';

export default DS.Model.extend({
    parent: DS.belongsTo('item', {
        inverse: 'annotations',
        async: false
    }),
    field: DS.belongsTo({
    }),
    extractors: DS.hasMany(),

    attribute: DS.attr('string'),
    tagid: DS.attr('string'),
    required: DS.attr('boolean'),
    ignore: DS.attr('boolean'),
    ignoreBeneath: DS.attr('boolean'),
    variant: DS.attr('number'),
    slice: DS.attr('array'),

    // selection
    selectionMode: DS.attr('string', {
        defaultValue: 'auto'
    }),
    // json fixes error with storing ember NativeArray in indexed db
    acceptSelectors: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),
    rejectSelectors: DS.attr('array', {
        defaultValue() {
            return [];
        }
    }),

    name: Ember.computed.readOnly('field.name'),
    type: Ember.computed.readOnly('field.type'),

    orderedIndex: Ember.computed('sample.orderedAnnotations', function() {
        return (this.get('sample.orderedAnnotations') || []).indexOf(this);
    }),
    sample: Ember.computed.or('parent.sample', 'parent.itemAnnotation.sample'),

    addElement(element) {
        const selector = new ElementPath(findCssSelector(element)).uniquePathSelector;
        const acceptSelectors = this.get('acceptSelectors');
        const rejectSelectors = this.get('rejectSelectors');
        acceptSelectors.addObject(selector);
        rejectSelectors.removeObject(selector);
    },

    removeElement(element) {
        const selector = new ElementPath(findCssSelector(element)).uniquePathSelector;
        const acceptSelectors = this.get('acceptSelectors');
        const rejectSelectors = this.get('rejectSelectors');
        acceptSelectors.removeObject(selector);
        rejectSelectors.addObject(selector);
    },

    save() {
        const currentParent = this.get('parent.itemAnnotation');
        return this._super(...arguments).then(result => {
            const newParent = this.get('parent.itemAnnotation');
            const promises = [];
            if (currentParent && currentParent !== newParent) {
                const promise = this.syncParent(currentParent);
                if (promise) {
                    promises.push(promise);
                }
            }
            if (newParent) {
                const promise = this.syncParent(newParent);
                if (promise) {
                    promises.push(promise);
                }
            }
            return Ember.RSVP.all(promises).then(() => {
                return result;
            });
        });
    },

    syncParent(parent) {
        const changed = parent.changedAttributes();
        for (let key of Object.keys(changed)) {
            const [oldValue, newValue] = changed[key];
            if (Ember.compare(oldValue, newValue) !== 0) {
                return parent.save();
            }
        }
    }
});
