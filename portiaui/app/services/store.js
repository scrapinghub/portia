import DS from 'ember-data';

export default DS.Store.extend({
    didSaveRecord(internalModel, dataArg) {
        // update record id if data has different id
        // TODO: support rollback of id change
        const recordMap = this.typeMapFor(internalModel.type).idToRecord;
        if (internalModel.id !== null && !(internalModel.id in recordMap)) {
            for (let id of Object.keys(recordMap)) {
                if (recordMap[id] === internalModel) {
                    delete recordMap[id];
                    recordMap[internalModel.id] = internalModel;
                }
            }
        }

        if (dataArg && dataArg.data && dataArg.data.links) {
            this.updateRecordLinks(internalModel, dataArg.data.links);
        }

        return this._super(...arguments);
    },

    _load(data) {
        const internalModel = this._super(...arguments);
        this.updateRecordLinks(internalModel, data.links);
        return internalModel;
    },

    updateRecordLinks(internalModel, links) {
        internalModel._links = links || internalModel._links || {};
    }
});
