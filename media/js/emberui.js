$.widget( "custom.combobox", {
    _create: function() {
        this.wrapper = $( "<span>" )
            .addClass( "custom-combobox" )
            .insertAfter( this.element );
 
        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
    },
 
    _createAutocomplete: function() {
        var selected = this.element.children( ":selected" ),
            value = selected.val() ? selected.text() : "";
 
        this.input = $( "<input>" )
            .appendTo( this.wrapper )
            .val( value )
            .attr( "title", "" )
            .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
            .autocomplete({
                delay: 0,
                minLength: 0,
                source: $.proxy( this, "_source" )
            })
            .tooltip({
                tooltipClass: "ui-state-highlight"
            });
 
        this._on( this.input, {
            autocompleteselect: function( event, ui ) {
                ui.item.option.selected = true;
                this._trigger( "select", event, { item: ui.item.option });
            },
 
            autocompletechange: "_removeIfInvalid" }
        );
    },
 
    _createShowAllButton: function() {
        var input = this.input,
            wasOpen = false;
 
        $( "<a>" )
            .attr( "tabIndex", -1 )
            .appendTo( this.wrapper )
            .button({
                icons: {
                    primary: "ui-icon-triangle-1-s"
                },
                text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( "custom-combobox-toggle ui-corner-right" )
            .mousedown(function() {
                wasOpen = input.autocomplete( "widget" ).is( ":visible" );
            })
            .click(function() {
                input.focus();
                // Close if already visible
                if ( wasOpen ) {
                    return;
                }
 
            // Pass empty string as value to search for, displaying all results
            input.autocomplete( "search", "" );
        });
    },
 
    _source: function( request, response ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        response( this.element.children( "option" ).map(function() {
            var text = $( this ).text();
            if ( this.value && ( !request.term || matcher.test(text) ) )
                return {
                    label: text,
                    value: text,
                    option: this
            };
        }));
    },
 
    _removeIfInvalid: function( event, ui ) {
 
       // Selected an item, nothing to do
        if ( ui.item ) {
            return;
        }
 
        // Search for a match (case-insensitive)
        var value = this.input.val(),
            valueLowerCase = value.toLowerCase(),
            valid = false;
        this.element.children( "option" ).each(function() {
            if ( $( this ).text().toLowerCase() === valueLowerCase ) {
                this.selected = valid = true;
                return false;
            }
        });
 
        // Found a match, nothing to do
        if ( valid ) {
            return;
        }
 
        // Remove invalid value
        this.input
            .val( "" )
            .attr( "title", value + " didn't match any item" )
            .tooltip( "open" );
        this.element.val( "" );
        this._delay(function() {
            this.input.tooltip( "close" ).attr( "title", "" );
        }, 2500 );
        this.input.data( "ui-autocomplete" ).term = "";
    },
 
    _destroy: function() {
        this.wrapper.remove();
        this.element.show();
    }
});



/* Ember - JQuery UI integration */

// Put jQuery UI inside its own namespace
JQ = Ember.Namespace.create();

// Create a new mixin for jQuery UI widgets using the Ember
// mixin syntax.
JQ.Widget = Em.Mixin.create({
    // When Ember creates the view's DOM element, it will call this
    // method.
    didInsertElement: function() {
        // Make jQuery UI options available as Ember properties
        var options = this._gatherOptions();

        // Make sure that jQuery UI events trigger methods on this view.
        this._gatherEvents(options);

        // Create a new instance of the jQuery UI widget based on its `uiType`
        // and the current element.
        var ui;
        if (jQuery.ui[this.get('uiType')]) {
            ui = jQuery.ui[this.get('uiType')](options, this.get('element'));
        } else {
            ui = jQuery.custom[this.get('uiType')](options, this.get('element'));
        }

        // Save off the instance of the jQuery UI widget as the `ui` property
        // on this Ember view.
        this.set('ui', ui);
    },

    // When Ember tears down the view's DOM element, it will call
    // this method.
    willDestroyElement: function() {
        var ui = this.get('ui');

        if (ui) {
            // Tear down any observers that were created to make jQuery UI
            // options available as Ember properties.
            var observers = this._observers;
            for (var prop in observers) {
                if (observers.hasOwnProperty(prop)) {
                    this.removeObserver(prop, observers[prop]);
                }
            }
            ui._destroy();
        }
    },

    // Each jQuery UI widget has a series of options that can be configured.
    // For instance, to disable a button, you call
    // `button.options('disabled', true)` in jQuery UI. To make this compatible
    // with Ember bindings, any time the Ember property for a
    // given jQuery UI option changes, we update the jQuery UI widget.
    _gatherOptions: function() {
        var uiOptions = this.get('uiOptions'), options = {};
        // The view can specify a list of jQuery UI options that should be treated
        // as Ember properties.
        uiOptions.forEach(function(key) {
            options[key] = this.get(key);

            // Set up an observer on the Ember property. When it changes,
            // call jQuery UI's `option` method to reflect the property onto
            // the jQuery UI widget.
            var observer = function() {
                var value = this.get(key);
                this.get('ui').option(key, value);
            };

            this.addObserver(key, observer);

            // Insert the observer in a Hash so we can remove it later.
            this._observers = this._observers || {};
            this._observers[key] = observer;
        }, this);
        return options;
    },

    // Each jQuery UI widget has a number of custom events that they can
    // trigger. For instance, the progressbar widget triggers a `complete`
    // event when the progress bar finishes. Make these events behave like
    // normal Ember events. For instance, a subclass of JQ.ProgressBarView
    // could implement the `complete` method to be notified when the jQuery
    // UI widget triggered the event.
    _gatherEvents: function(options) {
        var uiEvents = this.get('uiEvents') || [], self = this;

        uiEvents.forEach(function(event) {
            var callback = self[event];

            if (callback) {
                // You can register a handler for a jQuery UI event by passing
                // it in along with the creation options. Update the options hash
                // to include any event callbacks.
                 options[event] = function(event, ui) { callback.call(self, event, ui); };
            }
        });
    }
});