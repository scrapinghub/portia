import Ember from 'ember';
import {computedPropertiesEqual} from '../utils/computed';

export default Ember.Component.extend({
    tagName: 'li',
    classNameBindings: ['active'],

    active: computedPropertiesEqual('toolId', 'group.selected'),

    didInsertElement() {
        if (!this.$().prev().length) {
            Ember.run.schedule('afterRender', () => {
                if (!this.get('group.selected')) {
                    this.send('selectTab');
                }
            });
        }
    },

    actions: {
        selectTab() {
            this.get('group').send('selectTab', this.get('toolId'));
        }
    }
});
