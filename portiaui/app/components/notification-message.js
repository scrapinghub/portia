import Ember from 'ember';
import { attrChangedTo } from '../utils/attrs';

export default Ember.Component.extend({
    classNames: ['alert', 'notification', 'fade'],
    classNameBindings: ['alertType', 'show:in'],

    notification: null,
    closeAction: null,
    dismissable: false,
    show: false,
    showTime: 4000,  // 4s

    message: Ember.computed.readOnly('notification.message'),
    title: Ember.computed.readOnly('notification.title'),
    type: Ember.computed.readOnly('notification.type'),

    alertType: Ember.computed('type', function() {
        const type = this.getWithDefault('type', 'info');
        return `alert-${type}`;
    }),

    init() {
        this._super();
        this.set('show', false);
    },

    didReceiveAttrs({newAttrs, oldAttrs}) {
        if (attrChangedTo(oldAttrs, newAttrs, 'fade', true)) {
            this.fadeOut();
        }
    },

    didInsertElement() {
        Ember.run.next(this, 'fadeIn');
        if (this.attrs.closeAction) {
            Ember.run.later(() => {
                this.attrs.closeAction();
            }, this.showTime);
        }
    },

    fadeIn() {
        if (!this.isDestroying) {
            this.set('show', true);
        }
    },

    fadeOut() {
        this.set('show', false);
    },

    transitionEnd() {
        if (!this.get('show')) {
            if (this.attrs.fadeAction) {
                this.attrs.fadeAction();
            }
        }
    },

    actions: {
        close: function() {
            if (this.attrs.closeAction) {
                this.attrs.closeAction();
            }
        }
    }
});
