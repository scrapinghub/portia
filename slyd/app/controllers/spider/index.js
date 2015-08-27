import Ember from 'ember';
import BaseController from '../base-controller';
import SpriteStore from '../../utils/sprite-store';

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

    willEnter: function() {
        this.get('documentView').config({
            mode: 'browse',
            listener: this,
        });
    },

    willLeave: function() {
        this.set('documentView.sprites', new SpriteStore());
        this.get('documentView').hideLoading();
        this.get('documentView.ws').send({'_command': 'close_tab'});
    },
});
