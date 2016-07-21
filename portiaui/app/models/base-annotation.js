import { belongsTo } from 'ember-data/relationships';
import BaseModel from './base';

export default BaseModel.extend({
    parent: belongsTo('item', {
        inverse: 'annotations'
    })
});
