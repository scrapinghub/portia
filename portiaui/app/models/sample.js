import Ember from 'ember';
import DS from 'ember-data';
import BaseModel from './base';

const Sample = BaseModel.extend({
    name: DS.attr('string'),
    url: DS.attr('string'),
    spider: DS.belongsTo(),
    items: DS.hasMany(),
    body: DS.attr('string', {
        default: 'original_body'
    }),

    orderedAnnotations: Ember.computed('items.content.@each.orderedAnnotations', function() {
        return [].concat(...this.get('items').mapBy('orderedAnnotations'));
    }),
    orderedChildren: Ember.computed('items.content.@each.orderedChildren', function() {
        return [].concat(...this.get('items').map(item => [item].concat(
            item.getWithDefault('orderedChildren', []))));
    })
});

Sample.reopenClass({
    normalizeTitle(title) {
        return title
            .trim()
            .replace(/[^a-z\s_-]/ig, '')
            .substring(0, 48)
            .trim()
            .replace(/\s+/g, ' ');
    }
});

export default Sample;
