window.deprecationWorkflow = window.deprecationWorkflow || {};
window.deprecationWorkflow.config = {
    workflow: [
        { handler: "silence", matchMessage: /You modified .+ twice in a single render. This was unreliable in Ember 1.x and will be removed in Ember 3.0/ }
    ]
};
