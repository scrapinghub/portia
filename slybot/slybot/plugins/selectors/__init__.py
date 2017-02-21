
class Selectors(object):
    def setup_bot(self, settings, spider, spec, items, extractors, logger):
        self.logger = logger
        self.selectors = {} # { template_id: { field_name: {..} }

        for template in spec['templates']:
            template_id = template.get('page_id')
            self.selectors[template_id] = template.get('selectors', {})

    def process_item(self, item, response):
        template_id = item.get('_template', '')
        selectors = self.selectors.get(template_id)
        if not selectors:
            return

        for field, selector_data in selectors.items():
            selector = selector_data['selector']
            selector_type = selector_data['type']

            if selector_type == 'css':
                result = response.css(selector).xpath('./text()').extract()
            elif selector_type == 'xpath':
                result = response.xpath(selector).extract()
            else:
                msg = 'Selector type not implemented: {}'.format(selector_type)
                raise Exception(msg)

            item[field] = ([item[field]] + result) if field in item else result

__all__ = [Selectors]
