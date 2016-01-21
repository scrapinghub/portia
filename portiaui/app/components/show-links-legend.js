import Ember from 'ember';
import { NAMED_COLORS } from '../utils/colors';

export default Ember.Component.extend({
    tagName: '',

    colors: NAMED_COLORS,
    followedLinks: 0,
    jsLinks: 0,
    ignoredLinks: 0
});
