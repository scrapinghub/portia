_PROJECT_TEMPLATE = """\
{}\
"""


_SETTINGS_TEMPLATE = """\
# Automatically created by: slyd
import os

SPIDER_MANAGER_CLASS = 'slybot.spidermanager.ZipfileSlybotSpiderManager'
EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
ITEM_PIPELINES = ['slybot.dupefilter.DupeFilterPipeline']
SPIDER_MIDDLEWARES = {'slybot.spiderlets.SpiderletsMiddleware': 999}  # as close as possible to spider output
DOWNLOADER_MIDDLEWARES = {
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
    name         = '%s',
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
{
    "default": {"fields": {}}
}
"""


templates = {
    'PROJECT': _PROJECT_TEMPLATE,
    'SETTINGS': _SETTINGS_TEMPLATE,
    'SETUP': _SETUP_PY_TEMPLATE,
    'SCRAPY': _SCRAPY_TEMPLATE,
    'ITEMS': _ITEMS_TEMPLATE
}
