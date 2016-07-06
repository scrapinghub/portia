import Ember from 'ember';
import DS from 'ember-data';
import EmptyObject from "ember-data/-private/system/empty-object";
const { get } = Ember;

export default DS.Model.extend({
    save(options) {
        /*
            bulk saving helper using the coalesce option. this will generate the
            correct adapterOptions for the adapter to coalesce the requests:

                model.save({
                    coalesce: [{
                        model: otherModel1,
                        options: {
                            partial: ['name']
                        }
                    }, {
                        model: otherModel2
                    }]
                });
        */

        const coalescePromises = [];
        if (options && options.coalesce) {
            // a shared list for the adapter to track coalesced updates.
            const sharedUpdates = [];

            if (!options.adapterOptions) {
                options.adapterOptions = {};
            }
            options.adapterOptions.coalesce = {
                type: 'main',
                updates: sharedUpdates
            };

            for (let {model, options: modelOptions} of options.coalesce) {
                const record = model._internalModel;

                if (get(record, 'currentState.stateName') === 'root.deleted.saved' ||
                        record.isDeleted()) {
                    throw new Ember.Error(
                        "You can not pass deleted models in the coalesce options to the " +
                        "save method.");
                } else if (record.isNew()) {
                    throw new Ember.Error(
                        "You can not pass unsaved models in the coalesce options to the " +
                        "save method.");
                }

                // create a new request for each updated model. the adapter will
                // coalesce requests with the same value of coalesce.updates.
                // the request with a coalesce.type of 'main' MUST come after
                // those type 'extra'.
                const modelPromise = model.save(Ember.assign({}, modelOptions, {
                    // settings adapterOptions directly so we don't trigger
                    // this code path again.
                    adapterOptions: {
                        coalesce: {
                            type: 'extra',
                            updates: sharedUpdates
                        }
                    }
                }));
                coalescePromises.push(modelPromise);
            }
        }

        /*
            partial updates using the partial option. this will pass the partial
            option to the serializer through adapterOptions, so only the
            selected fields will be serialized and sent in the request. we also
            need to track the internalModel._inFlightAttributes correctly.

                model.save({
                    partial: ['name', 'age']
                });
        */

        const internalModel = this._internalModel;
        let originalAttributes = internalModel._attributes;
        if (options && options.partial) {
            if (!options.adapterOptions) {
                options.adapterOptions = {};
            }
            options.adapterOptions.partial = options.partial;

            // prepare _attributes for flushChangedAttributes call in
            // store.scheduleSave, so that only the attributes selected for
            // partial save are marked as inFlight.
            internalModel._attributes = new EmptyObject();
            for (let key of options.partial) {
                if (key in originalAttributes) {
                    internalModel._attributes[key] = originalAttributes[key];
                    delete originalAttributes[key];
                }
            }
        }

        const mainPromise = this._super(options);

        if (options && options.partial) {
            internalModel._attributes = originalAttributes;
        }

        coalescePromises.unshift(mainPromise);
        // resolve the .save() promise when all coalesced have been resolved
        return Ember.RSVP.allSettled(coalescePromises).then(() => mainPromise);
    }
});
