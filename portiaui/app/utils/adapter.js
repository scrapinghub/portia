import Ember from 'ember';
import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';
import UrlTemplates from "ember-data-url-templates";

var SlydJSONAPIAdapter = DS.JSONAPIAdapter.extend(UrlTemplates, {
    baseTemplate: '{+host}/api/projects/',
    shouldReloadAll: () => true,
    uiState: Ember.inject.service('ui-state'),
    _load_relationship: function(model, record) {
        if (!record) {
            return undefined;
        }
        if (record._internalModel) {
            record = record._internalModel;
        }
        let relationships = record._relationships.initializedRelationships;
        if (relationships[model]) {
            return relationships[model].inverseRecord.id;
        }
        for (let key of Object.keys(relationships)) {
            let model_id = this._load_relationship(model, relationships[key].inverseRecord);
            if (model_id) {
                return model_id;
            }
        }
    },

    urlSegments: {
        project_id: function(_, __, snapshot) {
            return (this._load_relationship('project', snapshot) ||
                    this.get('uiState.projectRoute.currentModel.id'));
        },
        spider_id: function(_, __, snapshot) {
            return (this._load_relationship('spider', snapshot) ||
                    this.get('uiState.spiderRoute.currentModel.id'));
        },
        schema_id: function(_, __, snapshot) {
            return (this._load_relationship('schema', snapshot) ||
                    this.get('uiState.schemaRoute.currentModel.id'));
        },
        sample_id: function(_, __, snapshot) {
            return (this._load_relationship('sample', snapshot) ||
                    this.get('uiState.sampleRoute.currentModel.id'));
        }
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
    console.log(apiOptIn);
    if(!Ember.testing && apiOptIn) {
        return SlydJSONAPIAdapter.extend({
            urlTemplate: adapterMembers.urlTemplate,
            uiState: Ember.inject.service(),
        });
    } else {
        return LFAdapter.extend({
            namespace: 'portia'
        });
    }
}
