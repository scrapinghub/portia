import Ember from 'ember';

export default Ember.Service.extend({
    elements: [],
    timerId: null,

    registerElement(element, context, readCallback, writeCallback) {
        const options = {
            element,
            context,
            readCallback,
            writeCallback,
            rects: null,
            boundingRect: null
        };
        this.elements.push(options);
        if (this.timerId === null) {
            this.updateRaf();
        }
    },

    unRegisterElement(element, context, readCallback, writeCallback) {
        const elements = this.elements;
        const match = elements.find(options =>
            options.element === element && options.context === context &&
            options.readCallback === readCallback && options.writeCallback === writeCallback);
        if (match) {
            elements.removeObject(match);
            if (!elements.length) {
                cancelAnimationFrame(this.timerId);
                this.timerId = null;
            }
        }
    },

    updateRaf() {
        if (this.timerId !== null) {
            cancelAnimationFrame(this.timerId);
        }
        this.update();
        this.timerId = requestAnimationFrame(this.updateRaf.bind(this));
    },

    update(elements) {
        elements = Array.isArray(elements) ? elements : this.elements;
        const updates = [];
        // for performance first do DOM reads ...
        elements.forEach(options => {
            const {element, rects} = options;
            const newRects = element.getClientRects();
            let changed = false;
            if (!rects || rects.length !== newRects.length) {
                changed = true;
            } else {
                for (let i = 0; i < rects.length; i++) {
                    const rect = rects[i];
                    const newRect = newRects[i];
                    if (newRect.top !== rect.top || newRect.bottom !== rect.bottom ||
                        newRect.left !== rect.left || newRect.right !== rect.right) {
                        changed = true;
                        break;
                    }
                }
            }
            if (changed) {
                options.rects = newRects;
                options.boundingRect = element.getBoundingClientRect();
                updates.push(options);
            }
        });
        // ... then run callbacks which will perform additional DOM reads ...
        updates.forEach(({element, context, readCallback, rects, boundingRect}) => {
            if (readCallback) {
                readCallback.call(context, rects, boundingRect, element);
            }
        });
        // ... then run callbacks which will perform DOM writes
        updates.forEach(({element, context, writeCallback, rects, boundingRect}) => {
            writeCallback.call(context, rects, boundingRect, element);
        });
    }
});
