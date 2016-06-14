import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',
    fragments: computed.alias('startUrl.fragments'),

    url: computed('startUrl.url', 'fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').toString();
    }),
    startUrlIndex: computed('startUrl', 'spider', function() {
        return this.get('spider.startUrls').indexOf(this.get('startUrl'));
    }),

    actions: {
        removeStartUrl() {
            const spider = this.get('spider');
            spider.get('startUrls').removeObject(this.get('startUrl'));
            this.get('closeOptions')();
        }
    }
});
