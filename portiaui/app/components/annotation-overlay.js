import Ember from 'ember';
import {computedPropertiesEqual} from '../utils/computed';


export default Ember.Component.extend({
    classNameBindings: ['groupHovered', 'groupSelected'],

    color: Ember.computed.readOnly('overlay.color'),
    elements: Ember.computed.readOnly('overlay.elements'),
    groupHovered: computedPropertiesEqual('overlay', 'hoveredOverlay'),
    groupSelected: computedPropertiesEqual('overlay', 'selectedOverlay')
});
