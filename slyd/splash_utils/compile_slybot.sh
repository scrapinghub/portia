#!/bin/bash

{
    echo ";(function(){"

    cat 'es5-shim-fixes.js'
    cat '../node_modules/es5-shim/es5-shim.js'
    cat 'local-storage-shim.js'

    echo '})();'
} > ../../slybot/slybot/splash-script-combined.js

