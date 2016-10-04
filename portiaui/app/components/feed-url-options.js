import Ember from 'ember';
import { cleanUrl } from '../utils/utils';

export default Ember.Component.extend({
    bitbucketUrl: "https://bitbucket.org/!api/2.0/snippets/scrapinghub/" +
                  "8jd9R/a3c1a658db0c6deb2a1ceb0a837b800808dab5c1/files/snippet.txt",
    actions: {
        saveFeedUrl() {
            const url = cleanUrl(this.get('startUrl.url'));
            this.set('startUrl.url', url);
            this.get('saveSpider')();
        }
    }

});
