import Ember from 'ember';

export default Ember.Component.extend({
    init: function() {
        var username = this.get('slyd.username'),
            appId = this.get('data.app_id');
        if (!username || !appId) {
            return;
        }
        window.intercomSettings = {
            app_id: appId,
            user_id: username,
         };
        var w = window;
        var d = document;
        var i = function() {
            i.c(arguments)
        };
        i.q = [];
        i.c = function(args) {
            i.q.push(args)
        };
        w.Intercom = i;
        var s = d.createElement('script');
        s.type = 'text/javascript';
        s.async = true;
        s.src = 'https://widget.intercom.io/widget/' + appId;
        var x = d.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
    }
});
