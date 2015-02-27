<<<<<<< HEAD
import ZeroClipboard from 'ember-cli-zero-clipboard/components/zero-clipboard';

export default ZeroClipboard.extend({
    layoutName: 'components/bs-button',
    tagName: 'button',
    classNameBindings: 'class',
    class: 'btn btn-default btn-xs',
    icon: 'fa fa-icon fa-clipboard',

    actions: {
        afterCopy: function() {
        }
    }
});
=======
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
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
