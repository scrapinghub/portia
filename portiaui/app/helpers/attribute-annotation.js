import Ember from 'ember';


export function attributeAnnotation([element, attribute, annotations]) {
    return (annotations || []).find(annotation =>
        annotation.get('elements').includes(element) &&
        annotation.getWithDefault('attribute', null) === attribute) || {};
}

export default Ember.Helper.helper(attributeAnnotation);
