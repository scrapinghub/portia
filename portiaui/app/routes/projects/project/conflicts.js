import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return {
            "foo.js": {
                hello: {
                    bar: [1,2,"asd", null],
                    bool: true,
                    bool2: false,
                },
                conflicts: {
                    __CONFLICT: {
                        base_val: "hello_world",
                        my_val: "hello_pepe",
                        other_val: "hello_juan",
                    }
                },
                a: ['hello',
                        {
                            '__CONFLICT': {
                                'base_val': ['world'],
                                'my_op': 'CHANGED',
                                'my_val': ['pepe', 'luis'],
                                'other_op': 'CHANGED',
                                'other_val': ['juan']
                            }
                        }
                ]
            },
            "bar.js": {},
        };
    },

    renderTemplate() {
        this.render('projects/project/conflicts/file-selector', {
            into: 'application',
            outlet: 'side-bar',
        });

        this.render('projects/project/conflicts/help', {
            into: 'application',
            outlet: 'main',
        });
    },
});
