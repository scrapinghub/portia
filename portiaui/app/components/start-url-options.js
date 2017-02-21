import Ember from 'ember';
const { computed } = Ember;
import { task, timeout } from 'ember-concurrency';

const SPIDER_DEBOUNCE = 1000;

export default Ember.Component.extend({
  startUrl: computed('spider.startUrls.[]', 'startUrlId', function() {
      return this.get('spider').get('startUrls').objectAt(this.get('startUrlId'));
  }),

  title: computed.alias('startUrl.optionsTitle'),

  saveSpider: task(function * () {
      yield timeout(SPIDER_DEBOUNCE);
      this.get('spider').save();
  }).restartable()
});
