import Ember from 'ember';

export function objectGet([obj, key]/*, hash*/) {
    return Ember.String.htmlSafe(obj[key]);
}

export default Ember.Helper.helper(objectGet);
