from .text import TextFieldTypeProcessor
from scrapely.extractors import contains_any_numbers
from dateparser.date import DateDataParser


class DateTimeFieldTypeProcessor(TextFieldTypeProcessor):

    name = 'date'
    description = 'Extracts date and time information from a string'

    def extract(self, htmlregion):
        if contains_any_numbers(htmlregion.text_content):
            return super(DateTimeFieldTypeProcessor, self).extract(htmlregion)

    def adapt(self, text, htmlpage):
        try:
            return DateDataParser().get_date_data(text)['date_obj']
        except ValueError:
            return
