import Ember from 'ember';
import NotificationManager from '../utils/notification-manager';

var NotificationsView = Ember.CollectionView.extend({
    classNames: ['notifications'],
    content: NotificationManager.content,

    itemViewClass: Ember.View.extend({
        classNames: ['alert', 'notification'],
        classNameBindings: ['alertType'],
        templateName: 'components/bs-notification',
        isVisible: false,
        showTime: 5000,
        fadeInTime: 400,
        fadeOutTime: 400,
        timeoutId: null,

        alertType: function() {
            return 'alert-' + (this.get('content.type') || 'info');
        }.property('content.type'),

        didInsertElement: function() {
            var _this = this;
            return this.$().fadeIn(this.get('fadeInTime'), function() {
                _this.set('timeoutId', setTimeout(function() {
                    _this.fadeOut();
                }, _this.get('showTime')));
            });
        },

        fadeOut: function() {
            var _this = this;
            clearTimeout(this.get('timeoutId'));
            return this.$()
              .stop()
              .animate({ opacity: 0 }, this.get('fadeOutTime'), function() {
                _this.$().slideUp(_this.get('fadeOutTime'), function() {
                    _this.get('parentView.content').removeObject(_this.get('content'));
                });
            });
        },

        click: function() {
            this.fadeOut();
        },

        actions: {
            close: function() {
                return this.fadeOut();
            }
        }
    })
});

export default NotificationsView;
