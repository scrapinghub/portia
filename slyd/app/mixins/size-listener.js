import Ember from 'ember';

export default Ember.Mixin.create({
    full_box_height: 600,
    mid_box_height: 500,
    small_box_height: 400,
    tiny_box_height: 300,
    ex_tiny_box_height: 200,
    breadCrumb: null,
    breadCrumbs: null,

    handleResize: function() {
        Ember.$('.adjust-height').height(window.innerHeight - 38);
        this.set('full_box_height', Math.max(80, window.innerHeight - 200));
        this.set('mid_box_height', Math.max(80, window.innerHeight - 300));
        this.set('small_box_height', Math.max(80, window.innerHeight - 400));
        this.set('tiny_box_height', Math.max(80, window.innerHeight - 500));
        this.set('ex_tiny_box_height', Math.max(60, window.innerHeight - 600));
    },

    full_box_style: function() {
        return ('max-height: ' + this.full_box_height + 'px;').htmlSafe();
    }.property('full_box_height'),

    mid_box_style: function() {
        return ('max-height: ' + this.mid_box_height + 'px;').htmlSafe();
    }.property('mid_box_height'),


    small_box_style: function() {
        return ('max-height: ' + this.small_box_height + 'px;').htmlSafe();
    }.property('small_box_height'),


    tiny_box_style: function() {
        return ('max-height: ' + this.tiny_box_height + 'px;').htmlSafe();
    }.property('tiny_box_height'),

    ex_tiny_box_style: function() {
        return ('max-height: ' + this.ex_tiny_box_height + 'px;').htmlSafe();
    }.property('ex_tiny_box_height'),

    bindResizeEvent: function() {
        Ember.run.next(this, this.handleResize);
        if (!Ember.testing){
            Ember.$(window).on('resize', Ember.run.bind(this, this.handleResize));
        }
    }.on('init'),

    openAccordion: function(accordionNumber) {
        Ember.$( ".accordion" ).accordion("option", "active", accordionNumber);
    },
});
