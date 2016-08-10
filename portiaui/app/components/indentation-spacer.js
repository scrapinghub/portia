import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['indentation-spacer'],
  classNameBindings: ['isSmall'],
  isSmall: false
});
