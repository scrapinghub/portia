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
			if (typeof(this._modalOKCallback) === 'function')
				this._modalOKCallback();
			return Bootstrap.ModalManager.close(name);
		},

		modalCancelled: function() {
			name = this._modalName;
			this._modalName = null;
			if (typeof(this._modalCancelCallback) === 'function')
				this._modalCancelCallback();
			return Bootstrap.ModalManager.close(name);
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
			Ember.Object.create({dismiss: 'modal', type: "primary", label: "OK", clicked: 'modalConfirmed'})
		];
		return this.showModal(title, content, buttons, okCallback);
	},

	showHTTPAlert: function(title, err, okCallback) {
		reason = err.reason;
		content = 'The server returned ' + reason['textStatus'] + '(' + reason['errorThrown'] + ')' +
				 '<br/>' + reason['jqXHR'].responseText;
		return this.showAlert(title, content, okCallback);
	},

	showConfirm: function(title, content, okCallback, cancelCallback) {
		if (this._modalName)
			return;
		this._modalName = 'ConfirmModal';
		buttons =  [
			Ember.Object.create({dismiss: 'modal', type: "primary", label: "OK", clicked: 'modalConfirmed'}),
			Ember.Object.create({dismiss: 'modal', type: "default", label: "Cancel", clicked: 'modalCancelled'})
		];
		return this.showModal(title, content, buttons, okCallback, cancelCallback);
	},

	showModal: function(title, content, buttons, okCallback, cancelCallback) {
		if (okCallback === null)
			this._modalOKCallback = null;
		else
			this._modalOKCallback = okCallback;
		if (cancelCallback === null)
			this._modalCancelCallback = null;
		else
			this._modalCancelCallback = cancelCallback;
		this._modalContent = content;
		return Bootstrap.ModalManager.open(this._modalName, title, 'modal', buttons, this);
	},
});