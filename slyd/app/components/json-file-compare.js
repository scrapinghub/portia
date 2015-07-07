import Ember from 'ember';
import ConflictMixin from '../mixins/conflict-mixin';

export default Ember.Component.extend(ConflictMixin, {
    tagName: 'span',
    json: null,
    path: '',

    v: function(json) {
        var toString = function(v) {
            return JSON.stringify(v).trim().substring(0, 500).replace(/^"|"$/g, '');
        };
        if (json) {
            if (Array.isArray(json)) {
                return json.map(v => toString(v)).join(', ');
            } else {
                return toString(json);
            }
        } else {
            return '';
        }
    },

    isObject: function() {
        return this._isObject();
    }.property('json'),

    isArray: function() {
        return this._isArray();
    }.property('json'),

    isConflict: function() {
        return this._isConflict();
    }.property('json'),

    conflictValues: function(){
        var obj = Ember.Object.create().setProperties(this.get('json')),
            accepted = this.get('conflictedKeyPaths.'+this.get('path')+'.accepted'),
            rejected = this.get('conflictedKeyPaths.'+this.get('path')+'.rejected'),
            values = [
                { key: 'base_val', value: this.v(obj.get('__CONFLICT.base_val')), label: 'Original'},
                { key: 'my_val', value: this.v(obj.get('__CONFLICT.my_val')), label: 'Your change'},
                { key: 'other_val', value: this.v(obj.get('__CONFLICT.other_val')), label: 'Other change'}
            ];
        for (var v of values) {
            v.accepted = accepted.has(v.key);
            v.rejected = rejected.has(v.key);
        }
        return values;
    }.property('json', 'refresh'),

    resolved: function() {
        return this.get('conflictedKeyPaths.'+this.get('path')+'.resolved');
    }.property('refresh'),

    resolvedRepr: function() {
        return this.v(this.resolvedValue());
    }.property('resolved'),

    value: function() {
        return this.v(this.get('json'));
    }.property('json'),

    entries: function() {
        var json = this.get('json');
        if (json) {
            if (this._isArray()) {
                var idx = -1;
                return json.map(data => {
                    if (this._isObject(data) && '__CONFLICT' in data) {
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
                            value: data
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
    }.property('json'),

    actions: {
        conflictOptionSelected: function(path, option) {
            if (option) {
                this._conflictOptionSelected(path, option);
            } else {
                this._resetPath(path);
            }
            this.notifyPropertyChange('refresh');
        },

        conflictOptionRejected: function(path, option) {
            this._conflictOptionRejected(path, option);
            this.notifyPropertyChange('refresh');
        },

        conflictOptionUpdated: function(path, accepted, rejected) {
            this._conflictOptionUpdated(path, accepted, rejected);
            this.notifyPropertyChange('refresh');
        },
    }
});