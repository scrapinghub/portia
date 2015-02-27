import Ember from 'ember';
import Resolver from 'ember/resolver';
import loadInitializers from 'ember/load-initializers';
import ApplicationUtils from './mixins/application-utils';
import config from './config/environment';

Ember.MODEL_FACTORY_INJECTIONS = true;

var App = Ember.Application.extend(ApplicationUtils, {
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver,
  customEvents: {
    paste: 'paste'
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
