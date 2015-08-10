import Ember from 'ember';

export function isArray([object]) {
  return Array.isArray(object);
}

export default Ember.Helper.helper(isArray);
