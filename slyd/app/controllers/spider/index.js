import Ember from 'ember';
import BaseController from '../base-controller';

export default BaseController.extend({
    queryParams: ['url', 'baseurl', 'rmt'],
    needs: ['spider'],
    url: null,
    baseurl: null,
    rmt: null,

    fetchQueryUrl: function() {
        if(this.get('url')) {
            var url = this.url, baseurl = this.baseurl;
            this.set('url', null);
            this.set('baseurl', null);
            Ember.run.next(this, function() {
                this.get('controllers.spider').loadUrl(url, baseurl);
            });
        }
    }.observes('url'),

    removeTemplate: function() {
        if (this.get('rmt')) {
            this.get('controllers.spider.model.template_names').removeObject(this.get('rmt'));
            this.set('rmt', null);
        }
    }.observes('rmt'),

    _breadCrumb: null,
});
