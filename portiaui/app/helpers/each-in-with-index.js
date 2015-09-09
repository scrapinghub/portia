import Ember from 'ember';

export function eachInWithIndexHelper([ object ], hash, blocks) {
    var objKeys, prop, i;
    objKeys = object ? Object.keys(object) : [];
    for (i = 0; i < objKeys.length; i++) {
        prop = objKeys[i];
        blocks.template.yieldItem(prop, [prop, object[prop], i]);
    }
}

Ember.HTMLBars._registerHelper('each-in-with-index', eachInWithIndexHelper);

export default eachInWithIndexHelper;
