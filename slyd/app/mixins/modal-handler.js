import Ember from 'ember';

export default Ember.Mixin.create({

    actions: {
        modalConfirmed: function() {
            var name = this._modalName;
            this._modalName = null;
            if (typeof(this._modalOKCallback) === 'function') {
                this._modalOKCallback();
            }
            if (name) {
                return this.ModalManager.get(name).destroy();
            }
        },

        modalCancelled: function() {
            var name = this._modalName;
            this._modalName = null;
            if (typeof(this._modalCancelCallback) === 'function') {
                this._modalCancelCallback();
            }
            if (name) {
                return this.ModalManager.get(name).destroy();
            }
        },
    },

    showAlert: function(title, content, okCallback) {
        if (this._modalName) {
            return;
        }
        this._modalName = 'AlertModal';
        var buttons =  [
            Ember.Object.create({dismiss: 'modal', type: "primary", label: "OK", clicked: 'modalConfirmed', size: 'sm'})
        ];
        return this.showModal(title, content, buttons, okCallback);
    },

    showHTTPAlert: function(title, err, okCallback) {
        var reason = err.reason;
        var content = reason['jqXHR'].responseText;
        return this.showAlert(title, content, okCallback);
    },

    showConfirm: function(title, content, okCallback, cancelCallback, button_class, button_text) {
        if (this._modalName) { // There is already a modal visible
            return;
        }
        if (button_class === undefined) {
            button_class = 'primary';
        }
        if (button_text === undefined) {
            button_text = 'OK';
        }
        this._modalName = 'ConfirmModal';
        var buttons =  [
            Ember.Object.create({dismiss: 'modal', type: "default", label: "Cancel", clicked: 'modalCancelled', size: 'sm'}),
            Ember.Object.create({dismiss: 'modal', type: button_class, label: button_text, clicked: 'modalConfirmed', size: 'sm'})
        ];
        return this.showModal(title, content, buttons, okCallback, cancelCallback);
    },

    showModal: function(title, content, buttons, okCallback, cancelCallback) {
        this._modalOKCallback = okCallback;
        this._modalCancelCallback = cancelCallback;
        return this.ModalManager.open(this._modalName, title, buttons, content, this);
    },
});
