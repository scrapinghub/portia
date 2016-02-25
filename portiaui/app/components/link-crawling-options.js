import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    spider: null,

    actions: {
        save() {
            this.get('spider').save();
        },
        saveIgnoredUrl(oldUrl, url) {
            const spider = this.get('spider');
            const urls = spider.get('nofollowExamples');
            if (oldUrl !== url) {
                if (!url) { // removed
                    urls.removeObject(oldUrl);
                } else if (!oldUrl) { // added
                    urls.addObject(url);
                } else { // Changed
                    urls.removeObject(oldUrl);
                    urls.addObject(url);
                }
                spider.save();
            }
        }
    }
});
