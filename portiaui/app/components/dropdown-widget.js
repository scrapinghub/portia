import Ember from 'ember';

export default Ember.Component.extend({
    positionMonitor: Ember.inject.service(),

    classNames: ['dropdown'],
    classNameBindings: ['open'],

    active: null,
    activeQuery: null,
    focused: null,
    focusedQuery: null,
    focusMenu: false,
    keyNavigate: 'active',
    matchQuery: null,
    menu: null,
    menuAlign: 'left',
    menuClass: null,
    menuContainer: null,
    open: false,

    alignRight: Ember.computed.equal('menuAlign', 'right'),

    init() {
        this._super();
        this.set('$menu', null);
        this.elementFocused = false;
        this.menuWidth = null;
    },

    didInsertElement() {
        const container = this.get('menuContainer');
        if (container) {
            const menu = this.get('menu');
            const $menu = menu && menu.$();

            Ember.run.schedule('afterRender', () => {
                this.set('$menu', $menu);
                Ember.$(container).append($menu);
                this.get('positionMonitor').registerElement(
                    this.element, this, this.updateMenuSize, this.updatePosition,
                    /*forceUpdate = */true);
            });
        }
    },

    willDestroyElement() {
        const $menu = this.get('$menu');
        if ($menu) {
            this.get('positionMonitor').unRegisterElement(
                this.element, this, this.updateMenuSize, this.updatePosition);
            Ember.run.schedule('afterRender', () => {
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
        const $menu = this.get('$menu');
        this.menuWidth = $menu.outerWidth();
        this.menuHeight = $menu.outerHeight();
    },

    updatePosition(rect) {
        const $menu = this.get('$menu');
        const left = Math.round(rect.left);
        const right = Math.round(rect.right);
        let positionLeft;
        if (this.get('alignRight')) {
            positionLeft = right - this.menuWidth;
        } else {
            positionLeft = left;
        }
        let overflows = (rect.bottom + this.menuHeight) > window.innerHeight;
        // If it overflows under the screen, align top
        let top =  overflows ? rect.top - this.menuHeight : rect.bottom;
        $menu.css({
            top: `${Math.round(top)}px`,
            left: `${positionLeft}px`,
            right: `auto`,
        });
    },

    actions: {
        openMenu() {
            this.set('open', true);
        },

        closeMenu(closeReason) {
            if (this.attrs['on-close']) {
                this.attrs['on-close'](closeReason || 'close');
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
                this.get('menu').send('keyDown', event);
            }
        }
    }
});
