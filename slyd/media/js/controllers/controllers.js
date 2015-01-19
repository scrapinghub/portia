ASTool.BaseControllerMixin = Ember.Mixin.create({
	__modal_content: null,

	openAccordion: function(accordionNumber) {
		$( ".accordion" ).accordion("option", "active", accordionNumber);
	},

	getUnusedName: function(baseName, usedNames) {
		var i = 1;
		var newName = baseName;
		while(usedNames.any(function(usedName) {
			return usedName == newName;
		})) {
			newName = baseName + '_' + i++;
		}
		return newName;
	},

	actions: {
		modalConfirmed: function() {
			name = this._modalName;
			this._modalName = null;
			if (typeof(this._modalOKCallback) === 'function') this._modalOKCallback();
			if (name) return Bootstrap.ModalManager.get(name).destroy();
		},

		modalCancelled: function() {
			name = this._modalName;
			this._modalName = null;
			if (typeof(this._modalCancelCallback) === 'function') this._modalCancelCallback();
			if (name) return Bootstrap.ModalManager.get(name).destroy();
		},
	},

	serverCapability: function(capability) {
		return ASTool.serverCapabilities.get(capability);
	},

	showAlert: function(title, content, okCallback) {
		if (this._modalName)
			return;
		this._modalName = 'AlertModal';
		buttons =  [
			Ember.Object.create({dismiss: 'modal', type: "primary", label: "OK", clicked: 'modalConfirmed', size: 'sm'})
		];
		return this.showModal(title, content, buttons, okCallback);
	},

	showHTTPAlert: function(title, err, okCallback) {
		reason = err.reason;
		content = reason['jqXHR'].responseText;
		return this.showAlert(title, content, okCallback);
	},

	showConfirm: function(title, content, okCallback, cancelCallback, button_class, button_text) {
		if (this._modalName) // There is already a modal visible
			return;
		if (button_class === undefined) button_class = 'primary';
		if (button_text === undefined) button_text = 'OK';
		this._modalName = 'ConfirmModal';
		buttons =  [
			Ember.Object.create({dismiss: 'modal', type: "default", label: "Cancel", clicked: 'modalCancelled', size: 'sm'}),
			Ember.Object.create({dismiss: 'modal', type: button_class, label: button_text, clicked: 'modalConfirmed', size: 'sm'})
		];
		return this.showModal(title, content, buttons, okCallback, cancelCallback);
	},

	showModal: function(title, content, buttons, okCallback, cancelCallback) {
		this._modalOKCallback = okCallback;
		this._modalCancelCallback = cancelCallback;
		this._modalContent = content;
		return Bootstrap.ModalManager.open(this._modalName, title, 'modal', buttons, this);
	},
});