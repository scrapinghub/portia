const SAMPLE_SIZE = 20;
const ALL_DIGITS = /^\d+-\d+$/;
const ALL_LETTERS = /^[a-zA-Z]+-[a-zA-Z]+$/;

function nextLetter(letter) {
    return String.fromCharCode(letter.charCodeAt(0) + 1);
}

function numberRange(a, b) {
    const numbers = [];
    let upperLimit = Math.min(b, a + SAMPLE_SIZE);

    for(let i = a; i < upperLimit + 1; i += 1) {
        numbers.push(i.toString());
    }
    return numbers;
}

function letterRange(a, b) {
    const letters = [];
    letters.push(a);

    while(!letters.contains(b)) {
        const lastLetter = letters.get('lastObject');
        letters.pushObject(nextLetter(lastLetter));
    }
    return letters;
}

function augmentRange(fragment_value) {
    const endpoints = fragment_value.split('-');

    if (allDigits(fragment_value)) {
      const [a, b] = endpoints.map(x => parseInt(x));
      return numberRange(a, b);
    }

    if (allLetters(fragment_value)) {
      const [a, b] = endpoints;
      return letterRange(a, b);
    }
}

function augmentFragment(fragment) {
    switch(fragment.type) {
        case('fixed'):
            return [fragment.value];
        case('list'):
            return fragment.value.split(' ');
        case('range'):
            const value = fragment.value;

            if (allLetters(value) || allDigits(value)) {
                return augmentRange(value);
            }

            return [''];
    }
}

export function allLetters(value) {
    return value.match(ALL_LETTERS);
}

export function allDigits(value) {
    return value.match(ALL_DIGITS);
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
            const value = fragment.value;
            const [a, b] = value.split('-');

            if (allLetters(value)) {
                return letterRange(a, b).length;
            }
            if (allDigits(value)) {
                return numberRange(a, b).length;
            }
            return 1;
    }
}

export default {
    allDigits,
    allLetters,
    augmentFragmentList,
    fragmentToString,
    includesUrl,
    multiplicityFragment
};
