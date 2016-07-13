import Ember from 'ember';
const { run } = Ember;

const Jobs = Ember.Object.extend({
    endpoint() {
        return `http://storage.scrapinghub.com/jobq/${this.get('projectId')}/` +
               `summary/running?apikey=${cookie.get('apikey')}`;
    },

    countForSpider(spider) {
        let filterSpider = spider || this.get('currentSpider');
        return this.get('data').filterBy('spider', filterSpider).length;
    },

    update(response) {
        this.set('data', response.summary);
        this.set('count', response.count);
    }
});

export default Ember.Service.extend({
    ajax: Ember.inject.service(),

    timer: null,
    interval: 10000,
    jobs: Jobs.create({ count: 0, data: [] }),

    start(projectId, currentSpider, interval) {
        this.stop();

        this.set('jobs.currentSpider', currentSpider);
        this.set('jobs.projectId', projectId);
        this.queryEndpoint();

        this.set('timer', this.schedule(this.queryEndpoint, interval));
    },

    queryEndpoint() {
        const jobs = this.get('jobs');
        this.get('ajax').request(jobs.endpoint()).then((data) => {
            jobs.update(data[0]);
        }).catch(() => {});
    },

    stop() {
        if (this.get('timer')) {
            run.cancel(this.get('timer'));
        }
    },

    schedule(f, interval) {
        const time = interval || this.get('interval');
        return run.later(() => {
            f.apply(this);
            this.set('timer', this.schedule(f, interval));
        }, time);
    }
});
