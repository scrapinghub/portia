import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['dropdown'],
    classNameBindings: ['open'],

    $dropdown: null,
    open: false,
    timerId: null,

    alignRight: Ember.computed.equal('dropdownAlign', 'right'),

    didInsertElement() {
        const $dropdown = this.$dropdown = this.$('.dropdown-menu');

        Ember.run.schedule('afterRender', () => {
            $dropdown.css({
                display: 'block',
                top: '0px'
            });
            Ember.$('body').append($dropdown);
            this.updatePosition();
        });
    },

    willDestroyElement() {
        const $dropdown = this.$dropdown;

        cancelAnimationFrame(this.timerId);
        this.timerId = null;

        Ember.run.schedule('afterRender', () => {
            $dropdown.remove();
        });
    },

    updatePosition() {
        const $dropdown = this.$dropdown;
        const rect = this.element.getBoundingClientRect();
        //const top = Math.round(rect.top);
        const bottom = Math.round(rect.bottom);
        const left = Math.round(rect.left);
        const right = Math.round(rect.right);
        let positionLeft;
        //console.log(this.get('dropdownAlign'), this.get('alignRight'));
        if (this.get('alignRight')) {
            positionLeft = right - $dropdown.outerWidth();
        } else {
            positionLeft = left;
        }
        $dropdown.css({
            top: `${bottom}px`,
            left: `${positionLeft}px`,
            right: `auto`
        });
        this.timerId = requestAnimationFrame(this.updatePosition.bind(this));
    }
});
