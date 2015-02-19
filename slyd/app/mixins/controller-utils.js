import Ember from 'ember';

export default Ember.Mixin.create({
    serverCapability: function(capability) {
        return this.serverCapabilities.get(capability);
    },

    openAccordion: function(accordionNumber) {
        Ember.$( ".accordion" ).accordion("option", "active", accordionNumber);
    },

    getUnusedName: function(baseName, usedNames) {
        var i = 1;
        var newName = baseName;
        var name_cmp = function(usedName) {
            return usedName === newName;
        };
        while(usedNames.any(name_cmp)) {
            newName = baseName + '_' + i++;
        }
        return newName;
    },

});
