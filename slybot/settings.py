SPIDER_MANAGER_CLASS = 'slybot.spidermanager.SlybotSpiderManager'
EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
ITEM_PIPELINES = ['slybot.dupefilter.DupeFilterPipeline']
SLYDUPEFILTER_ENABLED = True
PROJECT_DIR = 'slybot-project'

try:
    from local_slybot_settings import *
except ImportError:
    pass
