import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',
    webSocket: Ember.inject.service(),

    spider: null,

    actions: {
        save() {
            this.get('spider').save().then(() =>
                this.get('webSocket').send({
                    'spider': this.get('spider.id'),
                    'project': this.get('spider.project.id'),
                    '_command': 'update_spider'
                })
            );
        }
    }
});
