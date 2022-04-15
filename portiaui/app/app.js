import Ember from 'ember';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

let App;

Ember.MODEL_FACTORY_INJECTIONS = true;

// debug internal errors
// https://discuss.emberjs.com/t/ember-debugging-unhelpful-errors-can-es6-source-maps-help/11965/11
Ember.run.backburner.DEBUG = true;

App = Ember.Application.extend({
    modulePrefix: config.modulePrefix,
    podModulePrefix: config.podModulePrefix,
    Resolver,

    customEvents: {
        transitionend: 'transitionEnd'
    }
});

loadInitializers(App, config.modulePrefix);

export default App;
