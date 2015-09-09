import Ember from 'ember';
import { toType } from '../utils/types';

export default Ember.Component.extend({
    tagName: '',
    position: 0,
    depth: -1,

    setDepth: function () {
        this.set('depth', this.getWithDefault('depth', -1) + 1);
    }.on('init'),

    isObject: Ember.computed('json', function () {
        return this._isObject(this.get('json'));
    }),

    isArray: Ember.computed('json', function () {
        return this._isArray(this.get('json'));
    }),

    isObjectOrArray: Ember.computed('isArray', 'isObject', function () {
        return this.get('isObject') || this.get('isArray');
    }),

    fromKey: Ember.computed('from', function () {
        return this.get('from') === 'key';
    }),

    comma: Ember.computed('position', 'parent', function () {
        return this.get('position') < this.get('maxPosition') - 1 ? ',' : '';
    }),

    depthSpaces: Ember.computed('depth', 'isObjectOrArray', 'length', function () {
        if (this.get('isObjectOrArray') && !this.get('length')) {
            return '';
        }
        return '  '.repeat(this.get('depth'));
    }),

    depthPlus1Spaces: Ember.computed('depth', function () {
        return '  '.repeat(this.get('depth') + 1);
    }),

    openingCharacter: Ember.computed('isObjectOrArray', function () {
        if (this.get('isArray')) {
            return '[';
        } else if (this.get('isObject')) {
            return '{';
        }
    }),

    closingCharacter: Ember.computed('isObjectOrArray', function () {
        if (this.get('isArray')) {
            return ']';
        } else if (this.get('isObject')) {
            return '}';
        }
    }),

    maxPosition: Ember.computed('json', function () {
        var parent = this.get('parent');
        if (parent) {
            return this._objLength(parent);
        }
        return -1;
    }),

    length: Ember.computed('json', function () {
        return this._objLength(this.get('json'));
    }),

    openChild: Ember.computed('json', function () {
        var child,
            json = this.get('json');
        if (this.get('isObject')) {
            child = json[Object.keys(json)[0]];
        } else if (this.get('isArray')) {
            child = json.get(0);
        }
        if (child) {
            return this._openNext(child);
        }
    }),

    openSibling: Ember.computed('json', 'parent', 'position', function () {
        var sibling,
            parent = this.get('parent'),
            position = this.get('position');
        if (parent && position < parent.length - 1) {
            if (this._isObject(parent)) {
                sibling = parent[Object.keys(parent)[position + 1]];
            } else if (this._isArray(parent)) {
                sibling = parent.get(position + 1);
            }
            if (sibling) {
                return this._openNext(sibling);
            }
        }
    }),

    showOpen: Ember.computed('json', function () {
        if ((this.get('isObject') && this.get('from') !== 'array') ||
            (this.get('isArray') && this.get('from') !== 'object')) {
            return true;
        }
        return false;
    }),

    _openNext: function (next) {
        if (this._isObject(next)) {
            return '{';
        } else if (this._isArray(next)) {
            return '[';
        }
    },

    _isObject: function (obj) {
        return toType(obj) === 'object';
    },

    _isArray: function (obj) {
        return Array.isArray(obj);
    },

    _objLength: function (obj) {
        if (this._isObject(obj)) {
            return Object.keys(obj).length;
        } else if (this._isArray(obj)) {
            return obj.length;
        }
    }
});
