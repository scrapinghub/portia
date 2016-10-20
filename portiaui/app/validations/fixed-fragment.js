import { validatePresence } from 'ember-changeset-validations/validators';
import validateWhitespace from '../validators/whitespace';

export default {
  value: [
    validatePresence({ presence: true, message: 'Should not be empty.'}),
    validateWhitespace()
  ]
};
