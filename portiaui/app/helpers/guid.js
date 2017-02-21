import Ember from 'ember';

export function guid([obj]/*, hash*/) {
    return Ember.guidFor(obj);
}

export default Ember.Helper.helper(guid);
