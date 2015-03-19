import Ember from 'ember';

export default Ember.Component.extend({
    data: {},
    project: null,

    url: function() {
        if (this.get('project')) {
            return [this.get('data.url'), 'p', this.get('project')].join('/');
        }
        return this.get('data.url');
    }.property('data.url', 'project')
});
