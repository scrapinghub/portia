import Ember from 'ember';


// material design colours
export const COLORS = [
    {
        name: 'indigo',
        main: '#3f51b5',
        shadow: '#1a237e'
    },
    {
        name: 'blue',
        main: '#2196f3',
        shadow: '#0d47a1'
    },
    {
        name: 'light blue',
        main: '#03a9f4',
        shadow: '#01579b'
    },
    {
        name: 'cyan',
        main: '#00bcd4',
        shadow: '#006064'
    },
    {
        name: 'teal',
        main: '#009688',
        shadow: '#004d40'
    },
    {
        name: 'green',
        main: '#4caf50',
        shadow: '#1b5e20'
    },
    {
        name: 'light green',
        main: '#8bc34a',
        shadow: '#33691e'
    },
    {
        name: 'lime',
        main: '#cddc39',
        shadow: '#827717'
    },
    {
        name: 'yellow',
        main: '#ffeb3b',
        shadow: '#f57f17'
    },
    {
        name: 'amber',
        main: '#ffc107',
        shadow: '#ff6f00'
    },
    {
        name: 'orange',
        main: '#ff9800',
        shadow: '#e65100'
    },
    {
        name: 'deep orange',
        main: '#ff5722',
        shadow: '#bf360c'
    },
    {
        name: 'red',
        main: '#f44336',
        shadow: '#b71c1c'
    },
    {
        name: 'pink',
        main: '#e91e63',
        shadow: '#880e4f'
    },
    {
        name: 'purple',
        main: '#9c27b0',
        shadow: '#4a148c'
    },
    {
        name: 'deep purple',
        main: '#673ab7',
        shadow: '#311b92'
    }
];

export const NAMED_COLORS = {};
for (let color of COLORS) {
    NAMED_COLORS[color.name] = color;
}


export function interpolate(start, end, fraction) {
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

function* generateInterpolatedColors(n) {
    // use as many colors as required interpolated between the pre-defined colors
    const spacePerColor = COLORS.length / n;

    for (let i = 0; i < n; i++) {
        var prevIndex = Math.floor(i * spacePerColor);
        var nextIndex = Math.ceil(i * spacePerColor);

        if (prevIndex === nextIndex) {
            yield COLORS[prevIndex];
        }

        yield interpolate(
            COLORS[prevIndex],
            COLORS[nextIndex] || COLORS[0],
            i * spacePerColor - prevIndex);
    }
}

export function getColors(n) {
    if (n <= COLORS.length >> 1) {
        // use every second color
        return COLORS.filter((color, index) => index % 2 === 0).slice(0, n);
    } else if (n <= COLORS.length) {
        // use all available colors
        return COLORS.slice(0, n);
    }

    return Array.from(generateInterpolatedColors(n));
}
