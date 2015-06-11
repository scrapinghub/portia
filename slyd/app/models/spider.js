import Ember from 'ember';
import SimpleModel from './simple-model';

export default SimpleModel.extend({
    serializedProperties: ['start_urls',
        'start_urls', 'links_to_follow', 'follow_patterns',
        'js_enabled', 'js_enable_patterns', 'js_disable_patterns',
        'exclude_patterns', 'respect_nofollow',
        'init_requests', 'template_names'],
    serializedRelations: ['templates'],
    start_urls: null,
    links_to_follow: 'patterns',
    follow_patterns: null,
    exclude_patterns: null,
    respect_nofollow: true,
    templates: null,
    template_names: null,
    init_requests: null,

    init: function() {
        if (this.get('init_requests') === null) {
            this.set('init_requests', []);
        }

        this.get('serializedProperties').forEach(function(prop) {
            this.addObserver(prop + '.[]', function() {
                this.notifyPropertyChange('dirty');
            }.bind(this));
        }.bind(this));
    },

    performLogin: function(key, performLogin) {
        if (arguments.length > 1) {
            if (performLogin) {
                this.get('init_requests').setObjects([{ type: 'login' }]);
            } else {
                this.set('loginUrl', '');
                this.set('loginUser', '');
                this.set('loginPassword', '');
                this.get('init_requests').setObjects([]);
            }
        }
        return !Ember.isEmpty(this.get('init_requests'));
    }.property('init_requests'),

    loginUrl: function(key, loginUrl) {
        var reqs = this.get('init_requests');
        if (arguments.length > 1) {
            reqs[0]['loginurl'] = loginUrl;
        }
        return reqs.length ? reqs[0]['loginurl'] : null;
    }.property('init_requests'),

    loginUser: function(key, loginUser) {
        var reqs = this.get('init_requests');
        if (arguments.length > 1) {
            reqs[0]['username'] = loginUser;
        }
        return reqs.length ? reqs[0]['username'] : null;
    }.property('init_requests'),

    loginPassword: function(key, loginPassword) {
        var reqs = this.get('init_requests');
        if (arguments.length > 1) {
            reqs[0]['password'] = loginPassword;
        }
        return reqs.length ? reqs[0]['password'] : null;
    }.property('init_requests'),
});
