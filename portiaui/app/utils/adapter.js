import Ember from 'ember';
import DS from 'ember-data';
import UrlTemplates from "ember-data-url-templates";
import { isObject, isArray } from './types';

const SlydJSONAPIAdapter = DS.JSONAPIAdapter.extend(UrlTemplates, {
    extractedItems: Ember.inject.service(),
    savingNotification: Ember.inject.service(),
    uiState: Ember.inject.service(),

    baseTemplate: '{+host}/api/projects/',

    _getQueryParam(param, query) {
        if (query && query[param]) {
            const value = query[param];
            delete query[param];
            return value;
        }
    },

    _getSnapshotProperty: function(property, snapshot) {
        const path = property.split('_');
        while (snapshot) {
            const attribute = path.shift();
            if (!path.length) {
                if (attribute === 'id') {
                    return snapshot.id;
                }
                const attributes = snapshot.attributes();
                if (attribute in attributes) {
                    return attributes[attribute];
                }
                return;
            }

            try {
                snapshot = snapshot.belongsTo(attribute);
            } catch (e) {
                return;
            }
        }
    },

    urlSegments: {
        id(type, id, snapshot, query) {
            if (id && !isArray(id) && !isObject(id)) {
                return id;
            }
            return this._getQueryParam('id', query);
        },

        unknownProperty(key) {
            return function(type, id, snapshot, query) {
                return this._getQueryParam(key, query) || this._getSnapshotProperty(key, snapshot);
            };
        }
    },

    notifySaving(promise) {
        this.get('savingNotification').start();
        promise.finally(() => {
            this.get('savingNotification').end();
            this.get('extractedItems').update();
            const project = this.get('uiState.models.project');
            if (project) {
                project.markChanged();
            }
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

export default SlydJSONAPIAdapter;
