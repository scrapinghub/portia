
class Selectors(object):
    def setup_bot(self, settings, spec, items, extractors):
        self.selectors = {} # { item_type: { field_name: {..} }

        for template in spec['templates']:
            selectors = self.selectors.setdefault(template['scrapes'], {})
            selectors.update(template.get('selectors', {}))

    def process_item(self, item, response):
        item_type = item.get('_type', '')
        selectors = self.selectors.get(item_type)
        if not selectors:
            return

        for field, selector_data in selectors.iteritems():
            selector = selector_data['selector']
            selector_type = selector_data['type']
            if selector_type == 'css':
                item[field] = response.css(selector).xpath('./text()').extract()
            elif selector_type == 'xpath':
                item[field] = response.xpath(selector).extract()
            else:
                msg = 'Selector type not implemented: {}'.format(selector_type)
                raise Exception(msg)

__all__ = [Selectors]

