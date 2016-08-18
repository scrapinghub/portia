const SAMPLE_SIZE = 20;

function augmentFragment(fragment) {
    switch(fragment.type) {
        case('fixed'):
            return [fragment.value];
        case('list'):
            return fragment.value.split(' ');
        case('range'):
            if (!fragment.value.match(/\d+-\d+/)) { return ['']; }

            const result = [];
            let [a, b] = fragment.value.split('-').map(x => parseInt(x));
            let upperLimit = Math.min(b, a + SAMPLE_SIZE);
            for(let i = a; i < upperLimit + 1; i += 1) {
                result.push(i.toString());
            }
            return result;
    }
}

export function fragmentToString(fragment) {
    switch(fragment.type) {
        case('fixed'):
            return fragment.value;
        case('list'):
            return '[...]';
        case('range'):
            return '[' + fragment.value + ']';
    }
}

export function augmentFragmentList(fragmentList, fragment) {
    const result = [];
    const newFragments = augmentFragment(fragment);

    newFragments.forEach((newFragment) => {
        result.push(fragmentList.concat(newFragment));
    });
    return result;
}

export function includesUrl(spider, url) {
    return spider.get('startUrls').mapBy('url').includes(url);
}

export function multiplicityFragment(fragment) {
    switch(fragment.type) {
        case('fixed'):
            return 1;
        case('list'):
            return fragment.value.split(' ').length;
        case('range'):
            if (!fragment.value.match(/\d+-\d+/)) {
                return 1;
            } else {
                let [a, b] = fragment.value.split('-').map(x => parseInt(x));
                return b - a + 1;
            }
    }
}

export default {
    augmentFragmentList,
    fragmentToString,
    includesUrl,
    multiplicityFragment
};
