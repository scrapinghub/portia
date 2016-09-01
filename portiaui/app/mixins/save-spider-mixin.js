import Ember from 'ember';

export default Ember.Mixin.create({
    webSocket: Ember.inject.service(),

    saveSpider() {
        let savePromise = this.get('spider').save();
        savePromise.then(() =>
            this.get('webSocket').send({
                'spider': this.get('spider.id'),
                'project': this.get('spider.project.id'),
                '_command': 'update_spider'
            })
        );
        return savePromise;
    }
});
