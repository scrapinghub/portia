import Ember from 'ember';
import { isObject, isArray } from '../utils/types';

export function isConflict(obj) {
    return isObject(obj) && "__CONFLICT" in obj;
}

function toString(v) {
    var res = (JSON.stringify(v) || '').trim();
    if(res.length > 550) {
        res = res.substring(0, 500) + '..."';
    }
    return res;
}

export default Ember.Component.extend({
    tagName: 'span',
    json: null,
    path: '',

    init: function(){
        this._super();
        if(this.get('isConflict')) {
            this.set('accepted', []);
            this.set('rejected', []);
            this.sendUpdateAction();
        }
    },

    v: function(json) {
        if (isArray(json)) {
            return json.map(v => toString(v)).join(', ');
        } else {
            return toString(json);
        }
    },

    isObject: function() {
        return isObject(this.get('json'));
    }.property('json'),

    isArray: function() {
        return Array.isArray(this.get('json'));
    }.property('json'),

    isConflict: function() {
        return isConflict(this.get('json'));
    }.property('json'),

    conflictValues: function(){
        var obj = Ember.Object.create().setProperties(this.get('json'));
        var values = [
            { key: 'base_val', value: this.v(Ember.get(obj, '__CONFLICT.base_val')), label: 'Original'},
            { key: 'my_val', value: this.v(Ember.get(obj, '__CONFLICT.my_val')), label: 'Your change'},
            { key: 'other_val', value: this.v(Ember.get(obj, '__CONFLICT.other_val')), label: 'Other change'}
        ];
        for (var v of values) {
            v.accepted = this.get('accepted').contains(v.key);
            v.rejected = this.get('rejected').contains(v.key);
        }
        return values;
    }.property('json', 'accepted.[]', 'rejected.[]'),

    isResolved: Ember.computed('accepted.[]', 'rejected.[]', function() {
        return this.get('multi') ?
            (this.get('accepted').length + this.get('rejected').length) === 3:
            this.get('accepted').length >= 1;
    }),

    resolvedValue: Ember.computed('accepted.[]', 'rejected.[]', function() {
        if(!this.get('isConflict') || !this.get('isResolved')) {
            return null;
        }
        var accepted = this.get('accepted');
        if (this.get('multi')) {
            return [].concat(...accepted.map(k => this.get('json.__CONFLICT.' + k)));
        } else {
            return this.get('json.__CONFLICT.' + accepted[0]);
        }
    }),


    resolvedRepr: Ember.computed('resolvedValue', function() {
        return this.v(this.get('resolvedValue'));
    }),

    value: function() {
        return this.v(this.get('json'));
    }.property('json'),

    entries: Ember.computed('json', function() {
        var json = this.get('json');
        if (json) {
            if (this.get('isArray')) {
                var idx = -1;
                return json.map(data => {
                    if (isConflict(data)) {
                        idx += 1;
                        var a =  {
                            conflict: true,
                            key: idx,
                            path: this.get('path') + '.' + idx,
                            json: data
                        };
                        return a;
                    } else {
                        return {
                            value: toString(data)
                        };
                    }
                });
            }
            return Object.keys(json).sort().map(function(key) {
                return {
                    path: this.get('path') ? this.get('path') + '.' + key : key,
                    key: key,
                    json: json[key]
                };
            }.bind(this));
        } else {
            return null;
        }
    }),

    sendUpdateAction: function() {
        this.sendAction('update', this.get('path'), this.get('isResolved'), this.get('resolvedValue'));
    },

    actions: {
        conflictOptionSelected: function(option) {
            this.get('rejected').removeObject(option);
            this.get('accepted').pushObject(option);
            this.sendUpdateAction();
        },

        conflictOptionRejected: function(option) {
            this.get('accepted').removeObject(option);
            this.get('rejected').pushObject(option);
            this.sendUpdateAction();
        },

        reset: function() {
            this.set('accepted', []);
            this.set('rejected', []);
            this.sendUpdateAction();
        },
        update: function(){
            this.sendAction('update', ...arguments); // Bubble up
        }
    }
});
