import Ember from 'ember';

export default Ember.Component.extend({
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
        this.positionTimer = null;
    },

    didInsertElement() {
        const container = this.get('menuContainer');
        if (container) {
            const menu = this.get('menu');
            const $menu = menu && menu.$();

            Ember.run.schedule('render', () => {
                Ember.$(container).append($menu);
            });

            Ember.run.schedule('afterRender', () => {
                this.set('$menu', $menu);
                this.updatePosition();
            });
        }
    },

    willDestroyElement() {
        const $menu = this.get('$menu');
        if ($menu) {
            cancelAnimationFrame(this.positionTimer);
            this.positionTimer = null;

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

    updatePosition() {
        const $menu = this.get('$menu');
        const rect = this.element.getBoundingClientRect();
        //const top = Math.round(rect.top);
        const bottom = Math.round(rect.bottom);
        const left = Math.round(rect.left);
        const right = Math.round(rect.right);
        let positionLeft;
        if (this.get('alignRight')) {
            positionLeft = right - $menu.outerWidth();
        } else {
            positionLeft = left;
        }
        $menu.css({
            top: `${bottom}px`,
            left: `${positionLeft}px`,
            right: `auto`
        });
        this.positionTimer = requestAnimationFrame(this.updatePosition.bind(this));
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
