window.deprecationWorkflow = window.deprecationWorkflow || {};
window.deprecationWorkflow.config = {
    workflow: [
        // each-in is built into Ember 2.0
        { handler: "silence", matchMessage: "The helper \"each-in\" is a deprecated bare function helper. Please use Ember.Helper.build to wrap helper functions." },

        // get is built into Ember 2.0
        { handler: "silence", matchMessage: "ember-get-helper has been included in Ember 2.0. Use of this package is deprecated." },

        // from deprecated FixtureAdapter
        { handler: "silence", matchMessage: "Adapter#find has been deprecated and renamed to `findRecord`." },
        { handler: "silence", matchMessage: "The default behavior of `shouldBackgroundReloadRecord` will change in Ember Data 2.0 to always return true. If you would like to preserve the current behavior please override `shouldBackgroundReloadRecord` in your adapter:application and return false." },
        { handler: "silence", matchMessage: "The default behavior of shouldReloadAll will change in Ember Data 2.0 to always return false when there is at least one \"project\" record in the store. If you would like to preserve the current behavior please override shouldReloadAll in your adapter:application and return true." },
        { handler: "silence", matchMessage: /In Ember Data 2.0, relationships will be asynchronous by default. You must set `[^`]+` if you wish for a relationship remain synchronous./ },

        { handler: "silence", matchMessage: /You modified .+ twice in a single render. This was unreliable in Ember 1.x and will be removed in Ember 2.0/ }
    ]
};
