import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
  startUrl: computed('spider.startUrls.[]', 'startUrlId', function() {
      return this.get('spider').get('startUrls').objectAt(this.get('startUrlId'));
  }),

  title: computed('startUrl.type', function() {
      if (this.get('startUrl.type') === 'generated') {
          return 'URL Generation';
      }
      return 'Feed';
  })
});
