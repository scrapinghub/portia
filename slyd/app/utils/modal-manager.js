import Ember from 'ember';

export default Ember.Object.extend({
  add: function(name, modalInstance) {
    return this.set(name, modalInstance);
  },

  remove: function(name) {
    return this.set(name, null);
  },

  open: function(name, title, footerButtons, content, controller, fade) {
    if (this.get(name)) {
      return;
    }
    var cl = controller.container.lookup('component-lookup:main'),
        modalComponent = cl.lookupFactory('bs-modal', controller.get('container')).create();
    modalComponent.setProperties({
      name: name,
      title: title,
      manual: true,
      footerButtons: footerButtons,
      targetObject: controller,
      fade: fade,
      body: content,
      templateName: 'components/bs-modal'
    });
    this.add(name, modalComponent);
    return modalComponent.appendTo(Ember.$('body'));
  }
});