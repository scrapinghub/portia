import Ember from 'ember';

// material design colours
const COLORS = [
    {
        // indigo
        main: '#3f51b5',
        shadow: '#1a237e'
    },
    {
        // blue
        main: '#2196f3',
        shadow: '#0d47a1'
    },
    {
        // light blue
        main: '#03a9f4',
        shadow: '#01579b'
    },
    {
        // cyan
        main: '#00bcd4',
        shadow: '#006064'
    },
    {
        // teal
        main: '#009688',
        shadow: '#004d40'
    },
    {
        // green
        main: '#4caf50',
        shadow: '#1b5e20'
    },
    {
        // light green
        main: '#8bc34a',
        shadow: '#33691e'
    },
    {
        // lime
        main: '#cddc39',
        shadow: '#827717'
    },
    {
        // yellow
        main: '#ffeb3b',
        shadow: '#f57f17'
    },
    {
        // amber
        main: '#ffc107',
        shadow: '#ff6f00'
    },
    {
        // orange
        main: '#ff9800',
        shadow: '#e65100'
    },
    {
        // deep orange
        main: '#ff5722',
        shadow: '#bf360c'
    },
    {
        // red
        main: '#f44336',
        shadow: '#b71c1c'
    },
    {
        // pink
        main: '#e91e63',
        shadow: '#880e4f'
    },
    {
        // purple
        main: '#9c27b0',
        shadow: '#4a148c'
    },
    {
        // deep purple
        main: '#673ab7',
        shadow: '#311b92'
    }
];

const AutomaticColor = Ember.Object.extend({
    clientIndex: Ember.computed('provider.orderedClients.@each.colorOrder', function() {
        return this.get('provider.orderedClients').indexOf(this.get('client'));
    }),
    color: Ember.computed('totalClients', 'clientIndex', function() {
        var clientIndex = this.get('clientIndex');
        var totalClients = this.get('totalClients');

        if (totalClients <= COLORS.length >> 1) {
            // use every second color
            return COLORS[clientIndex << 1];
        } else if (totalClients <= COLORS.length) {
            // use all available colors
            return COLORS[clientIndex];
        }

        // use as many colors as required interpolated between the pre-defined colors
        var spacePerColor = COLORS.length / totalClients;
        var prevIndex = Math.floor(clientIndex * spacePerColor);
        var nextIndex = Math.ceil(clientIndex * spacePerColor);

        if (prevIndex === nextIndex) {
            return COLORS[prevIndex];
        }

        return this.interpolate(
            COLORS[prevIndex],
            COLORS[nextIndex] || COLORS[0],
            clientIndex * spacePerColor - prevIndex
        );
    }),
    main: Ember.computed.readOnly('color.main'),
    shadow: Ember.computed.readOnly('color.shadow'),
    totalClients: Ember.computed.readOnly('provider.orderedClients.length'),

    interpolate(start, end, fraction) {
        return {
            main: Ember.$.Color(start.main).transition(
                Ember.$.Color(end.main),
                fraction
            ).toHexString(),
            shadow: Ember.$.Color(start.shadow).transition(
                Ember.$.Color(end.shadow),
                fraction
            ).toHexString()
        };
    }
});

export default Ember.Service.extend({
    clients: [],
    clientsOrderBy: ['colorOrder'],
    orderedClients: Ember.computed.sort('clients', 'clientsOrderBy'),

    register(client) {
        this.get('clients').addObject(client);
        return AutomaticColor.create({
            client: client,
            provider: this
        });
    },

    unRegister(client) {
        this.get('clients').removeObject(client);
    }
});
