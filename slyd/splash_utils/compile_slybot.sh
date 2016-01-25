#!/bin/bash

{
    echo ";(function(){"

    cat 'es5-shim-fixes.js'
    cat '../node_modules/es5-shim/es5-shim.js'

    # Page actions scripts
    cat 'waitAsync.js'
    cat 'perform_actions.js'

    echo '})();'
} > ../../slybot/slybot/splash-script-combined.js

