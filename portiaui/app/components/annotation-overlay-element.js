import Ember from 'ember';
import {OverlayUpdater} from '../services/browser-overlays';


export default Ember.Component.extend({
    classNames: ['overlay', 'annotation-overlay'],

    willInsertElement() {
        OverlayUpdater.add(this);
    },

    willDestroyElement() {
        OverlayUpdater.remove(this);
    }
});
