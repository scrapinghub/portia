import Ember from 'ember';
import ajax from 'ic-ajax';
import config from '../config/environment';
import SlydApi from '../utils/slyd-api';
import utils from '../utils/utils';


export function initialize(container, application) {
    application.deferReadiness();
    var hash = {};
    hash.type = 'GET';
    hash.url = (config.SLYD_URL || window.location.protocol + '//' +
        window.location.host) + '/server_capabilities';
    ajax(hash).then(function(settings) {
        this.set('serverCapabilities', settings['capabilities']);
        this.set('serverCustomization', settings['custom']);
        container.register('api:capabilities',
                               Ember.Object.create().setProperties(application.get('serverCapabilities')),
                               { instantiate: false });
        container.register('app:custom',
                               Ember.Object.create().setProperties(application.get('serverCustomization')),
                               { instantiate: false });
        var api = new SlydApi();
        api.set('username', settings.username);
        api.set('sessionid', utils.shortGuid());
        api.set('serverCapabilities', container.lookup('api:capabilities'));
        container.register('api:slyd', api, { instantiate: false });
        application.inject('route', 'slyd', 'api:slyd');
        application.inject('adapter', 'slyd', 'api:slyd');
        application.inject('controller', 'slyd', 'api:slyd');
        application.inject('component', 'slyd', 'api:slyd');
        application.inject('controller', 'customizations', 'app:custom');
        application.inject('component', 'customizations', 'app:custom');
        application.inject('controller', 'capabilities', 'api:capabilities');
        application.inject('route', 'capabilities', 'api:capabilities');
        this.advanceReadiness();
    }.bind(application));
}

export default {
  name: 'register-api',
  initialize: initialize
};
