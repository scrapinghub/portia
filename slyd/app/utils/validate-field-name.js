export default function validateFieldName(name, fields) {
    // Ensuring that field names don't start with underscores prevents
    // overwriting _item, _template and any future "protected" property
    // we might add to extracted items.
    if (/^_/.test(name)) {
        return "Field can't start with underscores";
    } else if (name === 'url') {
        return 'Naming a field "url" is not allowed as there is already a field with this name';
    } else if (fields.findBy('name', name)) {
        return 'There is already a field with that name.';
    }
    return null; // No error
}
