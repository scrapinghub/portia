import Ember from 'ember';
import DS from 'ember-data';
import LFAdapter from 'ember-localforage-adapter/adapters/localforage';

export function createAdapter(adapterMembers) {
    // Usage of the real API is disabled by default while finishing the new UI backend.
    // To activate:
    // localStorage['use_api'] = 1
    // Or add ?use_api to the URL
    // TODO: enable by default when backend is ready

    var apiOptIn = ((localStorage && localStorage['use_api']) ||
                    location.search.indexOf('use_api') >= 0);
    console.log(apiOptIn);
    if(!Ember.testing && apiOptIn) {
        return DS.RESTAdapter.extend(adapterMembers);
    } else {
        return LFAdapter.extend({
            namespace: 'portia'
        });
    }
}
