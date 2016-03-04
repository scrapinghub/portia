import Ember from 'ember';
import DS from 'ember-data';
import {
    elementPath,
    smartSelector
} from '../utils/selectors';

export default DS.Model.extend({
    parent: DS.belongsTo('item', {
        inverse: 'annotations',
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
    selector: DS.attr('string'),
    xpath: DS.attr('string'),

    name: Ember.computed.readOnly('field.name'),
    type: Ember.computed.readOnly('field.type'),

    orderedIndex: Ember.computed('sample.orderedAnnotations', function() {
        return (this.get('sample.orderedAnnotations') || []).indexOf(this);
    }),
    sample: Ember.computed.or('parent.sample', 'parent.itemAnnotation.sample'),

    updateSelectors: Ember.observer('', function() {
        const selectionMode = this.get('selectionMode');
        switch (selectionMode) {
            case 'auto':
                this.setProperties({
                    acceptSelectors: (this.get('elements') || []).map(smartSelector),
                    rejectSelectors: []
                });
                break;
            case 'css':
                const selector = this.get('selector');
                this.setProperties({
                    acceptSelectors: selector ? [selector] : [],
                    rejectSelectors: []
                });
                break;
            case 'xpath':
                // TODO:
                break;
        }
    }),

    addElement(element) {
        this.moveElement(element, 'acceptSelectors', 'rejectSelectors');
    },

    removeElement(element) {
        this.moveElement(element, 'rejectSelectors', 'acceptSelectors');
    },

    moveElement(element, toProperty, fromProperty) {
        // run this in it's own run loop so that all computed properties sync before this method
        // returns, since a save call will follow.
        Ember.run(() => {
            const toSelectors = this.get(toProperty);
            const fromSelectors = this.get(fromProperty);

            const path = elementPath(element);
            const root = path[0];
            const selector = smartSelector(element);

            const addSelectors = [];
            const removeSelectors = [];

            // a selector may match more than one element, we only want to remove the single element
            for (let fromSelector of fromSelectors) {
                const elements = Array.from(root.querySelectorAll(fromSelector));
                if (elements.includes(element)) {
                    removeSelectors.addObject(fromSelector);
                    elements.removeObject(element);
                    for (let addElement of elements) {
                        addSelectors.addObject(smartSelector(addElement));
                    }
                }
            }

            fromSelectors.removeObjects(removeSelectors);
            fromSelectors.addObjects(addSelectors);
            toSelectors.addObject(selector);
        });

        const selectionMode = this.get('selectionMode');
        if (selectionMode === 'css') {
            this.setSelector(this.get('selector'));
        }
    },

    setSelector(selector) {
        Ember.run(() => {
            this.setProperties({
                acceptSelectors: selector ? [selector] : [],
                rejectSelectors: []
            });
        });
    },

    set() {
        this.cancelPendingDelete();
        this._super(...arguments);
    },

    setProperties() {
        this.cancelPendingDelete();
        this._super(...arguments);
    },

    save() {
        // starting another save while one hasn't been completed by the adapter causes an error
        if (this.get('isSaving') && this._savePromise) {
            // upgrade to destroy if saving directly after delete
            if (this._savePromise._queuedAction === 'delete') {
                this._savePromise._queuedAction = 'destroy';
            } else {
                this._savePromise._queuedAction = 'save';
            }
            return this._savePromise;
        }

        const currentParentPromise = this.get('parent.itemAnnotation');
        const promise = this._super(...arguments).then(result => Ember.RSVP.all([
            currentParentPromise,
            this.get('parent.itemAnnotation')
        ]).then(([currentParent, newParent]) => {
            const promises = [];
            if (currentParent && currentParent !== newParent) {
                const promise = this.syncRelative(currentParent);
                if (promise) {
                    promises.push(promise);
                }
            }
            if (newParent) {
                const promise = this.syncRelative(newParent);
                if (promise) {
                    promises.push(promise);
                }
            }
            return Ember.RSVP.all(promises).then(() => result);
        })).finally(() => {
            switch (this._savePromise._queuedAction) {
                case 'save':
                    return this.save();
                case 'delete':
                    this.deleteRecord();
                    return;
                case 'destroy':
                    return this.destroyRecord();
            }
        });

        this._savePromise = promise;
        return promise;
    },

    deleteRecord() {
        // deleting during a save is not allowed, queue it
        if (this.get('isSaving') && this._savePromise) {
            this._savePromise._queuedAction = 'delete';
            return;
        }
        this._super();
    },

    cancelPendingDelete() {
        // ignore pending delete if an attribute is set on the model
        if (this.get('isSaving') && this._savePromise) {
            if (this._savePromise._queuedAction === 'delete') {
                delete this._savePromise._queuedAction;
            }
        }
    },

    syncRelative(relative) {
        const changed = relative.changedAttributes();
        for (let key of Object.keys(changed)) {
            const [oldValue, newValue] = changed[key];
            if (Ember.compare(oldValue, newValue) !== 0) {
                return relative.save();
            }
        }
    }
});
