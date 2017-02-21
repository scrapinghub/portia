import Ember from 'ember';

export function includes([list, value]) {
    return list && list.includes && list.includes(value);
}

export default Ember.Helper.helper(includes);
