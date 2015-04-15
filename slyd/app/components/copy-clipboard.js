import ZeroClipboard from 'ember-cli-zero-clipboard/components/zero-clipboard';

export default ZeroClipboard.extend({
    layoutName: 'components/bs-button',
    tagName: 'button',
    classNameBindings: 'class',
    class: 'btn btn-default btn-xs btn-xs-size fa fa-icon fa-clipboard',
    icon: 'fa fa-icon fa-clipboard',

    actions: {
        afterCopy: function() {
        }
    }
});