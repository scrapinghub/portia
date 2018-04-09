import Ember from 'ember';
import DS from 'ember-data';
import BaseModel from './base';
import { memberAction } from 'ember-api-actions';
const { inject: { service } } = Ember;

function memberActionAndMarkClean(options) {
    const method = memberAction(options);

    return function(payload) {
        return method.call(this, payload).then(result => {
            this.markClean();
            return result;
        });
    };
}

const Project =  BaseModel.extend({
    changes: service(),

    name: DS.attr('string'),
    spiders: DS.hasMany(),
    schemas: DS.hasMany(),
    extractors: DS.hasMany(),

    status: memberAction({path: 'status', type: 'GET'}),
    deploy: memberAction({path: 'deploy', type: 'POST'}),
    publish: memberActionAndMarkClean({path: 'publish'}),
    copy: memberActionAndMarkClean({path: 'copy', type: 'POST'}),
    reset:  memberActionAndMarkClean({path: 'reset'}),

    markClean() {
        this.set('changes.hasChanges', false);
    }
});

export default Project;
