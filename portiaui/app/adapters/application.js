import Ember from "ember";
import DS from "ember-data";
import UrlTemplates from "ember-data-url-templates";

const DELETED_EXTENSION = 'https://portia.scrapinghub.com/jsonapi/extensions/deleted';
const UPDATES_EXTENSION = 'https://portia.scrapinghub.com/jsonapi/extensions/updates';

function filter_update_errors(errors, pointer) {
    return errors.filter(data =>
        !data.source || !data.source.pointer ||
        data.source.pointer.startsWith(pointer)
    ).map(data => {
        if (!data.source || !data.source.pointer) {
            return data;
        }
        return Ember.assign({}, data, {
            source: {
                pointer: data.source.pointer.slice(pointer.length - 1)
            }
        });
    });
}

export default DS.JSONAPIAdapter.extend(UrlTemplates, {
    extractedItems: Ember.inject.service(),
    savingNotification: Ember.inject.service(),
    uiState: Ember.inject.service(),

    findRecordUrlTemplate: '{+host}{+selfLink}',
    createRecordUrlTemplate: '{+host}{+relatedLink}',
    updateRecordUrlTemplate: '{+host}{+selfLink}',
    deleteRecordUrlTemplate: '{+host}{+selfLink}',

    urlSegments: {
        selfLink(type, id, snapshot /*, query */) {
            // return the self link returned by a previous response, when the
            // record was included in a relationship request or a json api
            // compound document.
            return snapshot._internalModel._links.self;
        },

        relatedLink(type, id, snapshot /*, query */) {
            // find a one to many relationship to the record and use it's
            // related link.
            const relationships = [];
            snapshot.eachRelationship((name, relationship) => {
                relationships.push([name, relationship]);
            });
            for (let [name, relationship] of relationships) {
                if (relationship.kind !== 'belongsTo') {
                    continue;
                }
                const relatedSnapshot = snapshot.belongsTo(name);
                if (!relatedSnapshot) {
                    continue;
                }
                const relatedRecord = relatedSnapshot._internalModel;
                const inverseRelationship = snapshot.record.inverseFor(name);
                if (inverseRelationship.kind !== 'hasMany') {
                    continue;
                }
                const inverseName = inverseRelationship.name;
                const manyRelationship = relatedRecord._relationships.get(inverseName);
                if (manyRelationship.link) {
                    return manyRelationship.link.split('?', 1)[0];
                }
            }
        }
    },

    createRecord(store, type, snapshot) {
        // TODO: remove when ds-improved-ajax feature is enabled
        const request = this._requestFor({
            store, type, snapshot,
            requestType: 'createRecord'
        });
        return this._makeRequest(request);
    },

    updateRecord(store, type, snapshot) {
        // TODO: remove when ds-improved-ajax feature is enabled
        const request = this._requestFor({
            store, type, snapshot,
            requestType: 'updateRecord'
        });
        return this._makeRequest(request);
    },

    deleteRecord(store, type, snapshot) {
        // TODO: remove when ds-improved-ajax feature is enabled
        const request = this._requestFor({
            store, type, snapshot,
            requestType: 'deleteRecord'
        });
        return this._makeRequest(request);
    },

    dataForRequest(params) {
        // TODO: use _super when ds-improved-ajax feature is enabled
        let {store, type, snapshot, requestType} = params;
        type = type || (snapshot && snapshot.type);
        const serializer = store.serializerFor(type.modelName);
        let data = {};

        switch (requestType) {
            case 'createRecord':
                serializer.serializeIntoHash(data, type, snapshot, {
                    includeId: true
                });
                break;

            case 'updateRecord':
                // allow partial updates by specifying adapterOptions.partial
                serializer.serializeIntoHash(data, type, snapshot, {
                    includeId: true,
                    partial: snapshot.adapterOptions && snapshot.adapterOptions.partial
                });
                break;

            case 'deleteRecord':
                data = undefined;
                break;

            default:
                data = this._super(...arguments);
                break;
        }

        // merge data from sub-requests for updates extension
        if (requestType === 'createRecord' || requestType === 'updateRecord' ||
                requestType === 'deleteRecord') {
            const coalesce = snapshot.adapterOptions && snapshot.adapterOptions.coalesce;
            if (coalesce && coalesce.type === 'main') {
                const coalesced = [];
                if (coalesce.updates) {
                    for (let {data} of coalesce.updates) {
                        coalesced.push(data.data);
                    }
                }

                data = Ember.assign(data || {}, {
                    links: {
                        profile: [UPDATES_EXTENSION]
                    },
                    aliases: {
                        updates: UPDATES_EXTENSION
                    },
                    meta: {
                        updates: coalesced
                    }
                });
            }
        }

        return data;
    },

    methodForRequest(params) {
        // TODO: remove when ds-improved-ajax feature is enabled
        switch (params.requestType) {
            case 'createRecord': return 'POST';
            case 'updateRecord': return 'PATCH';
            case 'deleteRecord': return 'DELETE';
        }
        return 'GET';
    },

    urlForRequest(params) {
        // TODO: remove when ds-improved-ajax feature is enabled
        let {type, id, snapshot, requestType} = params;
        type = type || (snapshot && snapshot.type);
        id = id || (snapshot && snapshot.id);
        if (requestType === 'createRecord' || requestType === 'updateRecord' ||
                requestType === 'deleteRecord') {
            return this.buildURL(type.modelName, id, snapshot, requestType);
        }
        return this._super(...arguments);
    },

    headersForRequest(params) {
        const headers = this.get('headers') || {};
        const profiles = [];
        const acceptProfiles = [DELETED_EXTENSION];
        if (params.snapshot.adapterOptions && params.snapshot.adapterOptions.coalesce) {
            profiles.push(UPDATES_EXTENSION);
            acceptProfiles.push(UPDATES_EXTENSION);
        }
        if (profiles.length) {
            headers['Content-Type'] = `application/vnd.api+json; profile="${profiles.join(' ')}"`;
        } else {
            headers['Content-Type'] = 'application/vnd.api+json';
        }
        if (acceptProfiles.length) {
            headers['Accept'] = `application/vnd.api+json; profile="${acceptProfiles.join(' ')}"`;
        } else {
            headers['Accept'] = 'application/vnd.api+json';
        }
        return headers;
    },

    _requestFor(params) {
        // TODO: use _super when ds-improved-ajax feature is enabled
        const method = this.methodForRequest(params);
        const url = this.urlForRequest(params);
        const headers = this.headersForRequest(params);
        const data = this.dataForRequest(params);
        const request = { method, url, headers, data };

        return Ember.assign(request, {
            store: params.store,
            type: params.type,
            snapshot: params.snapshot,
            requestType: params.requestType
        });
    },

    _makeRequest(request) {
        // TODO: use _super instead of this.ajax when ds-improved-ajax feature is enabled
        const {requestType} = request;
        if (requestType === 'createRecord' || requestType === 'updateRecord' ||
                requestType === 'deleteRecord') {
            const {method, url, data, store, type, snapshot} = request;
            let promise;

            const coalesce = snapshot.adapterOptions && snapshot.adapterOptions.coalesce;
            if (coalesce) {
                const {type: coalesceType, updates} = coalesce;

                if (coalesceType === 'main') {
                    // the main request of the bulk operation, resolve the promises
                    // for the included models when this promise resolves
                    promise = this.ajax(url, method, request);
                    promise.then(response => {
                        const serializer = store.serializerFor(type.modelName);
                        const requests = {};
                        const responses = {};

                        for (let {type, snapshot} of updates) {
                            const modelName = type.modelName;
                            const id = snapshot.id;
                            const type_requests = requests[modelName] || (
                                requests[modelName] = {});
                            type_requests[id] = true;
                        }

                        let aliases = this._getExtentionAliases(response, UPDATES_EXTENSION);
                        if (aliases.length && response.meta) {
                            for (let alias of aliases) {
                                for (let update of response.meta[alias]) {
                                    const normalized = serializer._normalizeResourceHelper(update);
                                    const {type, id} = normalized;
                                    if (!requests[type] || !requests[type][id]) {
                                        const error = new DS.AdapterError([{
                                            title: "Unexpected update confirmation",
                                            detail: `${response}`
                                        }], "JSON API updates response contained " +
                                            "confirmations for resources that were not " +
                                            "requested.");
                                        for (let {resolver} of updates) {
                                            resolver.reject(error);
                                        }
                                        throw error;
                                    }
                                    const type_responses = responses[type] || (
                                        responses[type] = {});
                                    type_responses[id] = update;
                                }
                            }
                        }

                        // treat deleted as update confirmations
                        aliases = this._getExtentionAliases(response, DELETED_EXTENSION);
                        if (aliases.length && response.meta) {
                            for (let alias of aliases) {
                                for (let deleted of response.meta[alias]) {
                                    const normalized = serializer._normalizeResourceHelper(deleted);
                                    const {type, id} = normalized;
                                    if (requests[type] && requests[type][id]) {
                                        const type_responses = responses[type] || (
                                            responses[type] = {});
                                        type_responses[id] = deleted;
                                    }
                                }
                            }
                        }

                        if (response.included) {
                            const filtered_included = [];
                            for (let included of response.included) {
                                const normalized =
                                    serializer._normalizeResourceHelper(included);
                                const {type, id} = normalized;
                                if (responses[type]) {
                                    if (responses[type][id]) {
                                        responses[type][id] = included;
                                    }
                                } else {
                                    filtered_included.push(included);
                                }
                            }
                            response.included = filtered_included;
                        }

                        for (let {type, snapshot, resolver} of updates) {
                            const modelName = type.modelName;
                            const id = snapshot.id;
                            if (responses[modelName] && responses[modelName][id]) {
                                resolver.resolve({
                                    data: responses[modelName][id]
                                });
                                continue;
                            }
                            resolver.reject(new DS.AdapterError([{
                                title: "Missing update confirmation",
                                detail: `${response}`
                            }], "JSON API updates response was missing confirmation for " +
                                "an updated resource"));
                        }

                        return response;
                    }, error => {
                        for (let i = 0; i < updates.length; i++) {
                            const {resolver} = updates[i];
                            const pointer = `/meta/updates/${i}/`;
                            const modelError = new error.constructor(
                                filter_update_errors(error.errors, pointer),
                                error.message);
                            resolver.reject(modelError);
                        }
                    });
                } else {
                    // a sub-request of the bulk operation, return a promise that
                    // will be resolved when the main request completes.
                    const resolver = Ember.RSVP.defer();
                    updates.push({
                        type,
                        snapshot,
                        data,
                        resolver
                    });
                    return resolver.promise;
                }
            } else {
                promise = this.ajax(url, method, request);
            }

            // handle our custom json api extension for listing records that were
            // deleted in the backend and should be unloaded.
            promise.then(response => {
                const aliases = this._getExtentionAliases(response, DELETED_EXTENSION);
                if (aliases.length && response.meta) {
                    const serializer = store.serializerFor(type.modelName);
                    for (let alias of aliases) {
                        for (let deleted of response.meta[alias]) {
                            const normalized = serializer._normalizeResourceHelper(deleted);
                            const record = store.peekRecord(normalized.type, normalized.id);
                            if (record) {
                                if (record.get('isSaving')) {
                                    record.one('didCommit', record.unloadRecord);
                                } else {
                                    record.unloadRecord();
                                }
                            }
                        }
                    }
                }
                return response;
            });

            // update saving status
            this.get('savingNotification').start();
            promise.finally(() => {
                this.get('savingNotification').end();
                // this.get('extractedItems').update();
                const project = this.get('uiState.models.project');
                if (project) {
                    project.markChanged();
                }
            });

            return promise;
        }

        return this.ajax(request.url, request.method, request);
    },

    _getExtentionAliases(response, extention) {
        const aliases = [];
        if (response && response.links && response.links.profile &&
            response.links.profile.includes(extention)) {
            for (let alias of Object.keys(response.aliases)) {
                if (response.aliases[alias] === extention) {
                    aliases.push(alias);
                }
            }
        }
        return aliases;
    },

    ajaxOptions(url, method, request = {}) {
        // TODO: move to _requestToJQueryAjaxHash when ds-improved-ajax feature is enabled
        const {headers} = request;
        const options = Ember.assign({}, request);
        delete options.method;
        delete options.url;
        delete options.headers;

        const hash = this._super(url, method, options);

        if (headers) {
            hash.contentType = headers['Content-Type'];
            delete headers['Content-Type'];

            hash.beforeSend = function(xhr) {
                Object.keys(headers).forEach((key) =>  xhr.setRequestHeader(key, headers[key]));
            };
        }
        return hash;
    }
});
