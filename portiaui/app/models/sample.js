import Ember from 'ember';
import DS from 'ember-data';

const Sample = DS.Model.extend({
    name: DS.attr('string'),
    url: DS.attr('string'),
    pageId: DS.attr('string'),
    pageType: DS.attr('string'),
    scrapes: DS.attr('string'),
    spider: DS.belongsTo(),
    items: DS.hasMany(),

    orderedAnnotations: Ember.computed('items.content.@each.orderedAnnotations', function() {
        return [].concat(...this.get('items').mapBy('orderedAnnotations'));
    }),
    orderedChildren: Ember.computed('items.content.@each.orderedChildren', function() {
        return [].concat(...this.get('items').mapBy('orderedChildren'));
    })
});

Sample.reopenClass({
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z\s_-]/ig, '')
            .substring(0, 48)
            .trim()
            .replace(/\s+/g, '-');
    }
});

export default Sample;
