import Ember from 'ember';

export default Ember.Mixin.create({
    s4: function() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    },

    guid: function() {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
            this.s4() + '-' + this.s4() + this.s4() + this.s4();
    },

    shortGuid: function(separator) {
        separator = typeof separator !== 'undefined' ? separator : '-';
        return this.s4() + separator + this.s4() + separator + this.s4();
    },

    toType: function(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    }
});
