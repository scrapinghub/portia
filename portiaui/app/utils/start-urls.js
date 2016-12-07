const SAMPLE_SIZE = 20;
const ALL_DIGITS = /^\d+-\d+$/;
const ALL_LETTERS = /^[a-zA-Z]+-[a-zA-Z]+$/;

function nextLetter(letter) {
    return String.fromCharCode(letter.charCodeAt(0) + 1);
}

function numberRange(a, b) {
    const numbers = [];
    for(let i = a; i < b + 1; i += 1) {
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

function _processDigitRange(value) {
    const endpoints = value.split('-');
    let [a, b] = endpoints.map(x => parseInt(x));
    b = Math.min(b, a + SAMPLE_SIZE);
    return [a, b];
}

function augmentRange(fragment_value) {
    if (allDigits(fragment_value)) {
      const [a, b] = _processDigitRange(fragment_value);
      return numberRange(a, b);
    }

    if (allLetters(fragment_value)) {
      const [a, b] = fragment_value.split('-');
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
                return numberRange(parseInt(a), parseInt(b)).length;
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
