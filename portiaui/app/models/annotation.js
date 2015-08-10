import DS from 'ember-data';

const Annotation = DS.Model.extend({
    name: DS.attr('string'),
    parent: DS.belongsTo('item', {
        inverse: 'annotations'
    }),
    type: DS.attr('string')
});

Annotation.reopenClass({
    FIXTURES: [
        {
            id: 'a1',
            name: 'name',
            type: 'text',
            parent: 'ti1'
        },
        {
            id: 'a2',
            name: 'price',
            type: 'price',
            parent: 'ti1'
        },
        {
            id: 'a3',
            name: 'description',
            type: 'text',
            parent: 'ti1'
        },
        {
            id: 'a4',
            name: 'property',
            type: 'text',
            parent: 'ti2'
        },
        {
            id: 'a5',
            name: 'value',
            type: 'text',
            parent: 'ti2'
        }
    ]
});

export default Annotation;
