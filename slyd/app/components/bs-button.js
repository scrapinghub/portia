import Ember from 'ember';
import Popover from '../mixins/popover';

export default Ember.Component.extend(Popover, {
  clickedParam: null,
  size: null,
  active: false,

  tagName: 'button',
  classNameBindings: ['class'],
  activeType: null,
  inactiveType: null,

  attributeBindings: ['disabled', 'title', 'width'],
  iconClasses: Ember.computed.alias('icon'),

  class: function() {
    var classes = ['btn', 'btn-' + this.getWithDefault('type', 'default')],
        size = this.get('size');
    if (size) {
      classes.push('btn-' + size);
    }
    return classes.join(' ');
  }.property('type', 'size'),

  typeChanges: function() {
    this.set('type', this.get('activeType'));
  }.observes('activeType'),

  click: function() {
    if (this.get('activeType')) {
      if (!this.get('inactiveType')) {
        this.set('inactiveType', this.get('activeType'));
        this.set('activeType', this.getWithDefault('type', 'default'));
      }
      var tmp = this.get('activeType');
      this.set('activeType', this.get('inactiveType'));
      this.set('inactiveType', tmp);
    }
    return this.sendAction('clicked', this.get('clickedParam'));
  }
});
