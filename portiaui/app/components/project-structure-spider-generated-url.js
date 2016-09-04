import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    tagName: '',

    fragments: computed.alias('startUrl.fragments'),
    url: computed('startUrl.url', 'fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').toString();
    })
});
