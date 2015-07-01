import Ember from 'ember';

var CHOICES = new Set(['my_val', 'base_val', 'other_val']);

export default Ember.Mixin.create({
    _resetPath: function(path) {
        this.set('conflictedKeyPaths.'+path+'.accepted', new Set());
        this.set('conflictedKeyPaths.'+path+'.rejected', new Set());
        this._updateResolved(path);
        this._updatePath(path);
    },

    _conflictOptionUpdated: function(path, accepted, rejected) {
        this.set('conflictedKeyPaths.'+path+'.accepted', accepted);
        this.set('conflictedKeyPaths.'+path+'.rejected', rejected);
        this._updateResolved(path);
        this._updatePath(path);
    },

    _conflictOptionSelected: function(path, option) {
        if (!option) {
            return;
        }
        if (this.get('multi')) {
            this.get('conflictedKeyPaths.'+path+'.accepted').add(option);
            this.get('conflictedKeyPaths.'+path+'.rejected').delete(option);
        } else {
            this.set('conflictedKeyPaths.'+path+'.accepted', new Set([option]));
            var rejected = [];
            for (var opt of CHOICES) {
                if (opt !== option) {
                    rejected.push(opt);
                }
            }
            this.set('conflictedKeyPaths.'+path+'.rejected', new Set(rejected));
        }
        this._updateResolved(path);
        this._updatePath(path);
    },

    _conflictOptionRejected: function(path, option) {
        if (!option) {
            return;
        }
        this.get('conflictedKeyPaths.'+path+'.rejected').add(option);
        this.get('conflictedKeyPaths.'+path+'.accepted').delete(option);
        this._updateResolved(path);
        this._updatePath(path);
    },

    _updatePath: function(path) {
        try {
            this.sendAction('conflictOptionUpdated', path,
                            this.get('conflictedKeyPaths.'+path+'.accepted'),
                            this.get('conflictedKeyPaths.'+path+'.rejected'));
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
        }
        this.notifyPropertyChange('conflictedKeyPaths');
    },

    _updateResolved: function(path) {
        var accepted = this.get('conflictedKeyPaths.'+path+'.accepted'),
            rejected = this.get('conflictedKeyPaths.'+path+'.rejected'),
            resolved = accepted.size + rejected.size === 3;
        this.set('conflictedKeyPaths.'+path+'.resolved', resolved);
    },

    resolvedValue: function(obj, path) {
        obj = obj || this.get('json');
        path = path || this.get('path');
        var accepted = this.get('conflictedKeyPaths.'+path+'.accepted'),
            result = [];
        for (var opt of accepted) {
            var conflict = obj['__CONFLICT'],
                value = conflict[opt];
            if (value === null) {
                value = new result.constructor();
            }
            if (this._isArray(value)) {
                if (!this._isArray(result)) {
                    result = [result];
                }
                Array.prototype.push.apply(result, value);
            } else {
                if (this._isArray(result)) {
                    result.push(value);
                } else {
                    result += value;
                }
            }
        }
        if (this._isArray(result)) {
            return Array.from(new Set(result));
        }
        return result;
        // Get selected options and combine them if they are arrays. Concat if strings.
    },

    value: function(obj, option) {
        obj = obj || this.get('json');
        if (this._isConflict(obj)) {
            return obj.get('__CONFLICT.' + option);
        } else {
            return obj;
        }

    },

    toType: function(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },

    _isObject: function(obj) {
        obj = obj || this.get('json');
        return this.toType(obj) === 'object';
    },

    _isArray: function(obj) {
        obj = obj || this.get('json');
        return Array.isArray(obj);
    },

    _isConflict: function(obj) {
        obj = obj || this.get('json');
        return this.get('isObject') && '__CONFLICT' in obj;
    },

});
