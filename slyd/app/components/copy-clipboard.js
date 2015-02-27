import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'embed',
    text: '',
    src: 'assets/clippy.swf',
    width:"14",
    height: "14",
    scale: "noscale",
    name: "clippy",
    quality: "high",
    allowScriptAccess: "always",
    type: "application/x-shockwave-flash",
    pluginspage: "http://www.macromedia.com/go/getflashplayer",

    flashvars: function() {
        return 'text=' + this.get('text');
    }.property('text'),

    attributeBindings: ['src', 'width', 'height', 'name', 'quality', 'allowScriptAccess',
        'type', 'pluginspage', 'flashvars', 'scale'],
});
