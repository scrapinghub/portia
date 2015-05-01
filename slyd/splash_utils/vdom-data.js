virtualDomNode = require('virtual-dom/vnode/vnode');
virtualDomText = require('virtual-dom/vnode/vtext');
virtualDomPatch = require('virtual-dom/vnode/vpatch');
virtualDomPatchOp = require('virtual-dom/patch');

parseHTML = require('html2hscript');

convertHTML = require('html-to-vdom')({
    VNode: virtualDomNode,
    VText: virtualDomText
});
