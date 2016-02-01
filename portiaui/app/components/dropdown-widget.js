import Ember from 'ember';

export default Ember.Component.extend({
    positionMonitor: Ember.inject.service(),

    classNames: ['dropdown'],
    classNameBindings: ['open'],

    active: null,
    events: null,
    focused: null,
    focusMenu: false,
    keyNavigate: 'active',
    menuAlign: 'left',
    menuClass: null,
    menuContainer: null,
    open: false,

    alignRight: Ember.computed.equal('menuAlign', 'right'),
    menuClasses: Ember.computed('menuClass', 'menuContainer', 'open', 'alignRight', function() {
        const classes = [this.get('menuClass')];
        if (this.get('menuContainer')) {
            classes.push('dropdown-menu-floating');
            if (this.get('open')) {
                classes.push('open');
            }
        }
        if (this.get('alignRight')) {
            classes.push('pull-right');
        }
        return classes.join(' ');
    }),

    init() {
        this._super();
        if (!this.get('events')) {
            this.set('events', this);
        }
        this.$menu = null;
        this.elementFocused = false;
        this.menuWidth = null;
        this.menuHeight = null;
        this.windowHeight = null;
    },

    didInsertElement() {
        const container = this.get('menuContainer');
        if (container) {
            const $menu = this.$menu = this.$('.dropdown-menu');
            Ember.run.schedule('afterRender', () => {
                Ember.$(container).append($menu);
                this.get('positionMonitor').registerElement(
                    this.element, this, this.updateMenuSize, this.updatePosition,
                    /*forceUpdate = */true);
            });
        }
    },

    willDestroyElement() {
        const $menu = this.$menu;
        if ($menu) {
            const element = this.element;
            Ember.run.schedule('render', () => {
                this.get('positionMonitor').unRegisterElement(
                    element, this, this.updateMenuSize, this.updatePosition);
                $menu.remove();
            });
        }
    },

    focusIn() {
        this.send('focusIn', ...arguments);
    },

    focusOut() {
        this.send('focusOut', ...arguments);
    },

    keyDown() {
        this.send('keyDown', ...arguments);
    },

    updateMenuSize() {
        const $menu = this.$menu;
        this.menuWidth = $menu.outerWidth();
        this.menuHeight = $menu.outerHeight(true);
        this.windowHeight = window.innerHeight;
    },

    updatePosition(rect) {
        let positionLeft;
        let positionTop;
        if (this.get('alignRight')) {
            positionLeft = Math.round(rect.right - this.menuWidth);
        } else {
            positionLeft = Math.round(rect.left);
        }
        if (rect.bottom + this.menuHeight > this.windowHeight) {
            // If it overflows under the screen, align top
            positionTop = Math.round(rect.top - this.menuHeight);
        } else {
            positionTop = Math.round(rect.bottom);
        }
        this.$menu.css({
            top: `${positionTop}px`,
            left: `${positionLeft}px`,
            right: `auto`
        });
    },

    actions: {
        openMenu() {
            this.set('open', true);
        },

        closeMenu(closeReason) {
            if (this.attrs.onClose) {
                this.attrs.onClose(closeReason || 'close');
            }
            this.set('open', false);
        },

        toggleMenu(closeReason) {
            if (this.get('open')) {
                this.send('closeMenu', closeReason || 'toggle');
            } else {
                this.send('openMenu');
            }
        },

        focusIn() {
            this.elementFocused = true;
        },

        focusOut() {
            this.elementFocused = null;

            Ember.run.next(() => {
                if (!this.isDestroyed && !this.elementFocused) {
                    this.send('closeMenu', 'focus-out');
                }
            });
        },

        keyDown(event) {
            if (this.get('open')){
                if (event.keyCode === 27) {  // ESCAPE
                    this.send('closeMenu', 'escape');
                }
                this.get('events').trigger('menuKeyDown', ...arguments);
            }
        }
    }
});
