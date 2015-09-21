import Ember from 'ember';
import DS from 'ember-data';
import {getColors} from '../utils/colors';


const Sample = DS.Model.extend({
    name: DS.attr('string'),
    spider: DS.belongsTo(),
    items: DS.hasMany({
        async: true
    }),

    annotationColors: Ember.computed('orderedAnnotations', function() {
        const annotations = this.get('orderedAnnotations');
        return annotations ? getColors(annotations.length + 1) : [];  // +1 for hover color
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
