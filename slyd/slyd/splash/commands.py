import hashlib
import json
import re

from scrapy.http import Request
from scrapy.item import DictItem

from splash.browser_tab import JsError

from .utils import clean, page, open_tab


_VIEWPORT_RE = re.compile('^\d{3,5}x\d{3,5}$')


@open_tab
def fetch_page(data, socket):
    """Load page in virtual url from provided url"""
    if 'url' in data:
        socket.tab.loaded = False
        socket.tab.go(data['url'],
                      lambda: socket.sendMessage(fetch_response(data, socket)),
                      lambda: socket.sendMessage({'error': 4500,
                                                  'message': 'Unknown error'}))
        return {'message': 'loading "%s" in tab' % data['url']}


@open_tab
def interact_page(data, socket):
    """Execute JS event from front end on virtual tab"""
    data.pop('_meta', {})
    data.pop('_command', {})
    event = json.dumps(data.get('interaction', {}))
    try:
        diff = socket.tab.evaljs('window.livePortiaPage.interact(%s);' % event)
    except JsError:
        diff = None
    if diff:
        return {'diff': diff}


def fetch_response(data, socket):
    socket.tab.run_js_files('/app/slyd/public/interact', handle_errors=False)
    socket.tab.loaded = True
    url = socket.tab.url
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    return {
        'id': data['_meta'].get('id'),
        'fp': hashlib.sha1(socket.tab.url).hexdigest(),
        'page': clean(html, url),
        'url': url,
        'original': html,
        'items': [],
        'links': [],
        'response': {
            'headers': {},  # TODO: Get headers
            'status': socket.tab.last_http_status()
        },
        '_command': 'fetch',
    }


def extract(data, socket):
    """Run spider on page URL to get extracted links and items"""
    def _get_template_name(template_id, templates):
        for template in templates:
            if template['page_id'] == template_id:
                return template['name']
    items, links = [], []
    templates = socket.spiderspec.templates
    url = socket.tab.url
    html = socket.tab.evaljs('document.documentElement.outerHTML')
    for value in socket.spider.parse(page(url, html)):
        if isinstance(value, Request):
            links.append(value.url)
        elif isinstance(value, DictItem):
            value['_template_name'] = _get_template_name(value['_template'],
                                                         templates)
            items.append(value._values)
        else:
            raise ValueError("Unexpected type %s from spider" %
                             type(value))
    return {
        'items': items,
        'links': links
    }


def resize(data, socket):
    """Resize virtual tab viewport to match user's viewport"""
    try:
        if 'size' in data and _VIEWPORT_RE.search(data['size']):
            socket.tab.set_viewport(data['size'])
    except (KeyError, AttributeError):
        pass  # Tab isn't open. The size will be set when opened


def close_tab(data, socket):
    """Close virtual tab if it is open"""
    if socket.tab is not None:
        socket.tab.close()
        socket.factory[socket].tab = None


def updates(data, socket):
    """Get any changes that might have occurred asynchronously"""
    if socket.tab and socket.tab.loaded:
        data['interaction'] = {}
        return interact_page(data, socket)
