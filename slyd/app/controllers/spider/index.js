import Ember from 'ember';
import SpiderController from '../spider';

export default SpiderController.extend({
    queryParams: ['url', 'baseurl', 'rmt'],
    url: null,
    baseurl: null,
    rmt: null,

    queryUrl: function() {
        if (!this.url) {
            return;
        }
        this.fetchQueryUrl();
    }.observes('url'),

    fetchQueryUrl: function() {
        var url = this.url, baseurl = this.baseurl;
        this.set('url', null);
        this.set('baseurl', null)
        Ember.run.next(this, function() {
            this.fetchPage(url, null, true, baseurl);
        });
    },

    removeTemplate: function() {
        if (this.get('rmt')) {
            this.get('model.template_names').removeObject(this.get('rmt'));
            this.set('rmt', null);
        }
    }.observes('rmt'),

    _breadCrumb: null,

    willEnter: function() {
        this._super();
        if (this.url) {
            this.fetchQueryUrl();
        }
    }
});
