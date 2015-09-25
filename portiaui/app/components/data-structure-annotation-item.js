import Ember from 'ember';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    annotation: Ember.computed.readOnly('item.content'),

    actions: {
        removeAnnotation() {
            const annotation = this.get('annotation');
            this.get('dispatcher').removeAnnotation(annotation);
        },

        saveAnnotation() {
            const annotation = this.get('annotation');
            annotation.save();
        }
    }
});
