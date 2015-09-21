import Ember from 'ember';


export default Ember.Component.extend({
    tagName: '',

    annotation: Ember.computed.readOnly('item.content')
});
