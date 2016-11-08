import json
import re

LUA_SOURCE = """
function main(splash)
    assert(splash:go(splash.args.url))
    splash:runjs(splash.args.js_source)
    splash:wait_for_resume(splash.args.slybot_actions_source)
    splash:set_result_content_type("text/html")
    return splash.html()
end
"""

JS_SOURCE = """
function main(splash) {
    var events = (%s);
    try{
        __slybot__performEvents(events, function(){
            splash.resume();
        });
    }catch(e){
        splash.error(e);
    }
}
"""


def filter_for_url(url):
    def _filter(page_action):
        accept = page_action.get('accept')
        reject = page_action.get('reject')
        if reject and re.search(reject, url):
            return False
        if accept and not re.search(accept, url):
            return False
        return True
    return _filter


class PageActionsMiddleware(object):
    def process_request(self, request, spider):
        splash_options = request.meta.get('splash', None)
        if not splash_options:  # Already processed or JS disabled
            return
        splash_args = splash_options.get('args', {})
        events = spider.page_actions
        url = splash_args['url']
        events = list(filter(filter_for_url(url), events))
        if len(events):
            splash_options['endpoint'] = 'execute'
            splash_args.update({
                "lua_source": LUA_SOURCE,
                "slybot_actions_source": (JS_SOURCE % json.dumps(events)),
            })

__all__ = ['PageActionsMiddleware']
