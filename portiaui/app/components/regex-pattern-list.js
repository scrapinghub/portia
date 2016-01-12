import Ember from 'ember';

export default Ember.Component.extend({
    //tagName: '',
    classNames: ['regex-pattern-list'],

    list: [],
    newPattern: '',
    newPatternCorrect: Ember.computed('newPattern', function() {
        const pattern = this.get('newPattern');
        try {
            new RegExp(pattern);
        } catch (e) {
            return false;
        }
        return true;
    }),

    change() {
        if (this.attrs.change) {
            this.attrs.change();
        }
    },

    actions: {
        addPattern(pattern) {
            if (this.get('newPatternCorrect')) {
                this.set('newPattern', '');
                this.get('list').addObject(pattern);
                this.change();
            }
        },

        clearPattern() {
            this.set('newPattern', '');
        },

        changePattern(index, value) {
            // TODO: change is a bad name for the event as it seems to catch the propagating event from the inner input
            if (!(value instanceof Ember.$.Event)) {
                const list = this.get('list');
                const current = list.objectAt(index);
                if (value !== current) {
                    list.removeObject(value);
                    list.replace(list.indexOf(current), 1, [value]);
                    this.change();
                }
            }
        },

        removePattern(index) {
            this.get('list').removeAt(index);
            this.change();
        }
    }
});
