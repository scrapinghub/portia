import DS from 'ember-data';
import BaseModel from './base';
import { memberAction } from 'ember-api-actions';

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
    name: DS.attr('string'),
    spiders: DS.hasMany(),
    schemas: DS.hasMany(),
    extractors: DS.hasMany(),

    hasChanges: false,

    status: memberAction({path: 'status', type: 'GET'}),
    publish: memberActionAndMarkClean({path: 'publish'}),
    copy: memberActionAndMarkClean({path: 'copy', type: 'POST'}),
    reset:  memberActionAndMarkClean({path: 'reset'}),

    checkChanges() {
        return this.status().then(status => {
            const hasChanges = !!(status && status.meta && status.meta.changes &&
                                  status.meta.changes.length);
            this.set('hasChanges', hasChanges);
            return this;
        });
    },

    markClean() {
        this.set('hasChanges', false);
    },

    markChanged() {
        this.set('hasChanges', true);
    }
});

export default Project;
