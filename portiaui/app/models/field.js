import DS from 'ember-data';
import BaseModel from './base';

export const FIELD_TYPES = [
    'date', 'geopoint', 'image', 'number', 'price', 'raw html', 'safe html', 'text', 'url'];

export default BaseModel.extend({
    name: DS.attr('string'),
    type: DS.attr('string'),
    required: DS.attr('boolean'),
    vary: DS.attr('boolean'),
    schema: DS.belongsTo({
        async: true
    }),
    annotations: DS.hasMany({
        async: true
    })
});
