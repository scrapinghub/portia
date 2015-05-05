import Ember from 'ember';

var NotificationManager = Ember.Object.create({
    content: Ember.A(),

    add: function(options) {
        /*
            properties:
                title (optional),
                message,
                type (optional): info (default), warning, success, danger
        */
        var notification = Ember.Object.create(options);
        return this.get('content').pushObject(notification);
    }
});

export default NotificationManager;
