import Ember from 'ember';

export function trim(input, length) {
  return input.substring(0, length || 45);
}

export default Ember.Handlebars.makeBoundHelper(trim);
