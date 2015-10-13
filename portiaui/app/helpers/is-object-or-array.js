import Ember from 'ember';
import { isArrayHelper } from 'ember-truth-helpers/helpers/is-array';
import { isObject } from './is-object';

export function isObjectOrArray(params) {
    return isObject(params) || isArrayHelper(params);
}

export default Ember.Helper.helper(isObjectOrArray);
