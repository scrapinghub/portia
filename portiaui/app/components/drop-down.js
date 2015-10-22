import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['dropdown'],
    classNameBindings: ['open'],

    $dropdown: null,
    focusedElement: null,
    open: false,
    timerId: null,

    alignRight: Ember.computed.equal('dropdownAlign', 'right'),

    didInsertElement() {
        const $dropdown = this.$dropdown = this.$('.dropdown-menu');

        Ember.run.schedule('render', () => {
            Ember.$('body').append($dropdown);
            $dropdown.on({
                focusout: (e) => {
                    this.focusedElement = null;

                    Ember.run.next(() => {
                        if (!this.isDestroyed && !this.focusedElement && this.attrs.focusOut) {
                            this.attrs.focusOut();
                        }
                    });
                },
                focusin: (e) => {
                    this.focusedElement = e.target;
                },
                keyup: (event) => {
                    if (event.keyCode === 27) {  // ESCAPE
                        Ember.run.next(() => {
                            if (this.attrs.keyUp) {
                                this.attrs.keyUp();
                            }
                        });
                    }
                }
            });
        });

        Ember.run.schedule('afterRender', () => {
            this.updatePosition();
            this.onOpen();
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

    onOpen: Ember.observer('open', function() {
        if (this.get('open')) {
            Ember.run.schedule('afterRender', () => {
                if (!this.focusedElement) {
                    this.$dropdown.focus();
                }
            });
        }
    }),

    updatePosition() {
        const $dropdown = this.$dropdown;
        const rect = this.element.getBoundingClientRect();
        //const top = Math.round(rect.top);
        const bottom = Math.round(rect.bottom);
        const left = Math.round(rect.left);
        const right = Math.round(rect.right);
        let positionLeft;
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
