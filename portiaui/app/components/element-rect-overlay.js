import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['overlay'],

    index: null,
    positionMode: 'size',

    backgroundStyle: Ember.computed('color.main', function() {
        const color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `background-color: ${color};` : '');
    }),
    shadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `box-shadow: 0 1px 3px -2px ${color};` : '');
    }),
    textShadowStyle: Ember.computed('color.shadow', function() {
        const color = this.get('color.shadow');
        return Ember.String.htmlSafe(color ? `text-shadow: 0 1px 1px ${color};` : '');
    }),

    didInsertElement() {
        this.new = true;
        this.get('overlay').on('element-moved', this, this.updatePosition);
    },

    willDestroyElement() {
        this.get('overlay').off('element-moved', this, this.updatePosition);
    },

    updatePosition(rects) {
        if (!this.element) {
            return;
        }

        let index = this.get('index');
        const rect = rects[index];
        if (!rect) {
            return;
        }

        let { left, top, width, height } = rect;
        let hide = false;
        if (this.new || (!left && !top && !width && !height)) {
            hide = true;

            for (;index--;) {
                const lRect = rects[index];
                const { left: lLeft, right: lRight, top: lTop, bottom: lBottom } = lRect;
                if (lLeft || lRight || lTop || lBottom) {
                    left = lLeft;
                    top = lBottom;
                    height = 0;
                    width = 0;
                    break;
                }
            }

            if (this.new) {
                delete this.new;
                Ember.run.next(
                    Ember.run.scheduleOnce, 'afterRender',
                    this, this.updatePosition, rects);
            }
        }

        if (!left && !top && !width && !height) {
            return;
        }

        let style = '';

        switch (this.get('positionMode')) {
            case 'size':
                style = `transform: translate(${left}px, ${top}px);
                         width: ${width}px; height: ${height}px;`;
                break;

            case 'edges':
                // container is positioned in top left, and has zero width and height
                const right = -left + -width;
                const bottom = -top + -height;
                style = `left: ${left}px; right: ${right}px; top: ${top}px; bottom: ${bottom}px;`;
                break;
        }

        if (hide) {
            style = `opacity: 0; ${style}`;
        }
        this.element.setAttribute('style', style);
    }
});
