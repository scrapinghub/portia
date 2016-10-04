import Ember from 'ember';
import { flatten } from '../utils/utils';
import { augmentFragmentList, fragmentToString } from '../utils/start-urls';

const StartUrl = Ember.Object.extend({
    type: 'url',
    isGenerated: false,
    componentName: 'project-structure-spider-url',

    show() {
        return this.get('url');
    },

    serialize() {
        const serialized = {
            'url': this.show(),
            'type': this.get('type')
        };
        return this.addSerialized(serialized);
    },
    addSerialized(serialized) { return serialized; },

    save(spider) {
        spider.get('startUrls').pushObject(this);
        spider.save();
        return this;
    }
});

const GeneratedUrl = StartUrl.extend({
    type: 'generated',
    isGenerated: true,
    componentName: 'project-structure-spider-generated-url',
    optionsComponentName: 'generated-url-options',

    init() {
        const defaultFragments = [
            {
                type: 'fixed',
                value: this.get('url')
            }
        ];
        const fragments = this.get('fragments') || defaultFragments;
        this.set('fragments', fragments);
    },

    show() {
        return this.get('fragments').map(fragmentToString).join('');
    },

    addSerialized(serialized) {
        serialized['fragments'] = this.get('fragments');
        return serialized;
    },

    generateList() {
        // This algorithm is very inefficient due to concatenation and flattening.
        const fragments = Ember.copy(this.get('fragments'));
        let firstFragment = fragments.shiftObject();
        let urlList = [[firstFragment.value]];

        fragments.forEach((fragment) => {
            let augmentedList = urlList.map((fragmentList) => {
                return augmentFragmentList(fragmentList, fragment);
            });
            urlList = flatten(augmentedList);
        });
        return urlList;
    }
});


const FeedUrl = StartUrl.extend({
    type: 'feed',
    componentName: 'project-structure-spider-feed-url',
    optionsComponentName: 'feed-url-options',

    show() {
        return this._raw_url();
    },

    _raw_url() {
        const url = this.get('url');
        const notRaw = !url.includes('raw');

        if (url.includes('gist.github') && notRaw) {
            const trailingSlash = (url.slice(-1) === '/') ? '' : '/';
            return url + trailingSlash + 'raw';
        }

        if (url.includes('dropbox.com') && notRaw) {
            return url + '&raw=1';
        }

        if (url.includes('google.com') && !url.includes('export')) {
            return url.split('/')
                      .slice(0, -1)
                      .concat('export?format=txt')
                      .join('/');
        }

        return url;
    }
});

export default function buildStartUrl(startUrl) {
    const urls = {
        'url': StartUrl,
        'feed': FeedUrl,
        'generated': GeneratedUrl
    };
    const urlType = startUrl.type || 'url';
    return urls[urlType].create(startUrl);
}
