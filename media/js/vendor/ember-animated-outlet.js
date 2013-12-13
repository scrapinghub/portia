/**
  Write me...
 
  @class AnimatedContainerView
  @namespace Ember
  @extends Ember.ContainerView
*/
Ember.AnimatedContainerView = Ember.ContainerView.extend({

    classNames: ['ember-animated-container'],
    
    init: function() {
        this._super();
        //Register this view, so queued effects can be related with this view by name
        Ember.AnimatedContainerView._views[this.get('name')] = this;
        this._isAnimating = false;
    },
    
    willDestroy: function() {
        this._super();
        //Clean up
        var name = this.get('name');
        delete Ember.AnimatedContainerView._views[name];
        delete Ember.AnimatedContainerView._animationQueue[name];
    },
    
    //Override parent method
    _currentViewWillChange: Ember.beforeObserver(function() {
        var currentView = Ember.get(this, 'currentView');
        if (currentView) {
            //Store the old `currentView` (and don't destroy it yet) so we can use it for animation later
            this.set('oldView', currentView);
        }
    }, 'currentView'),

    _currentViewDidChange: Ember.observer(function() {
        var newView = Ember.get(this, 'currentView'),
            oldView = Ember.get(this, 'oldView'),
            name = this.get('name'),
            effect = null;
        if (newView) {
            if (oldView) {
                Ember.assert('Ember.AnimatedContainerView can only animate non-virtual views. You need to explicitly define your view class.', !oldView.isVirtual);
                Ember.assert('Ember.AnimatedContainerView can only animate non-virtual views. You need to explicitly define your view class.', !newView.isVirtual);
                //Get and validate a potentially queued effect
                effect = Ember.AnimatedContainerView._animationQueue[name];
                delete Ember.AnimatedContainerView._animationQueue[name];
                if (effect && !Ember.AnimatedContainerView._effects[effect]) {
                    Ember.warn('Unknown animation effect: '+effect);
                    effect = null;
                }
                //Forget about the old view
                this.set('oldView', null);
            }
            //If there is already an animation queued, we should cancel it
            if (this._queuedAnimation) {
                oldView.destroy(); //the oldView has never been visible, and never will be, so we can just destroy it now
                oldView = this._queuedAnimation.oldView; //instead, use the oldView from the queued animation, which is our real currentView
            }
            //Queue this animation and check the queue
            this._queuedAnimation = {
                newView: newView,
                oldView: oldView,
                effect: effect
            };
            this._handleAnimationQueue();
        }
    }, 'currentView'),

    _handleAnimationQueue: function() {
        //If animation is in progress, just stop here. Once the animation has finished, this method will be called again.
        if (this._isAnimating) {
            return;
        }
        var self = this,
            q = this._queuedAnimation;
        if (q) {
            var newView = q.newView,
                oldView = q.oldView,
                effect = q.effect;
            this._queuedAnimation = null;
            //Push the newView to this view, which will append it to the DOM
            this.pushObject(newView);
            if (oldView && effect) {
                //If an effect is queued, then start the effect when the new view has been inserted in the DOM
                this._isAnimating = true;
                newView.on('didInsertElement', function() {
                    Ember.AnimatedContainerView._effects[effect](self, newView, oldView, function() {
                        Em.run(function() {
                            self.removeObject(oldView);
                            oldView.destroy();
                            //Check to see if there are any queued animations
                            self._isAnimating = false;
                            self._handleAnimationQueue();
                        });
                    });
                });
            } else {
                if (oldView) {
                    //If there is no effect queued, then just remove the old view (as would normally happen in a ContainerView)
                    this.removeObject(oldView);
                    oldView.destroy();
                }
            }
        }
    },

    enqueueAnimation: function(effect) {
        Ember.AnimatedContainerView._animationQueue[this.get('name')] = effect;
    },
    
    setCurrentViewAnimated: function(currentView, effect) {
        this.enqueueAnimation(effect);
        this.set('currentView', currentView);
    }

});

Ember.AnimatedContainerView.reopenClass({
    
    /**
      All animated outlets registers itself in this hash
       
      @private
      @property {Object} _views
    */
    _views: {},

    /**
      Whenever an animated route transition is set in motion, it will be stored here, so the animated outlet view can pick it up

      @private
      @property {Object} _animationQueue
    */
    _animationQueue: {},

    /**
      Enqueue effects to be executed by the given outlets when the next route transition happens.
      
      @param {Object} animations A hash with keys corresponding to outlet views and values with the desired animation effect.
    */
    enqueueAnimations: function(animations) {
        for (var name in animations) {
            if (!animations.hasOwnProperty(name)) continue;
            this._animationQueue[name] = animations[name];
        }
    },

    /**
      All animation effects are stored on this object and can be referred to by its key

      @private
      @property {Object} effects
    */
    _effects: {},


    /**
      Register a new effect.
     
      The `callback` function will be passed the following parameters:
     
      - The `Ember.AnimatedContainerView` instance.
      - The new view.
      - The old view.

      @param {String} effect The name of the effect, e.g. 'slideLeft'
      @param {Function} callback The function to call when effect has to be executed
    */
    registerEffect: function(effect, callback) {
        this._effects[effect] = callback;
    }

});

/**
  Write me...

  Straight-up stolen from `Handlebars.registerHelper('outlet', ...);`

  @method outlet
  @for Ember.Handlebars.helpers
  @param {String} property the property on the controller that holds the view for this outlet
*/
Handlebars.registerHelper('animated-outlet', function(property, options) {
    var outletSource;

    if (property && property.data && property.data.isRenderData) {
        options = property;
        property = 'main';
    }

    outletSource = options.data.view;
    while (!(outletSource.get('template.isTop'))){
        outletSource = outletSource.get('_parentView');
    }

    options.data.view.set('outletSource', outletSource);
    options.hash.currentViewBinding = '_view.outletSource._outlets.' + property;

    //Only this line has been changed
    return Ember.Handlebars.helpers.view.call(this, Ember.AnimatedContainerView, options);
});

/**
  See animated-outlet
*/
Handlebars.registerHelper('animatedOutlet', function(property, options) {
    Ember.warn("The 'animatedOutlet' view helper is deprecated in favor of 'animated-outlet'");
    return Ember.Handlebars.helpers['animated-outlet'].apply(this, arguments);
});
/**
@module ember
@submodule ember-routing
*/

var get = Ember.get, set = Ember.set;

Ember.onLoad('Ember.Handlebars', function(Handlebars) {
  var resolveParams = Ember.Router.resolveParams,
      isSimpleClick = Ember.ViewUtils.isSimpleClick;

  function fullRouteName(router, name) {
    if (!router.hasRoute(name)) {
      name = name + '.index';
    }

    return name;
  }

  function resolvedPaths(options) {
    var types = options.options.types.slice(1),
        data = options.options.data;

    return resolveParams(options.context, options.params, { types: types, data: data });
  }

  function args(linkView, router, route) {
    var ret = get(linkView,'routeArgs').slice(),
        animations = linkView.parameters.animations;
    ret.splice(1,0,animations);
    return ret;
  }

  /**
    Renders a link to the supplied route using animation.

    @class AnimatedLinkView
    @namespace Ember
    @extends Ember.LinkView
  **/
  var AnimatedLinkView = Ember.AnimatedLinkView = Ember.LinkView.extend({
    _invoke: function(event) {
      if (!isSimpleClick(event)) { return true; }

      event.preventDefault();
      if (this.bubbles === false) { event.stopPropagation(); }

      if (get(this, '_isDisabled')) { return false; }

      if (get(this, 'loading')) {
        Ember.Logger.warn("This link-to is in an inactive loading state because at least one of its parameters presently has a null/undefined value, or the provided route name is invalid.");
        return false;
      }

      var router = this.get('router'),
          routeArgs = args(this, router);

      if (get(this, ('replace'))) {
        router.replaceWithAnimated.apply(router, routeArgs);
      } else {
        router.transitionToAnimated.apply(router, routeArgs);
      }
    }
  });

  AnimatedLinkView.toString = function() { return "AnimatedLinkView"; };

  /**
    @method linkToAnimated
    @for Ember.Handlebars.helpers
    @param {String} routeName
    @param {Object} [context]*
    @return {String} HTML string
  */
  Ember.Handlebars.registerHelper('link-to-animated', function(name) {
    var options = [].slice.call(arguments, -1)[0],
        params = [].slice.call(arguments, 0, -1),
        hash = options.hash;

    Ember.assert("link-to-animated must contain animations", typeof(hash.animations) == 'string')
    var re = /\s*([a-z]+)\s*:\s*([a-z]+)/gi;
    var animations = {};
    while (match = re.exec(hash.animations)) {
      animations[match[1]] = match[2];
    }
    delete(hash.animations)
    hash.namedRoute = name;
    hash.currentWhen = hash.currentWhen || name;
    hash.disabledBinding = hash.disabledWhen;

    hash.parameters = {
      context: this,
      options: options,
      animations: animations,
      params: params
    };

    return Ember.Handlebars.helpers.view.call(this, AnimatedLinkView, options);
  });
  
  /**
    See link-to-animated

    @method linkTo
    @for Ember.Handlebars.helpers
    @deprecated
    @param {String} routeName
    @param {Object} [context]*
    @return {String} HTML string
  */
  Ember.Handlebars.registerHelper('linkToAnimated', function() {
    Ember.warn("The 'linkToAnimated' view helper is deprecated in favor of 'link-to-animated'");
    return Ember.Handlebars.helpers['link-to-animated'].apply(this, arguments);
  });

});


Ember.Router.reopen({

    /**
      Works as {@link Ember.Router.transitionTo}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    transitionToAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.transitionTo.apply(this, arguments);
    },

    /**
      Works as {@link Ember.Router.replaceWith}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    replaceWithAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.replaceWith.apply(this, arguments);
    }

});


Ember.Route.reopen({

  transitionToAnimated: function(name, context) {
      var router = this.router;
      return router.transitionToAnimated.apply(router, arguments);
  },

  replaceWithAnimated: function() {
      var router = this.router;
      return router.replaceWithAnimated.apply(router, arguments);
  }

});

Ember.ControllerMixin.reopen({

    /**
      Works as {@link Ember.ControllerMixin.transitionToRoute}} except that it takes a third parameter, `animations`,
      which will enqueue animations.
     
      `animations` should be an object with outlet names as keys and effect names as value.
     
      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    transitionToRouteAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.transitionToRoute.apply(this, arguments);
    },

    /**
      Works as {@link Ember.ControllerMixin.replaceRoute}} except that it takes a third parameter, `animations`,
      which will enqueue animations.

      `animations` should be an object with outlet names as keys and effect names as value.

      @param name
      @param animations {Object} Animations to enqueue
      @param model
    */
    replaceRouteAnimated: function(name, animations, model) {
        Ember.AnimatedContainerView.enqueueAnimations(animations);
        Array.prototype.splice.call(arguments, 1, 1);
        return this.replaceRoute.apply(this, arguments);
    }

});
Ember.AnimatedContainerView.registerEffect('fade', function(ct, newView, oldView, callback) {
    var newEl = newView.$(),
        oldEl = oldView.$();
    newEl.addClass('ember-animated-container-fade-new');
    oldEl.addClass('ember-animated-container-fade-old');
    setTimeout(function() {
        oldEl.addClass('ember-animated-container-fade-old-fading');
        setTimeout(function() {
            newEl.removeClass('ember-animated-container-fade-new');
            callback();
        }, 550);
    }, 0);
});
Ember.AnimatedContainerView.registerEffect('flip', function(ct, newView, oldView, callback) {
    var ctEl = ct.$(),
        newEl = newView.$(),
        oldEl = oldView.$();
    ctEl.wrap('<div class="ember-animated-container-flip-wrap"></div>')
    ctEl.addClass('ember-animated-container-flip-ct');
    newEl.addClass('ember-animated-container-flip-new');
    oldEl.addClass('ember-animated-container-flip-old');
    setTimeout(function() {
        ctEl.addClass('ember-animated-container-flip-ct-flipping');
        setTimeout(function() {
            ctEl.unwrap();
            ctEl.removeClass('ember-animated-container-flip-ct');
            ctEl.removeClass('ember-animated-container-flip-ct-flipping');
            newEl.removeClass('ember-animated-container-flip-new');
            callback();
        }, 650);
    }, 0);
});
(function() {
    
var slide = function(ct, newView, oldView, callback, direction, slow) {
    var ctEl = ct.$(),
        newEl = newView.$(),
        duration = slow ? 2050 : 450;
    ctEl.addClass('ember-animated-container-slide-'+direction+'-ct')
    if (slow) {
        ctEl.addClass('ember-animated-container-slide-slow-ct')
    }
    newEl.addClass('ember-animated-container-slide-'+direction+'-new');
    setTimeout(function() {
        ctEl.addClass('ember-animated-container-slide-'+direction+'-ct-sliding');
        setTimeout(function() {
            ctEl.removeClass('ember-animated-container-slide-'+direction+'-ct');
            if (slow) {
                ctEl.removeClass('ember-animated-container-slide-slow-ct')
            }
            ctEl.removeClass('ember-animated-container-slide-'+direction+'-ct-sliding');
            newEl.removeClass('ember-animated-container-slide-'+direction+'-new');
            setTimeout(function() {
                callback();
            }, 0);
        }, duration);
    }, 0);
};

Ember.AnimatedContainerView.registerEffect('slideLeft', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'left', false);
});

Ember.AnimatedContainerView.registerEffect('slideRight', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'right', false);
});

Ember.AnimatedContainerView.registerEffect('slideUp', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'up', false);
});

Ember.AnimatedContainerView.registerEffect('slideDown', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'down', false);
});

Ember.AnimatedContainerView.registerEffect('slowSlideLeft', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'left', true);
});
    
Ember.AnimatedContainerView.registerEffect('slowSlideRight', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'right', true);
});

Ember.AnimatedContainerView.registerEffect('slowSlideUp', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'up', false);
});

Ember.AnimatedContainerView.registerEffect('slowSlideDown', function(ct, newView, oldView, callback) {
    slide(ct, newView, oldView, callback, 'down', false);
});

})();
(function() {

var slideOver = function(ct, newView, oldView, callback, direction) {
    var ctEl = ct.$(),
        newEl = newView.$(),
        duration = 450;
    ctEl.addClass('ember-animated-container-slideOver-old');
    setTimeout(function() {
        newEl.addClass('ember-animated-container-slideOver-'+direction+'-new');
        newEl.addClass('ember-animated-container-slideOver-'+direction+'-new-sliding');
        setTimeout(function() {
            newEl.removeClass('ember-animated-container-slideOver-'+direction+'-new');
            newEl.removeClass('ember-animated-container-slideOver-'+direction+'-new-sliding');
            ctEl.removeClass('ember-animated-container-slideOver-old');
            callback();
        }, duration);
    }, 0);
};

Ember.AnimatedContainerView.registerEffect('slideOverLeft', function(ct, newView, oldView, callback) {
    slideOver(ct, newView, oldView, callback, 'left');
});

Ember.AnimatedContainerView.registerEffect('slideOverRight', function(ct, newView, oldView, callback) {
    slideOver(ct, newView, oldView, callback, 'right');
});

Ember.AnimatedContainerView.registerEffect('slideOverUp', function(ct, newView, oldView, callback) {
    slideOver(ct, newView, oldView, callback, 'up');
});

Ember.AnimatedContainerView.registerEffect('slideOverDown', function(ct, newView, oldView, callback) {
    slideOver(ct, newView, oldView, callback, 'down');
});

})();