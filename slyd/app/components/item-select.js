import Ember from 'ember';

export default Ember.Component.extend({
    value: null,
    name: null,
    attributeBindings: ['value', 'style'],
    tagName: 'select',
    classNames: ['selectbox'],

    options: [],
    style: function() {
        var width = this.get('width');
        if (width) {
            return 'width:' + width + ';';
        }
        return '';
    }.property('width'),


    buildOptions: function() {
        var selectedValue = this.get('value'),
            defaultValue = [];
        if (!selectedValue) {
            defaultValue = [{value:'', label: '', selected: true}];
        } else {
            this.sendAction('changed', selectedValue, this.get('name'));
        }
        var seenSelected = false,
            arr = defaultValue.concat(this.get('options').map(function(opt) {
                if (typeof(opt) === 'string') {
                    opt = {value: opt};
                } else if (opt instanceof Ember.Object) {
                    opt = {value: opt.get('name')};
                }
                if (opt.value === selectedValue) {
                    seenSelected = true;
                }
                return {
                    value: opt.value,
                    label: opt.label || opt.value,
                    selected: opt.value === selectedValue
                };
            }));
        if (!seenSelected && selectedValue && this.get('addSelected')) {
            arr.push({
                value: selectedValue,
                label: selectedValue,
                selected: true
            });
        }
        return arr;
    },

    optionsList: function() {
        return this.buildOptions();
    }.property('value', 'options'),

    change: function(e) {
        if (e.type !== 'change') {
            return;
        }
        var originalEvent = e.originalEvent,
            target = originalEvent.explicitOriginalTarget || originalEvent.target,
            changedTo = target.value;
        this.set('value', changedTo);
        this.sendAction('changed', changedTo, this.get('name'));
    },
});
