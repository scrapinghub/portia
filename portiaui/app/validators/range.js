import { allLetters, allDigits } from '../utils/start-urls';

function hasMixedCase(endpoints) {
    return endpoints.match(/[a-z]/) && endpoints.match(/[A-Z]/);
}

function hasSingleLetters(endpoints) {
    return endpoints.split('-').every((x) => x.length === 1);
}

function isRangeIncomplete(endpoints) {
    return endpoints.split('-').contains('');
}

function validateIncreasing(endpoints, isIncreasing) {
    const [a, b] = endpoints.split('-');
    const msg = `A range must be increasing. Try swapping to ${b}-${a}.`;
    return isIncreasing(a, b) || msg;
}

export default function validateRange() {
    return (key, newValue/*, oldValue, changes */) => {
        if (isRangeIncomplete(newValue)) {
            return 'A range must have both a start and an end.';
        }

        if (allDigits(newValue)) {
            return validateIncreasing(newValue, (a, b) => parseInt(a) <= parseInt(b));
        }

        if (allLetters(newValue)) {
            if (!hasSingleLetters(newValue)) {
                return 'A range must have only single letters.';
            }
            if (hasMixedCase(newValue)) {
                return 'A range cannot mix lower and upper case.';
            }
            return validateIncreasing(newValue, (a, b) => a <= b);
        }

        return 'A range must not mix numbers and letters.';
    };
}
