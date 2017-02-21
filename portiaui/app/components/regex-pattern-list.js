import Ember from 'ember';

export default Ember.Component.extend({
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

    triggerChange() {
        if (this.attrs.onChange) {
            this.attrs.onChange();
        }
    },

    actions: {
        addPattern(pattern) {
            if (this.get('newPattern') && this.get('newPatternCorrect')) {
                this.set('newPattern', '');
                this.get('list').addObject(pattern);
                this.triggerChange();
            }
        },

        clearPattern() {
            this.set('newPattern', '');
        },

        changePattern(index, value) {
            const list = this.get('list');
            const current = list.objectAt(index);
            if (value !== current) {
                list.removeObject(value);
                list.replace(list.indexOf(current), 1, [value]);
                this.triggerChange();
            }
        },

        removePattern(index) {
            this.get('list').removeAt(index);
            this.triggerChange();
        },

        stopPropagation($event) {
            $event.stopPropagation();
        }
    }
});
