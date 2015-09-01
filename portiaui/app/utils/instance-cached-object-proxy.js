import Ember from 'ember';


const InstanceCachedObjectProxy = Ember.ObjectProxy.extend({});
InstanceCachedObjectProxy.reopenClass({
    instances: new WeakMap(),

    create(options) {
        var instance = this.instances.get(options.content);
        if (instance) {
            instance.setProperties(options);
        } else {
            instance = this._super(options);
            this.instances.set(options.content, instance);
        }
        return instance;
    }
});

export default InstanceCachedObjectProxy;
