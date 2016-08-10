import DS from 'ember-data';
import BaseModel from './base';

export default BaseModel.extend({
    type: DS.attr('string'),
    value: DS.attr('string'),
    project: DS.belongsTo(),
    annotations: DS.hasMany()
});
