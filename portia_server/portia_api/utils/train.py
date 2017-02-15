import os
import json
from scrapy import log
from storage.projecttemplates import MERCHANT_SETTING_BASE

SCRAPELY_TEMPLATES_DIR = '/var/kipp/scrapely_templates'
KIPP_MERCHANT_SETTINGS_DIR = '/apps/kipp/kipp/kipp_base/kipp_settings/{country_code}'
if not os.path.exists(SCRAPELY_TEMPLATES_DIR):
    os.makedirs(SCRAPELY_TEMPLATES_DIR)

def train_scrapely(storage, model):
    """
    Train scrapely function
    :param storage:
    :param model:
    :return:
    """
    samples = load_samples(storage, model)
    scrapely_templates = generate_scrapely_templates(samples)
    save_scrapely_object(model.id, scrapely_templates)
    try:
        create_kipp_setting(model)
    except Exception as e:
        print 'Error in creating ' + e.message
    return scrapely_templates

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

def save_scrapely_object(spider_name, scrapely_templates):
    scrapely_file_name = "%s.json" % spider_name
    scrapely_file_path = os.path.join(SCRAPELY_TEMPLATES_DIR, scrapely_file_name)
    if os.path.exists(scrapely_file_path):
        os.remove(scrapely_file_path)
    with open(scrapely_file_path, "w") as outfile:
        json.dump({"templates": scrapely_templates}, outfile)
    log.msg('Scraper instance is saved at %s' % SCRAPELY_TEMPLATES_DIR)


def create_kipp_setting(spider):
    """
    preprocess spider specs and call _create_setting_file function
    :param merchant_name:
    :param country:
    :param spider_spec:
    :return:
    """
    # setting_dict = {}
    # settings_dict.get('merchant_name', spider.id)
    merchant_name = spider.id
    country_code = spider.country_code
    kipp_country_setting_dir = KIPP_MERCHANT_SETTINGS_DIR.format(country_code=country_code)
    if not os.path.exists(kipp_country_setting_dir):
        os.makedirs(kipp_country_setting_dir)
    merchant_file_path = kipp_country_setting_dir + '/' + merchant_name + '.py'
    country_code = spider.country_code
    currency_code = spider.currency_code
    start_urls = spider.start_urls[0]['url']
    merchant_url = start_urls
    allow_regex = spider.follow_patterns
    allowed_domains = start_urls.split("//")[-1].split("/")[0].replace("www.", "")
    allowed_domains = [allowed_domains]
    deny_regex = spider.exclude_patterns
    english_url = spider.english_url
    arabic_url = spider.arabic_url
    english_url_args = spider.english_url_args
    arabic_url_args = spider.arabic_url_args
    use_language_config = spider.use_language_config
    use_currency_config = spider.use_currency_config
    english_cookie_name = spider.english_cookie_name
    english_cookie_value = spider.english_cookie_value
    arabic_cookie_name = spider.arabic_cookie_name
    arabic_cookie_value = spider.arabic_cookie_value
    use_language_cookies = spider.use_language_cookies
    use_currency_cookies = spider.use_currency_cookies
    currency_cookie_name = spider.currency_cookie_name
    currency_cookie_value = spider.currency_cookie_value
    local_images = spider.local_images
    render_js = spider.js_enabled
    #return setting_dict

    create_setting_file(merchant_file_path, merchant_name=merchant_name, country_code=country_code,
                              start_urls=start_urls, allowed_domains=allowed_domains, merchant_url=merchant_url,
                              allow_regex=allow_regex, deny_regex=deny_regex, currency_code=currency_code,
                              english_url=english_url, arabic_url=arabic_url, english_url_args=english_url_args,
                              arabic_url_args=arabic_url_args, english_cookie_name=english_cookie_name,
                              english_cookie_value=english_cookie_value, arabic_cookie_name=arabic_cookie_name,
                              arabic_cookie_value=arabic_cookie_value, use_language_cookies=use_language_cookies,
                              use_currency_cookies=use_currency_cookies, currency_cookie_name=currency_cookie_name,
                              currency_cookie_value=currency_cookie_value, local_images=local_images,
                              render_js=render_js)


def create_setting_file(file_path, **kwargs):
    """
    create setting file on the disk
    :param file_path:
    :param args:
    :return:
    """
    if kwargs['english_url']:
        english_url = "\"" + kwargs["english_url"] + "\""
        kwargs['english_url'] = english_url
    else:
        kwargs['english_url'] = None
    if kwargs['arabic_url']:
        english_url = "\"" + kwargs["arabic_url"] + "\""
        kwargs['arabic_url'] = english_url
    else:
        kwargs['arabic_url'] = None
    if kwargs['english_url_args']:
        english_url_args = "\"" + kwargs["english_url_args"] + "\""
        kwargs['english_url_args'] = english_url_args
    else:
        kwargs['english_url_args'] = None
    if kwargs['arabic_url_args']:
        arabic_url_args = "\"" + kwargs["arabic_url_args"] + "\""
        kwargs['arabic_url_args'] = arabic_url_args
    else:
        kwargs['arabic_url_args'] = None

    if kwargs['use_language_cookies']:
        english_language_cookie = """
                {{'name':"{english_cookie_name}", 'value': "{english_cookie_value}",
                'domain': ".{allowed_domains[0]}", 'path': '/'}}
                """.format(**kwargs)
        arabic_language_cookie = """
                {{'name': "{arabic_cookie_name}", 'value': "{arabic_cookie_value}",
                'domain': '.{allowed_domains[0]}', 'path': '/'}}
                """.format(**kwargs)
    else:
        english_language_cookie = None
        arabic_language_cookie = None
    if kwargs['use_currency_cookies']:
        currency_cookie = """
                {{'name':"{currency_cookie_name}", 'value': "{currency_cookie_value}",
                'domain': ".{allowed_domains[0]}", 'path': '/'}}
                """.format(**kwargs)
    else:
        currency_cookie = None

    if kwargs['use_language_cookies'] and kwargs['use_currency_cookies']:
        general_cookie = """
                [{}, {}]
                """.format(english_language_cookie, currency_cookie)
    elif kwargs['use_language_cookies']:
        general_cookie = """
                [{}]
                """.format(english_language_cookie)
        if english_language_cookie:
          english_language_cookie = "[" + english_language_cookie + "]"
        if arabic_language_cookie:
          arabic_language_cookie = "[" + arabic_language_cookie + "]"
    elif kwargs['use_currency_cookies']:
        general_cookie = """
                [{}]
                """.format(currency_cookie)
        currency_cookie = [currency_cookie]
    else:
        general_cookie = None

    kwargs.setdefault('general_cookie', general_cookie)
    kwargs.setdefault('english_language_cookie', english_language_cookie)
    kwargs.setdefault('arabic_language_cookie', arabic_language_cookie)
    kwargs.setdefault('currency_cookie', currency_cookie)

    merchant_setting = MERCHANT_SETTING_BASE.format(**kwargs)

    with open(file_path, 'w') as f:
        f.write(merchant_setting)
