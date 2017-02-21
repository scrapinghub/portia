import StorageObject from 'ember-local-storage/local/object';

const Storage = StorageObject.extend({
    init() {
        this._super(...arguments);

        // clear the next click selection mode if magic tool is active
        if (this.get('magicToolActive')) {
            this.set('selectionMode', null);
        }
    }
});

Storage.reopenClass({
    initialState() {
        return {
            magicToolActive: true,
            selectionMode: null
        };
    }
});

export default Storage;
