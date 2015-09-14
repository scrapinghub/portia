import Ember from 'ember';


const AnnotationOverlay = Ember.ObjectProxy.extend({
    overlayComponentName: 'annotation-overlay',
    content: Ember.computed.readOnly('annotationItem.item')
});

const ItemProxy = Ember.ObjectProxy.extend({
    content: Ember.computed.readOnly('annotationItem.item')
});

export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    dataStructure: Ember.inject.service(),

    tagName: '',

    color: Ember.computed('item.orderedIndex', 'colors.length', function() {
        const colors = this.get('colors');
        return colors[this.get('item.orderedIndex')];
    }),

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
        this.get('browserOverlays').addOverlayComponent(this.overlay);
        this.get('dataStructure').addAnnotation(this.overlay);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeOverlayComponent(this.overlay);
        this.get('dataStructure').removeAnnotation(this.overlay);
    }
});
