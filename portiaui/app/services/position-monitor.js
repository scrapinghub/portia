import Ember from 'ember';

export default Ember.Service.extend({
    elements: [],
    timerId: null,

    registerElement(element, context, readCallback, writeCallback, forceUpdate = false) {
        const options = {
            element,
            context,
            readCallback,
            writeCallback,
            rect: null
        };
        this.elements.push(options);
        if (this.timerId === null) {
            this.update();
        } else if (forceUpdate) {
            this.update([options]);
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

    update(elements) {
        elements = Array.isArray(elements) ? elements : this.elements;
        const updates = [];
        // for performance first do DOM reads ...
        elements.forEach(options => {
            const {element, rect} = options;
            const newRect = element.getBoundingClientRect();
            if (!rect ||
                newRect.top !== rect.top || newRect.bottom !== rect.bottom ||
                newRect.left !== rect.left || newRect.right !== rect.right) {
                options.rect = newRect;
                updates.push(options);
            }
        });
        // ... then run callbacks which will perform additional DOM reads ...
        updates.forEach(({element, context, readCallback, rect}) => {
            if (readCallback) {
                readCallback.call(context, rect, element);
            }
        });
        // ... then run callbacks which will perform DOM writes
        updates.forEach(({element, context, writeCallback, rect}) => {
            writeCallback.call(context, rect, element);
        });
        this.timerId = requestAnimationFrame(this.update.bind(this));
    }
});
