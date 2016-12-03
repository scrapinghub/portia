import Ember from 'ember';
import {attrChanged, attrValue} from '../utils/attrs';

export default Ember.Component.extend({
    overlays: Ember.inject.service(),
    positionMonitor: Ember.inject.service(),

    tagName: '',

    positionMode: 'size',  // or 'edges'

    init() {
        this._super(...arguments);
        this.set('rects', []);
    },

    didInsertElement() {
        Ember.run.scheduleOnce('afterRender', this, this.notifyAddOverlay);
    },

    willDestroyElement() {
        Ember.run.scheduleOnce('afterRender', this, this.notifyRemoveOverlay);
    },

    notifyAddOverlay() {
        this.get('overlays').add();
    },

    notifyRemoveOverlay() {
        this.get('overlays').remove();
    },

    didReceiveAttrs({oldAttrs, newAttrs}) {
        if (attrChanged(oldAttrs, newAttrs, 'viewPortElement')) {
            const oldElement = oldAttrs && attrValue(oldAttrs.viewPortElement);
            const newElement = attrValue(newAttrs.viewPortElement);
            const positionMonitor = this.get('positionMonitor');
            if (oldElement) {
                positionMonitor.unRegisterElement(
                    oldElement, this, this.readContainerSize, this.updatePosition);
            }
            if (newElement) {
                Ember.run.schedule('afterRender', () => {
                    positionMonitor.registerElement(
                        newElement, this, this.readContainerSize, this.updatePosition);
                });
            }
        }
    },

    on(name, ...params) {
        this._super(...arguments);
        Ember.run.scheduleOnce('afterRender', ...params, this.get('rects'));
    },

    readContainerSize(rects, boundingRect, element) {
        const view = element.ownerDocument.defaultView;
        if (view) {
            this.containerSize = {
                width:  view.innerWidth,
                height: view.innerHeight
            };
        }
    },

    updatePosition(rects) {
        const overlayRects = [];
        let prevRect = null;
        let length = this.get('rects').length;

        for (let rect of Array.from(rects)) {
            const left = Math.round(Math.min(this.containerSize.width, Math.max(0, rect.left)));
            const right = Math.round(Math.min(this.containerSize.width, Math.max(0, rect.right)));
            const top = Math.round(Math.min(this.containerSize.height, Math.max(0, rect.top)));
            const bottom = Math.round(Math.min(this.containerSize.height,
                                               Math.max(0, rect.bottom)));
            const width = right - left;
            const height = bottom - top;

            if (prevRect && top === prevRect.top && bottom === prevRect.bottom &&
                    (left === prevRect.right || right === prevRect.left)) {
                // merge neighbouring rects to minimize amount of rendered/animated elements
                prevRect.left = Math.min(left, prevRect.left);
                prevRect.right = Math.max(right, prevRect.right);
                prevRect.width += width;
            } else {
                prevRect = {
                    left,
                    right,
                    top,
                    bottom,
                    width,
                    height
                };
                overlayRects.push(prevRect);
            }
        }

        // never shrink the number of elements, so that they can be animated out and are available
        // if needed again.
        length = Math.max(length, overlayRects.length);
        for (let i = overlayRects.length; i < length; i++) {
            overlayRects.push({});
        }

        Ember.run.next(Ember.run.scheduleOnce, 'sync', () => {
            if (!this.isDestroying) {
                this.set('rects', overlayRects);
            }
        });
        this.trigger('element-moved', overlayRects);
    }
});
