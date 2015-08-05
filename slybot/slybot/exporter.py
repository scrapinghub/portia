from scrapy.exporters import CsvItemExporter
from scrapy.conf import settings


class SlybotCSVItemExporter(CsvItemExporter):
    def __init__(self, *args, **kwargs):
        kwargs['fields_to_export'] = settings.getlist('CSV_EXPORT_FIELDS') or None
        super(SlybotCSVItemExporter, self).__init__(*args, **kwargs)
