import Ember from 'ember';


// material design colours
export const COLORS = [
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
