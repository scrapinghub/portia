import Ember from 'ember';

// TODO: remove in ember 2.X, it's included
function eachInHelper([ object ], hash, blocks) {
    var objKeys, prop, i;
    objKeys = object ? Object.keys(object) : [];
    for (i = 0; i < objKeys.length; i++) {
        prop = objKeys[i];
        blocks.template.yieldItem(prop, [prop, object[prop]]);
    }
}

Ember.HTMLBars._registerHelper('each-in', eachInHelper);

export default eachInHelper;
