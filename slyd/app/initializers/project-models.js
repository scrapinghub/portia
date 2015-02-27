import Ember from 'ember';

export function initialize(container, application) {
    var globals = Ember.Object.create({items: null, extractors: null});
    container.register('projects:models', globals, { instantiate: false });
    application.inject('controller', 'project_models', 'projects:models');
}

export default {
  name: 'project-models',
  initialize: initialize
};
