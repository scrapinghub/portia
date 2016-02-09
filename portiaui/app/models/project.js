import DS from 'ember-data';
import { memberAction } from 'ember-api-actions';

const Project =  DS.Model.extend({
    name: DS.attr('string'),
    spiders: DS.hasMany(),
    schemas: DS.hasMany(),

    status: memberAction({path: 'status', type: 'GET'}),
    publish: memberAction({path: 'publish'}),
    reset:  memberAction({path: 'reset'})
});

export default Project;
