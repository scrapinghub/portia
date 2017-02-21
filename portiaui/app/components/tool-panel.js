import Ember from 'ember';
import {computedPropertiesEqual} from '../utils/computed';

export default Ember.Component.extend({
    classNames: ['tool-panel'],
    classNameBindings: ['active::hide'],

    active: computedPropertiesEqual('toolId', 'group.selected')
});
