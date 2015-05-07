import Ember from 'ember';
import ModalHandler from '../mixins/modal-handler';

export default Ember.Component.extend(ModalHandler, {
    tagName: 'div',
    classNames: 'btn-group',
    classNameBindings: ['isOpen:open'],
    iconClasses: 'fa fa-icon fa-sliders',

    setUp: function() {
        this.close();
        this.set('actions', this.getWithDefault('actions', []));
    }.on('init'),

    toggle: function() {
        return this.get('isOpen') ? 'open' : '';
    }.property('isOpen'),

    close: function() {
        this.set('isOpen', false);
    },

    mouseDown: function() {
        this.maintainFocus = true;
        Ember.run.next(this, function() {
            delete this.maintainFocus;
        });
    },

    focusOut: function() {
        if (!this.maintainFocus) {
            this.close();
        }
    },

    actions: {
        clicked: function() {
            this.set('isOpen', !this.get('isOpen'));
        },

        close: function() {
            this.close();
        },

        openModal: function(action) {
            this.close();
            this.set('_modalName', 'name');
            this.showComponentModal(action.title, action.modal, action,
                action.okCallback, action.cancelCallback, action.button_class, action.button_text);
        },

        closeModal: function() {
            return this.ModalManager.get('name').destroy();
        }
    }
});
