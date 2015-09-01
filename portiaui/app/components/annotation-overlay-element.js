import Ember from 'ember';


function computedPropertiesEqual(a, b) {
    return Ember.computed(a, b, function() {
        return this.get(a) === this.get(b);
    });
}


export default Ember.Component.extend({
    browserOverlays: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    viewPortSelection: Ember.inject.service(),

    classNames: ['overlay', 'annotation-overlay'],
    classNameBindings: ['hovered', 'selected'],

    hovered: computedPropertiesEqual('viewPortElement', 'viewPortSelection.hoveredElement'),
    selected: computedPropertiesEqual('viewPortElement', 'viewPortSelection.selectedElement'),

    click() {
        this.set('viewPortSelection.selectedElement', this.get('viewPortElement'));
        if (!this.get('parent.groupSelected')) {
            const routing = this.get('routing');
            const models = [this.get('parent.overlay.id')];
            routing.transitionTo('projects.project.spider.sample.annotation', models, {}, true);
        }
    },

    willInsertElement() {
        this.get('browserOverlays').addElementOverlay(this);
    },

    willDestroyElement() {
        this.get('browserOverlays').removeElementOverlay(this);
    }
});
