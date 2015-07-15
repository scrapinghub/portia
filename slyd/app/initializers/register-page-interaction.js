import Ember from 'ember';

export function initialize(container, application) {
    container.register('document:obj',
                       Ember.Object.create({ view: null,
                                             store: null,
                                             iframe: null }),
                       { instantiate: false });
    application.inject('controller', 'document', 'document:obj');
    application.inject('component:web-document', 'document', 'document:obj');
    application.inject('component:web-document-js', 'document', 'document:obj');
    application.inject('component:tool-box', 'document', 'document:obj');
    application.inject('component:annotation-widget', 'document', 'document:obj');
    application.inject('model', 'document', 'document:obj');
}

export default {
  name: 'register-page-interaction',
  initialize: initialize
};
