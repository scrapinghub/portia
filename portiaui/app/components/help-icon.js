import Ember from 'ember';
import { shortGuid } from '../utils/utils';

export default Ember.Component.extend({
    tagName: '',

    tooltipClasses: null,
    tooltipContainer: 'body',
    placement: 'right',
    icon: 'help',
    classes: 'help-icon',

    init() {
        this.set('uniqueId', shortGuid());
        this._super(...arguments);
    }
});
