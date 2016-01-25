import Ember from 'ember';
import SimpleModel from './simple-model';

const ARRAY_PROPERTIES = ["start_urls", "follow_patterns", "exclude_patterns",
    "js_enable_patterns", "js_disable_patterns", "allowed_domains",
    "templates", "template_names", "page_actions"
];

export default SimpleModel.extend({
    serializedProperties: ['start_urls',
        'start_urls', 'links_to_follow', 'follow_patterns',
        'js_enabled', 'js_enable_patterns', 'js_disable_patterns',
        'exclude_patterns', 'respect_nofollow',
        'init_requests', 'template_names', 'page_actions'],
    serializedRelations: ['templates'],
    start_urls: null,
    links_to_follow: 'patterns',
    follow_patterns: null,
    exclude_patterns: null,
    respect_nofollow: true,
    templates: null,
    template_names: null,
    init_requests: null,
    page_actions: null,

    init: function() {
        ARRAY_PROPERTIES.forEach((prop) => {
            if (!this.get(prop)) {
                this.set(prop, Ember.A());
            }
        });

        let markDirty = () => this.notifyPropertyChange('dirty');
        this.serializedProperties.forEach((prop) => {
            this.addObserver(prop + '.[]', markDirty);
        });
    },

    serialize: function(){
        this.page_actions.forEach((pa) => {
            delete pa.target;
            delete pa._edited;
        });
        return this._super();
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
