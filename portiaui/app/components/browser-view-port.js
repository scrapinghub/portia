import Ember from 'ember';
import HoverOverlay from './hover-overlay';
import {ANNOTATION_MODE} from '../services/browser';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNames: ['browser-view-port'],
    classNameBindings: ['noneHovered', 'noneSelected'],

    overlayComponentName: 'hover-overlay',

    noneHovered: Ember.computed.none('uiState.viewPort.hoveredElement'),
    noneSelected: Ember.computed.none('uiState.models.annotation'),
    overlays: Ember.computed.readOnly('browserOverlays.overlayComponents'),

    mouseEnter() {
        this.get('browserOverlays').addOverlayComponent(this);
    },

    mouseLeave() {
        this.get('browserOverlays').removeOverlayComponent(this);
    },

    actions: {
        viewPortClick() {
            if (this.get('browser.mode') !== ANNOTATION_MODE) {
                return;
            }

            const hoverOverlay = this.get('browserOverlays.elementOverlays')
                .find(elementOverlay => elementOverlay instanceof HoverOverlay);
            if (hoverOverlay) {
                hoverOverlay.click();
            }
        }
    }
});
