import Ember from 'ember';
import { cleanUrl } from '../utils/utils';

export default Ember.Component.extend({
    feedLink: 'http://files.scrapinghub.com/portia/urls.txt',

    actions: {
        saveFeedUrl() {
            const url = cleanUrl(this.get('startUrl.url'));
            this.set('startUrl.url', url);
            this.get('saveSpider')();
        }
    }

});
