export default function validateWhitespace() {
    return (key, newValue/*, oldValue, changes */) => {
        return newValue.match(/\s/g) ? 'Should not have whitespace' : true;
    };
}
