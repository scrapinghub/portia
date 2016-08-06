import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    fields: DS.hasMany(),
    items: DS.hasMany()
});
