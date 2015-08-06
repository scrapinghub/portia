import Ember from 'ember';

export function initialize(container, application) {
    container.register('toolbox:state', Ember.Object.create({
        fixed: false,
        pinned: !!(window.localStorage && localStorage.portia_toolbox_pinned),
    }), { instantiate: false });
    application.inject('route', 'toolbox', 'toolbox:state');
    application.inject('component:tool-box', 'control', 'toolbox:state');
    application.inject('component:tool-box', 'router', 'router:main');
    application.inject('component:tool-box', 'applicationController', 'controller:application');
}

export default {
  name: 'toolbox',
  initialize: initialize
};
