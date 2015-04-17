import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'a',

    click: function() {
        this.sendAction('clicked');
        if (!this.element.href) {
            this.get('slyd').makeAjaxCall({
                type: 'POST',
                url: '/projects',
                data: JSON.stringify({'cmd': 'download',
                                      'args': [this.get('slyd.project'), '*']}),
                dataType: 'binary'
            }).then(function(blob) {
                this.element.setAttribute('href', window.URL.createObjectURL(blob));
                Ember.run.next(this, function() {
                    this.element.click();
                    this.element.removeAttribute('href');
                });
            }.bind(this));
        }
    }
});
