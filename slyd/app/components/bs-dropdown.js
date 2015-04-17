import Ember from 'ember';
import ModalHandler from '../mixins/modal-handler';

export default Ember.Component.extend(ModalHandler, {
    tagName: 'div',
    classNames: 'btn-group',
    classNameBindings: ['isOpen:open'],
    iconClasses: 'fa fa-icon fa-sliders',

    setUp: function() {
        this.set('isOpen', false);
        this.set('actions', this.getWithDefault('actions', []));
    }.on('init'),

    toggle: function() {
        return this.get('isOpen') ? 'open' : '';
    }.property('isOpen'),

    actions: {
        clicked: function() {
            this.set('isOpen', !this.get('isOpen'));
        },

        close: function() {
            this.set('isOpen', false);
        },

        openModal: function(action) {
            this.set('isOpen', !this.get('isOpen'));
            this.set('_modalName', 'name');
            this.showComponentModal(action.title, action.component);
        },

        closeModal: function() {
            this.set('isOpen', !this.get('isOpen'));
            return this.ModalManager.get('name').destroy();
        }
    }
});
