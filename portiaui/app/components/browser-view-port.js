import Ember from 'ember';
import HoverOverlay from './hover-overlay';
import {ANNOTATION_MODE} from '../services/browser';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    browserOverlays: Ember.inject.service(),
    uiState: Ember.inject.service(),

    classNames: ['browser-view-port'],
    classNameBindings: ['noneHovered', 'noneSelected'],

    iFrame: null,
    overlayComponentName: 'hover-overlay',

    noneHovered: Ember.computed.none('uiState.viewPort.hoveredElement'),
    noneSelected: Ember.computed.none('uiState.models.annotation'),
    overlays: Ember.computed.readOnly('browserOverlays.overlayComponents'),

    didInsertElement() {
        if (this.iFrame) {
            this.get('browser').unRegisterIFrame(this.iFrame);
        }

        const $iFrame = this.$('iframe');
        $iFrame.off('.portia-view-port')
               .on('load.portia-view-port', this.bindEventHandlers.bind(this));

        this.iFrame = $iFrame[0];
        this.get('browser').registerIFrame(this.iFrame);
    },

    willDestroyElement() {
        this.get('browser').unRegisterIFrame(this.iFrame);
        this.iFrame = null;
    },

    mouseEnter() {
        this.get('browserOverlays').addOverlayComponent(this);
    },

    mouseLeave() {
        this.get('browserOverlays').removeOverlayComponent(this);
    },

    bindEventHandlers() {
        const viewPortDocument = this.iFrame.contentDocument;
        Ember.$(viewPortDocument).off('.portia-view-port')
            .on('click.portia-view-port', () => {
                Ember.run.schedule('sync', this, this.viewPortClick);
                return false;
            });
    },

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
});
