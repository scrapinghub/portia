import Ember from 'ember';


export function isEqual([left, right]) {
  return left === right;
}

export default Ember.Helper.helper(isEqual);
