import Ember from 'ember';

export function trim(input, length) {
  if (!input) {
    return '';
  }
  return input.substring(0, length || 45);
}

export default Ember.Handlebars.makeBoundHelper(trim);
