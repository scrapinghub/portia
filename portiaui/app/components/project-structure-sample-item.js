import Ember from 'ember';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    actions: {
        removeSample() {
            const sample = this.get('item.content');
            this.get('dispatcher').removeSample(sample);
        },

        saveSample() {
            const sample = this.get('item.content');
            sample.save();
        }
    }
});
