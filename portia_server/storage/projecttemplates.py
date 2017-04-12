_PROJECT_TEMPLATE = """\
{}\
"""


_SETTINGS_TEMPLATE = """\
# Automatically created by: slyd
import os

SPIDER_MANAGER_CLASS = 'slybot.spidermanager.ZipfileSlybotSpiderManager'
EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
ITEM_PIPELINES = {'slybot.dupefilter.DupeFilterPipeline': 1}
SPIDER_MIDDLEWARES = {'slybot.spiderlets.SpiderletsMiddleware': 999}  # as close as possible to spider output
DOWNLOADER_MIDDLEWARES = {
    'slybot.pageactions.PageActionsMiddleware': 700,
    'slybot.splash.SlybotJsMiddleware': 725
}
PLUGINS = [
    'slybot.plugins.scrapely_annotations.Annotations',
    'slybot.plugins.selectors.Selectors'
]
SLYDUPEFILTER_ENABLED = True
DUPEFILTER_CLASS = 'scrapyjs.SplashAwareDupeFilter'

PROJECT_ZIPFILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

try:
    from local_slybot_settings import *
except ImportError:
    pass
"""


_SETUP_PY_TEMPLATE = """\
# Automatically created by: slyd

from setuptools import setup, find_packages

setup(
    name         = '%(name)s',
    version      = '1.0',
    packages     = find_packages(),
    package_data = {
        'spiders': ['*.json', '*/*.json']
    },
    data_files = [('', ['project.json', 'items.json', 'extractors.json'])],
    entry_points = {'scrapy': ['settings = spiders.settings']},
    zip_safe = True
)

"""


_SCRAPY_TEMPLATE = """\
# Automatically created by: slyd

[settings]
default = slybot.settings
"""

_ITEMS_TEMPLATE = """\
{}
"""

_EXTRACTORS_TEMPLATE = """\
{}
"""


templates = {
    'PROJECT': _PROJECT_TEMPLATE,
    'SETTINGS': _SETTINGS_TEMPLATE,
    'SETUP': _SETUP_PY_TEMPLATE,
    'SCRAPY': _SCRAPY_TEMPLATE,
    'ITEMS': _ITEMS_TEMPLATE,
    'EXTRACTORS': _EXTRACTORS_TEMPLATE
}

MERCHANT_SETTING_BASE = """
from os.path import basename

USE_PORTIA = True

if not USE_PORTIA:
    exec('from %s_scrapy import *' % basename(__file__).split('.')[0])
else:
    # Automatically created by: slyd
    # -*- coding: utf-8 -*-

    from scrapy.contrib.spiders import Rule
    from scrapy.linkextractors.lxmlhtml import LxmlLinkExtractor

    LOG_FILE = '/var/kipp/logs/{merchant_name}.log'
    COUNTRY_CODE = "{country_code}"
    CURRENCY_CODE = "{currency_code}"
    USE_SCRAPELY = True
    START_URLS = {start_urls}
    ALLOWED_DOMAINS = {allowed_domains}
    MERCHANT_URLS_CONFIG = [{{"url": "{merchant_url}", 'cookie_config': {general_cookie} }}]
    RULES = [Rule(LxmlLinkExtractor(allow={allow_regex},
                                    deny={deny_regex}),
                  callback='parse_item', follow=True)]
    LOCAL_IMAGES = {local_images}
    RENDER_JS = {render_js}
    localization_config = {localization_template}

"""
