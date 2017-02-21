import Ember from 'ember';
import { ensurePromise } from '../utils/promises';

export default Ember.Component.extend({
    tagName: '',

    onChange: null,
    choices: [],
    selecting: false,
    value: null,

    choicesOrdering: ['name'],
    sortedChoices: Ember.computed.sort('choices', 'choicesOrdering'),

    orderItemsForSearch(items) {
        function sortPriority(item) {
            switch (item.get('value.special')) {
                case 'rename':
                    return 1;
                case 'add':
                    return 2;
                default:
                    return 0;
            }
        }

        return items.sort((a, b) => sortPriority(a) - sortPriority(b));
    },

    valuesEqual(a, b) {
        const aValue = a && (a.get ? a.get('name') : a.name);
        const bValue = b && (b.get ? b.get('name') : b.name);
        return aValue === bValue;
    },

    validateName(name) {
        return typeof this.attrs.validate !== 'function' || this.attrs.validate(name);
    },

    actions: {
        add(name) {
            ensurePromise(this.validateName(name)).then(isValid => {
                if (isValid) {
                    if (this.attrs.create) {
                        this.attrs.create(name);
                    }
                }
            });
        },

        rename(name) {
            ensurePromise(this.validateName(name)).then(isValid => {
                if (isValid) {
                    const model = this.get('value');
                    ensurePromise(model).then(item => {
                        if (!item) {
                            return; // Model is null
                        }
                        item.set('name', name);
                        item.save();
                    });
                }
            });
        }
    }
});
