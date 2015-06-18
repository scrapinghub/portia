import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'span',
    json: null,
    path: '',

    selectedOption: function() {
        return this.get('conflictedKeyPaths.'+this.get('path'));
    }.property('conflictedKeyPaths'),

    v: function(json) {
        if (json) {
            return JSON.stringify(json).trim().substring(0, 500);
        } else {
            return '';
        }
    },

    toType: function(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },

    isObject: function() {
        return this.toType(this.get('json')) === 'object';
    }.property('json'),

    isConflict: function() {
        return this.get('isObject') && '__CONFLICT' in this.get('json');
    }.property('json'),

    conflictValues: function() {
        return [
            { key: 'base_val', value: this.v(this.get('json.__CONFLICT.base_val')), label: 'Original' },
            { key: 'my_val', value: this.v(this.get('json.__CONFLICT.my_val')), label: 'Your change' },
            { key: 'other_val', value: this.v(this.get('json.__CONFLICT.other_val')), label: 'Other change' }
        ];
    }.property('json'),

    resolved: function() {
        return !!this.get('selectedOption');
    }.property('selectedOption'),

    resolvedValue: function() {
        return this.v(this.get('json.__CONFLICT.' + this.get('selectedOption')));
    }.property('selectedOption'),

    value: function() {
        return this.v(this.get('json'));
    }.property('json'),

    entries: function() {
        if (this.get('json')) {
            return Object.keys(this.get('json')).sort().map(function(key) {
                return {
                    path: this.get('path') ? this.get('path') + '.' + key : key,
                    key: key,
                    json: this.get('json')[key]
                };
            }.bind(this));
        } else {
            return null;
        }
    }.property('json'),

    actions: {
        conflictOptionSelected: function(path, option) {
            this.set('conflictedKeyPaths.'+path, option);
            this.sendAction('conflictOptionSelected', path, option);
            this.notifyPropertyChange('conflictedKeyPaths');
        }
    }
});