import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    jobQ: Ember.inject.service(),

    jobs: computed.alias('jobQ.jobs'),

    jobCount: computed('jobs.count', function() {
        return this.get('jobs').countForSpider(this.get('spider.id'));
    }),

    isActive: computed.gt('jobCount', 0),

    badgeStyle: computed('jobCount', function() {
        return Ember.String.htmlSafe('background-color: #d9534f');
    })
});
