import Ember from 'ember';
import Popover from '../mixins/popover';

export default Ember.Component.extend(Popover, {
    fullText: '',
    tagName: 'span',
    collapsed: true,
    trimTo: 400,

    collapsible: function() {
        return this.get('fullText') && this.get('fullText').trim().length > this.get('trimTo');
    }.property('fullText', 'trimTo'),

    displayedText: function() {
        var text = this.get('fullText') || '';
        if (!this.get('collapsed')) {
            return text.trim();
        } else {
            return text.trim().substring(0, this.get('trimTo'));
        }
    }.property('collapsed', 'fullText', 'trimTo'),

    click: function() {
        this.set('collapsed', !this.get('collapsed'));
    },
});
