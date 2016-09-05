import Ember from 'ember';
import DS from 'ember-data';
import EmptyObject from "ember-data/-private/system/empty-object";
const { get } = Ember;

let currentActionModel = null;
const modelActionQueue = [];

function runActions() {
    if (currentActionModel && currentActionModel.get('isSaving')) {
        // current action has not finished
        return;
    }
    currentActionModel = null;
    while (modelActionQueue.length) {
        const nextModel = modelActionQueue.shift();
        if (nextModel.get('isSaving')) {
            // model has started saving again, wait for the next didCommit event
            return;
        }
        if (nextModel.get('isDeleted') && !nextModel.get('hasDirtyAttributes')) {
            // model has been deleted
            continue;
        }
        if (nextModel.get('pendingDelete')) {
            nextModel.deleteRecord();
            nextModel.set('pendingDelete', false);
        }
        const pendingSave = nextModel.get('pendingSave');
        if (pendingSave) {
            nextModel.set('pendingSave', null);
            const {resolver, options} = pendingSave;
            // apply the save and resolve the promise, then wait for the next didCommit event
            nextModel.save(options).then(resolver.resolve, resolver.reject);
            return;
        }
    }
}

function mergeSaveOptions(dst, src) {
    if (!dst) { return src; }
    src = src || {};

    if (src.coalesce) {
        if (dst.coalesce) {
            for (let coalesce of src.coalesce) {
                const {model, options} = coalesce;
                const matchingCoalesce = dst.coalesce.findBy('model', model);
                if (matchingCoalesce) {
                    matchingCoalesce.options = mergeSaveOptions(matchingCoalesce.options, options);
                } else {
                    dst.coalesce.push(coalesce);
                }
            }
        } else {
            dst.coalesce = src.coalesce;
        }
    }

    if (src.partial) {
        if (dst.partial) {
            for (let field of src.partial) {
                if (!dst.partial.includes(field)) {
                    dst.partial.push(field);
                }
            }
        }
        // else dst is a full save, keep it that way
    } else if (dst.partial) {
        delete dst.partial;
    }

    return dst;
}

export default DS.Model.extend({
    pendingDelete: false,
    pendingSave: null,

    isDeleted: Ember.computed('currentState', 'pendingDelete', function() {
        return get(this._internalModel.currentState, 'isDeleted') || this.get('pendingDelete');
    }).readOnly(),

    save(options) {
        const isSaving = currentActionModel && currentActionModel.get('isSaving');
        const isExtra = options && options.adapterOptions &&
                        options.adapterOptions.coalesce &&
                        options.adapterOptions.coalesce.type === 'extra';
        if (isSaving && !isExtra) {
            // allow coalesced requests through since we're inside the main save call
            let pendingSave = this.get('pendingSave');
            if (pendingSave) {
                pendingSave.options = mergeSaveOptions(pendingSave.options, options);
            } else {
                pendingSave = {
                    resolver: Ember.RSVP.defer(),
                    options: options
                };
                this.set('pendingSave', pendingSave);
                modelActionQueue.push(this);
            }
            return pendingSave.resolver.promise;
        }

        currentActionModel = this;

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
    },

    deleteRecord() {
        if (this.get('isSaving')) {
            this.set('pendingDelete', true);
        }
        return this._super(...arguments);
    },

    reload() {
        if (this.get('isSaving')) {
            // record is inFlight, so wait for the request to finish and return
            // this instance
            return DS.PromiseObject.create({
                promise: Ember.RSVP.Promise((resolve, reject) => {
                    this.one('didCommit', () => {
                        resolve(this);
                        resolve = reject = Ember.K;
                    });
                    this.one('becameInvalid', () => {
                        resolve(this);
                        resolve = reject = Ember.K;
                    });
                    this.one('becameError', Ember.run.next, () => {
                        reject(this.get('adapterError'));
                        resolve = reject = Ember.K;
                    });
                })
            });
        }
        return this._super(...arguments);
    },

    set(key) {
        this._clearPendingDelete(key);
        this._super(...arguments);
    },

    setProperties(hash) {
        this._clearPendingDelete(...Object.keys(hash));
        this._super(...arguments);
    },

    runActions: Ember.on('didCommit', function() {
        // run in the next run loop so that any other events that may modify
        // the state of the instance have a chance to run first.
        if (currentActionModel === this) {
            currentActionModel = null;
            Ember.run.next(Ember.run.once, runActions);
        }
    }),

    clearPendingAndRunActions: Ember.on('becameError', 'becameInvalid', function() {
        this.setProperties({
            pendingDelete: false,
            pendingSave: null,
        });
        this.runActions();
    }),

    _clearPendingDelete(...keys) {
        if (this.get('pendingDelete')) {
            for (let key of keys) {
                if (!['pendingDelete', 'pendingSave'].includes(key)) {
                    // just to be safe cancel the delete so we don't lose data
                    this.set('pendingDelete', false);
                    break;
                }
            }
        }
    }
});
