import Ember from 'ember';
import utils from '../utils/utils';

export default Ember.Component.extend({
    tagName: Ember.computed('item', function() {
        var item = this.get('item'),
            isArrayOrObject = Array.isArray(item) || utils.toType(item) === 'object'
        return isArrayOrObject ? 'table' : '';
    }),
    classNames: ['extracted-item-table']
});
