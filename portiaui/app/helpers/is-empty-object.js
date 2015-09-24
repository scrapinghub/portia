import Ember from 'ember';
import {isObject} from './is-object';

export function isEmptyObject(params) {
    return isObject(params) && !Object.keys(...params).length;
}

export default Ember.Helper.helper(isEmptyObject);
