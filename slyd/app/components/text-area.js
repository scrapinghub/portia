import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'textarea',
    attributeBindings: ['placeholder', 'style', 'name', 'value'],
    classNames: 'textarea',
    width: null,
    placeholder: null,
    resize: false,
    max_height: null,
    name: null,
    splitlines: false,
    clear: null,
    value: null,
    submitOnEnter: true,

    style: function() {
        var attrs = [],
            width = this.get('width'),
            resize = this.get('resize'),
            max_height = this.get('max_height');
        if (width) {
            attrs.push('width:' + width);
        }
        if (resize) {
            attrs.push('resize:' + resize);
        }
        if (max_height) {
            attrs.push('max-height:' + max_height);
        }
        if (attrs.length === 0) {
            return;
        }
        attrs.push('');
        return attrs.join(';');
    }.property('width', 'resize', 'max_height'),

    keyUp: function(e) {
        if (e.which === 13 && this.getWithDefault('submitOnEnter', true)) {
            var text = this.get('element').value,
                split = [];
            if (this.get('splitlines')) {
                text = text.split(/\r?\n/);
                for (var i=0; i < text.length; i++) {
                    if (text[i].length > 0) {
                        split.push(text[i]);
                    }
                }
                this.sendAction('action', split, this.get('name'));
            } else {
                this.sendAction('action', text, this.get('name'));
            }
        }
        this.change();
    },

    change: function() {
        this.sendAction('update', this.get('element').value, this.get('name'));
    },

    paste: function() {
        this.change();
    }
});
