import Ember from 'ember';
import { toType } from '../utils/types';

export default Ember.Component.extend({
    tagName: 'span',
    classNames: ['json-value'],
    attributeBindings: ['style'],
    depth: 0,

    isString: Ember.computed('value', function () {
        return toType(this.get('value')) === 'string';
    }),

    escapedValue: Ember.computed('value', function () {
        return JSON.stringify(this.get('value'));
    }),

    depthSpaces: Ember.computed('depth', function () {
        return '  '.repeat(this.get('depth'));
    }),

    fromArray: Ember.computed('from', function () {
        return this.get('from') === 'array';
    }),

    comma: Ember.computed('position', function () {
        return this.get('position') < this.get('maxPosition') - 1 ? ',' : '';
    }),

    style: Ember.computed('value', 'depth', 'key', 'from', function () {
        var textIndent = '', margin = '', marginLeft = 0,
            characterTest = Ember.$('.json-character-size'),
            textWidth = characterTest.width(),
            extractedBox = Ember.$('.extracted-items-json'),
            key = this.get('key') || '',
            value = this.get('escapedValue'),
            depth = this.get('depth');
        if (this.get('isString') &&
            ((depth + 1) * 2 + key.length + value.length + 4) * textWidth > extractedBox.width()) {
            var indent = key.length;
            if (this.get('fromArray')) {
                indent = 2 * (depth + 1);
                textIndent = `text-indent: -${indent}ch;`;
                margin = `margin: 0 0 0 ${indent}ch;`;
            } else {
                marginLeft = (depth + 1) * 2 + 2;
                textIndent = `text-indent: ${indent}ch;`;
                margin = `margin: -1.5em 0 0 ${marginLeft}ch;`;
            }
        }
        return `${textIndent}${margin}`;
    })
});
