import Ember from 'ember';
import DS from 'ember-data';


const Sample = DS.Model.extend({
    name: DS.attr('string'),
    spider: DS.belongsTo(),
    items: DS.hasMany({
        async: true
    }),

    orderedAnnotations: Ember.computed('items.@each.orderedAnnotations', function() {
        return [].concat(...this.get('items').mapBy('orderedAnnotations'));
    })
});

Sample.reopenClass({
    FIXTURES: [
        {
            id: 't1',
            name: 'buy-owls-online',
            spider: 's1',
            items: [
                'ti1'
            ]
        }
    ]
});

export default Sample;
