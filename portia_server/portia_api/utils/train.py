import os
import json

from django.core.exceptions import ValidationError
from scrapy import log
from storage.projecttemplates import MERCHANT_SETTING_BASE
from git import Repo


KIPP_MERCHANT_SETTINGS_DIR = '/apps/{username}/{country_code}/{spider_name}'


def train_scrapely(storage, model, username):
    """
    Train scrapely function
    :param storage:
    :param model:
    :return:
    """
    samples = load_samples(storage, model)
    scrapely_templates = generate_scrapely_templates(samples)
    save_scrapely_object(spider_name=model.id, country_code=model.country_code, username=username, scrapely_templates=scrapely_templates)
    merchant_settings = create_kipp_setting(model)
    save_kipp_config(spider_name=model.id, country_code=model.country_code, username=username, merchant_settings=merchant_settings)
    publish_kipp_settings(username=username, country_code=model.country_code, spider_name=model.id)


def load_samples(storage, model):
    samples = []
    for sample in model.samples:
        json_sample = json.loads(sample.dumps())
        json_sample['original_body'] = sample.original_body.html
        json_sample['rendered_body'] = sample.rendered_body.html
        annotated_template = get_annotated_template(json_sample, model)
        samples.append(annotated_template)
    return samples


def get_annotated_template(template, model):
    if (template.get('version', '0.12.0') >= '0.13.0' and not template.get('annotated')):
        using_js = model.js_enabled
        template['body'] = 'rendered_body' if using_js else 'original_body'
        template = build_sample(template)
    return template


def build_sample(sample, legacy=False):
    from slybot.plugins.scrapely_annotations.builder import Annotations
    data = sample.get('plugins', {}).get('annotations-plugin')
    if data:
        Annotations().save_extraction_data(data, sample, legacy=legacy)
    sample['page_id'] = sample.get('page_id') or sample.get('id') or ""
    sample['annotated'] = True
    return sample


def generate_scrapely_templates(templates):
    """
    Combine all templates in a list and add headers
    :param templates:
    :return: scrapely_templates: a list of all templates for this spider
    """
    scrapely_templates = []
    for template in templates:
        scrapely_template = dict()
        scrapely_template['url'] = template.get('url', '')
        scrapely_template['headers'] = template.get('headers', {})
        scrapely_template['encoding'] = template.get('encoding', 'utf-8')
        scrapely_template['body'] = template.get('annotated_body', '')
        scrapely_template['page_id'] = template.get('page_id', '')
        scrapely_templates.append(scrapely_template.copy())
    return scrapely_templates


def save_scrapely_object(spider_name, country_code, username, scrapely_templates):
    """
    SaSaving spider configuration file for kipp on disk
    :param spider_name:
    :param country_code:
    :param username:
    :param scrapely_templates:
    :return:
    """
    kipp_country_setting_dir = KIPP_MERCHANT_SETTINGS_DIR.format(username=username, country_code=country_code,
                                                                 spider_name=spider_name)
    if not os.path.exists(kipp_country_setting_dir):
        os.makedirs(kipp_country_setting_dir)
    scrapely_file_name = "%s.json" % spider_name
    scrapely_file_path = os.path.join(kipp_country_setting_dir, scrapely_file_name)
    with open(scrapely_file_path, "w") as outfile:
        json.dump({"templates": scrapely_templates}, outfile)
    log.msg('Scrapely Scraper instance is saved at %s' % kipp_country_setting_dir)


def save_kipp_config(spider_name, country_code, username, merchant_settings):
    """
    Saving spider configuration file for kipp on disk
    :param spider_name:
    :param country_code:
    :param username:
    :param merchant_settings:
    :return:
    """
    kipp_country_setting_dir = KIPP_MERCHANT_SETTINGS_DIR.format(username=username,country_code=country_code,
                                                                 spider_name=spider_name)
    if not os.path.exists(kipp_country_setting_dir):
        os.makedirs(kipp_country_setting_dir)
    merchant_file_name = "%s.py" % spider_name
    merchant_file_path = os.path.join(kipp_country_setting_dir, merchant_file_name)
    with open(merchant_file_path, 'w') as f:
        f.write(merchant_settings)
    log.msg('%s kipp configurations is saved at %s'.format(spider_name, kipp_country_setting_dir))


def create_kipp_setting(spider):
    """
    preprocess spider specs and generate kipp settings file
    :param merchant_name:
    :param country:
    :param spider_spec:
    :return:
    """
    setting_dict = {
        'merchant_name': spider.id,
        'country_code': spider.country_code,
        'currency_code': spider.currency_code,
        'allow_regex': spider.follow_patterns,
        'deny_regex': spider.exclude_patterns,
        'local_images': spider.local_images,
        'render_js': spider.js_enabled,
        'english_language_cookie': None,
        'arabic_language_cookie': None,
        'currency_cookie': None,
        'general_cookie': None,
        'english_cookie_name': spider.english_cookie_name,
        'english_cookie_value': spider.english_cookie_value,
        'arabic_cookie_name': spider.arabic_cookie_name,
        'arabic_cookie_value': spider.arabic_cookie_value,
        'currency_cookie_name': spider.currency_cookie_name,
        'currency_cookie_value': spider.currency_cookie_value,
        'use_language_config': spider.use_language_config,
        'use_currency_config': spider.use_currency_config,
    }

    try:
        start_urls = spider.start_urls[0]['url']
        allowed_domains = [start_urls.split("//")[-1].split("/")[0].replace("www.", "")]
    except IndexError:
        raise ValidationError(message="start url is missing or not valid")

    setting_dict['start_urls'] = [start_urls]
    setting_dict['merchant_url'] = start_urls
    setting_dict['allowed_domains'] = allowed_domains

    setting_dict['english_url'] = "\"%s\"" % spider.english_url if spider.english_url else None
    setting_dict['arabic_url'] = "\"%s\"" % spider.arabic_url if spider.arabic_url else None
    setting_dict['english_url_args'] = "\"%s\"" % spider.english_url_args if spider.english_url_args else None
    setting_dict['arabic_url_args'] = "\"%s\"" % spider.arabic_url_args if spider.arabic_url_args else None

    if spider.use_language_cookies:
        setting_dict['english_language_cookie'] = """
                    {{'name':"{english_cookie_name}", 'value': "{english_cookie_value}",
                    'domain': ".{allowed_domains[0]}", 'path': '/'}}
                    """.format(**setting_dict)
        setting_dict['arabic_language_cookie'] = """
                    {{'name': "{arabic_cookie_name}", 'value': "{arabic_cookie_value}",
                    'domain': '.{allowed_domains[0]}', 'path': '/'}}
                    """.format(**setting_dict)

    if spider.use_currency_cookies:
        setting_dict['currency_cookie'] = """
                    {{'name':"{currency_cookie_name}", 'value': "{currency_cookie_value}",
                    'domain': ".{allowed_domains[0]}", 'path': '/'}}
                    """.format(**setting_dict)

    if spider.use_language_cookies and spider.use_currency_cookies:
        setting_dict['general_cookie'] = """
                    [{}, {}]
                    """.format(setting_dict['english_language_cookie'], setting_dict['currency_cookie'])
    elif spider.use_language_cookies:
        setting_dict['general_cookie'] = """
                    [{}]
                    """.format(setting_dict['english_language_cookie'])

        if setting_dict['english_language_cookie']:
          setting_dict['english_language_cookie'] = "[%s]" % setting_dict['english_language_cookie']

        if setting_dict['arabic_language_cookie']:
          setting_dict['arabic_language_cookie'] = "[%s]" % setting_dict['arabic_language_cookie']

    elif setting_dict['currency_cookie']:
        setting_dict['general_cookie'] = """
                    [{}]
                    """.format(setting_dict['currency_cookie'])
        setting_dict['currency_cookie'] = [setting_dict['currency_cookie']]

    merchant_setting = MERCHANT_SETTING_BASE.format(**setting_dict)
    return merchant_setting


def publish_kipp_settings(username, country_code, spider_name):
    """
    Commit and push configuration files
    :param username:
    :param country_code:
    :param spider_name:
    :return:
    """

    kipp_country_setting_dir = KIPP_MERCHANT_SETTINGS_DIR.format(username=username,
                                                                 country_code=country_code,
                                                                 spider_name=spider_name)
    kipp_config_file_path = kipp_country_setting_dir + '/%s.py' % spider_name
    scrapely_config_file_path = kipp_country_setting_dir + '/%s.json' % spider_name
    if os.path.exists(kipp_config_file_path) and os.path.exists(scrapely_config_file_path):
        #TODO: try and catch exceptions
        repo = Repo('/app/%s' % username)
        index = repo.index
        index.add([kipp_config_file_path, scrapely_config_file_path])
        commit_msg = '%s: Update %s[%s]spider configurations' % username, spider_name, country_code
        index.commit(commit_msg)
        origins = repo.remotes
        #TODO: Handling git username and password
        origins[0].push()
