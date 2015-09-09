import Ember from 'ember';
import { isArray } from './is-array';
import { isObject } from './is-object';

export function isObjectOrArray(params) {
    return isObject(params) || isArray(params);
}

export default Ember.Helper.helper(isObjectOrArray);
