import Ember from 'ember';

const AnnotationOverlay = Ember.ObjectProxy.extend({
    component: 'annotation-overlay',
    content: Ember.computed.readOnly('annotationItem.item'),
    color: Ember.computed.readOnly('annotationItem.color')
});

const ItemProxy = Ember.ObjectProxy.extend({
    content: Ember.computed.readOnly('annotationItem.item')
});

export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    colorProvider: Ember.inject.service(),

    init() {
        this._super();
        this.itemProxy = ItemProxy.create({
            annotationItem: this
        });
        this.overlay = AnnotationOverlay.create({
            annotationItem: this
        });
    },

    willInsertElement() {
        var color = this.get('colorProvider').register(this.itemProxy);
        this.set('color', color);
        this.get('browserOverlays').addOverlayComponent(this.overlay);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeOverlayComponent(this.overlay);
        this.get('colorProvider').unRegister(this.itemProxy);
        this.set('color', null);
    }
});
