import Ember from 'ember';
import {computedPropertiesEqual} from '../utils/computed';


export default Ember.Component.extend({
    classNameBindings: ['groupHovered', 'groupSelected'],

    annotation: Ember.computed.readOnly('overlay.content'),
    color: Ember.computed.readOnly('annotation.color'),
    elements: Ember.computed.readOnly('annotation.elements'),
    groupHovered: computedPropertiesEqual('overlay', 'hoveredOverlay'),
    groupSelected: computedPropertiesEqual('overlay', 'selectedOverlay')
});
