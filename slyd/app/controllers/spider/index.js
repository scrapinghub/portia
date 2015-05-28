import Ember from 'ember';
import SpiderController from '../spider';

export default SpiderController.extend({
    queryParams: ['url', 'baseurl'],
    url: null,
    baseurl: null,

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

    _breadCrumb: null,

    willEnter: function() {
        this._super();
        if (this.url) {
            this.fetchQueryUrl();
        }
    }
});
