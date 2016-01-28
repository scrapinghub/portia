import Ember from 'ember';
import { toType } from '../utils/types';

export function isObject([object]) {
    return toType(object) === 'object';
}

export default Ember.Helper.helper(isObject);
