import Ember from 'ember';
import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';
import UrlTemplates from "ember-data-url-templates";

var SlydJSONAPIAdapter = DS.JSONAPIAdapter.extend(UrlTemplates, {
    extractedItems: Ember.inject.service(),
    savingNotification: Ember.inject.service(),
    uiState: Ember.inject.service(),

    baseTemplate: '{+host}/api/projects/',
    shouldReloadAll: () => true,
    _load_relationship: function(model, record, from, id) {
        if (from === model && !!id) {
            return id;
        }
        if (!record) {
            return undefined;
        }
        if (record._internalModel) {
            record = record._internalModel;
        }
        let relationships = record._relationships.initializedRelationships;
        if (relationships[model] && relationships[model].inverseRecord) {
            return relationships[model].inverseRecord.id;
        }
        if (relationships[model] && relationships[model].record) {
            return relationships[model].record.id;
        }
        for (let key of Object.keys(relationships)) {
            let model_id = this._load_relationship(model, relationships[key].inverseRecord);
            if (model_id) {
                return model_id;
            }
        }
    },

    _id_from_location: function(prefix) {
        let re = new RegExp(`/${prefix}/([^/]+)`),
            matches = re.exec(document.location.hash);
        if (matches) {
            return matches.slice(-1)[0];
        }
    },

    urlSegments: {
        project_id: function(from, id, snapshot) {
            return (this._load_relationship('project', snapshot, from, id) ||
                    this.get('uiState.projectRoute.currentModel.id') ||
                    this._id_from_location('projects'));
        },
        spider_id: function(from, id, snapshot) {
            return (this._load_relationship('spider', snapshot, from, id) ||
                    this.get('uiState.spiderRoute.currentModel.id') ||
                    this._id_from_location('spiders'));
        },
        schema_id: function(from, id,  snapshot) {
            return (this._load_relationship('schema', snapshot, from, id) ||
                    this.get('uiState.schemaRoute.currentModel.id') ||
                    this._id_from_location('schemas'));
        },
        sample_id: function(from, id, snapshot) {
            return (this._load_relationship('sample', snapshot, from, id) ||
                    this.get('uiState.sampleRoute.currentModel.id') ||
                    this._id_from_location('samples'));
        }
    },

    notifySaving(promise) {
        this.get('savingNotification').start();
        promise.finally(() => {
            this.get('savingNotification').end();
            this.get('extractedItems').update();
        });
        return promise;
    },

    createRecord() {
        return this.notifySaving(this._super(...arguments));
    },

    deleteRecord() {
        return this.notifySaving(this._super(...arguments));
    },

    updateRecord() {
        return this.notifySaving(this._super(...arguments));
    }
});

export function createAdapter(adapterMembers) {
    // Usage of the real API is disabled by default while finishing the new UI backend.
    // To activate:
    // localStorage['use_api'] = 1
    // Or add ?use_api to the URL
    // TODO: enable by default when backend is ready

    var apiOptIn = true; //((localStorage && localStorage['use_api']) ||
                    //location.search.indexOf('use_api') >= 0);
    if(!Ember.testing && apiOptIn) {
        return SlydJSONAPIAdapter.extend({
            urlTemplate: adapterMembers.urlTemplate
        });
    } else {
        return LFAdapter.extend({
            namespace: 'portia'
        });
    }
}
