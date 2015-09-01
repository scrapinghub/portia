import Ember from 'ember';


export default Ember.Mixin.create({
    hasActiveChild: Ember.computed(
        'children.@each.active', 'children.@each.hasActiveChild', function() {
            const children = this.get('children');
            return children.isAny('active') || children.isAny('hasActiveChild');
        })
});
