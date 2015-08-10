import DS from 'ember-data';
import Annotation from './annotation';

const ItemAnnotation = Annotation.extend({
    item: DS.belongsTo({
        async: true
    })
});

ItemAnnotation.reopenClass({
    FIXTURES: [
        {
            id: 'ia1',
            name: 'details',
            type: 'schema',
            parent: 'ti1',
            item: 'ti2'
        }
    ]
});

export default ItemAnnotation;
