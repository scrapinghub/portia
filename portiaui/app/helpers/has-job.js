import Ember from 'ember';

export default Ember.Helper.extend({
    jobQ: Ember.inject.service(),

    onJobCountChange: Ember.observer('jobQ.jobs.count', function() {
        this.recompute();
    }),

    compute(params) {
        const spider = params[0];
        return this.get('jobQ.jobs').countForSpider(spider.get('id')) > 0;
    }
});
