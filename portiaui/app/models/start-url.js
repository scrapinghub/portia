import Ember from 'ember';
import { flatten } from '../utils/utils';
import { augmentFragmentList, fragmentToString } from '../utils/start-urls';

function generatedURL(spec) {
    return {
        url: spec.url,
        type: 'generated',
        fragments: [{
            type: 'fixed',
            value: spec.url
        }]
    };
}

export default function startUrl(spec) {
    let urlObject = {};
    if (spec.isGenerated) {
        urlObject = generatedURL(spec);
    } else {
        urlObject.url = spec.url;
        urlObject.type = 'url';
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

    urlObject.save = (spider) => {
        const urls = spider.get('startUrls');
        urls.pushObject(urlObject);
        if (!spec.isGenerated) { spider.save(); }
        return urlObject;
    };

    urlObject.toString = () => {
        if (spec.isGenerated) {
            return urlObject.fragments.map(fragmentToString).join('');
        } else {
            return urlObject.url;
        }
    };

    urlObject.isGenerated = !!spec.isGenerated;

    urlObject.generateList = generateList;

    return urlObject;
}
