import Ember from 'ember';
import { flatten } from '../utils/utils';
import { augmentFragmentList, fragmentToString } from '../utils/start-urls';

export default function startUrl(spec) {
    function buildUrlObject() {
        if (spec.type === 'generated') {
            return generatedURL();
        }
        return { url: spec.url, type: 'url' };
    }

    function generatedURL() {
        let fragments = spec.fragments || [{type: 'fixed', value: spec.url}];
        return {
            url: spec.url,
            type: 'generated',
            fragments: fragments
        };
    }

    function generateList() {
        // This algorithm is very inefficient due to concatenation and flattening.
        const fragments = Ember.copy(urlObject.fragments);
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

    function save(spider) {
        const urls = spider.get('startUrls');
        urls.pushObject(urlObject);
        spider.save();
        return urlObject;
    }

    function toString() {
        if (urlObject.isGenerated) {
            return urlObject.fragments.map(fragmentToString).join('');
        } else {
            return urlObject.url;
        }
    }

    function serialize() {
        let base = {
            'url': urlObject.toString(),
            'type': urlObject.type
        };
        if (urlObject.isGenerated) {
            base.fragments = urlObject.fragments;
        }
        return base;
    }

    let urlObject = buildUrlObject();
    urlObject.isGenerated = urlObject.type === 'generated';

    urlObject.save = save;
    urlObject.getUrl = toString;
    urlObject.toString = toString;
    urlObject.serialize = serialize;
    urlObject.generateList = generateList;

    return urlObject;
}
