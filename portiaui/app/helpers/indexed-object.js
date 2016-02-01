import Ember from 'ember';

export function indexedObject([ param ] /*, hash*/) {
    let indexed = {}, i = 0;
    for (let key of Object.keys(param)) {
        indexed[key] = {
            index: i,
            value: param[key]
        };
        i += 1;
    }
    return indexed;
}

export default Ember.Helper.helper(indexedObject);
