import Ember from 'ember';

export function attrValue(attr) {
    return (!Ember.isNone(attr) && typeof attr === 'object' && 'value' in attr) ? attr.value : attr;
}

export function attrChanged(oldAttrs, newAttrs, key) {
    return !oldAttrs || attrValue(oldAttrs[key]) !== attrValue(newAttrs[key]);
}

export function attrChangedTo(oldAttrs, newAttrs, key, value) {
    return attrChanged(oldAttrs, newAttrs, key) && attrValue(newAttrs[key]) === value;
}

export default {
    attrValue,
    attrChanged,
    attrChangedTo
};
