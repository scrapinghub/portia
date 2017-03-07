import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    name: DS.attr('string'),
    default: DS.attr('boolean'),
    project: DS.belongsTo(),
    fields: DS.hasMany(),
    items: DS.hasMany()
});
