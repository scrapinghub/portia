import Ember from 'ember';
const { computed } = Ember;
import { cleanUrl } from '../utils/utils';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    url: computed.alias('startUrl.url'),
    isEditing: computed.equal('url', ''),

    viewUrl: computed('url', {
        get() {
            return this.get('url');
        },
        set(key, value) {
            this.saveStartUrl(value);
        }
    }),

    saveStartUrl(url) {
        this.set('startUrl.url', cleanUrl(url));
        this.get('spider').save();
    }
});
