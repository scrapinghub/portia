import re
from collections import defaultdict

from portia_orm.models import Project
from portia_orm.utils import short_guid


class MissingModelException(Exception):
    """Error thrown when model for id is not present in project."""


class ModelCopier(object):
    SPIDER_NAME = r'(.*_)([0-9]+)$'

    def __init__(self, project, storage, from_project_id):
        self.project, self.storage = project, storage
        self.from_storage = storage.__class__(from_project_id,
                                              author=storage.author)
        self.from_project = Project(self.from_storage, id=from_project_id,
                                    name=from_project_id)
        # Populating projects to avoid overwrites
        self.project.schemas
        self.project.extractors
        self.from_project.schemas
        self.from_project.extractors
        self.spider_ids = set(spider.id for spider in self.project.spiders)

        self.copied_fields = {}
        self.copied_schemas = {}
        self.copied_extractors = {}

    def copy(self, models):
        grouped = self.group(models)

        for spider in grouped.get('spiders', []):
            copied_spider = self.copy_spider(spider)
            for sample in spider.samples:
                copied_sample = self.copy_sample(sample, copied_spider)

                for item in sample.items:
                    copied_item = self.copy_item(
                        item, self.copy_schema(item.schema), copied_sample)
                    for annotation in item.annotations:
                        copied_ann = self.copy_annotation(
                            annotation, copied_item, annotation.field)
                        copied_ann.extractors = self.copy_extractors(
                            annotation.extractors)
                        copied_ann.save()
        for schema in grouped.get('schemas', []):
            self.copy_schema(schema)
        self.storage.commit()

    def copy_spider(self, spider):
        copied_spider = spider.copy(self._unique_id(spider.id),
                                    storage=self.storage)
        copied_spider.project = self.project
        copied_spider.save()
        return copied_spider

    def copy_sample(self, sample, spider):
        copied_sample = sample.copy(short_guid(), storage=self.storage)

        copied_sample.spider = spider
        copied_sample.original_body = self._copy_body(
            sample.original_body, sample)
        try:
            copied_sample.rendered_body = self._copy_body(
                sample.rendered_body, sample)
        except AttributeError:
            # Ignore missing rendered body.
            # It will be added when the sample is modified
            pass

        copied_sample.save()
        return copied_sample

    def copy_item(self, item, schema, sample):
        copied_item = item.copy(storage=self.storage)
        copied_item.schema = schema
        copied_item.sample = sample

        copied_item.save()
        return copied_item

    def copy_schema(self, schema):
        schema_id = schema.id
        if schema_id in self.copied_schemas:
            return self.copied_schemas[schema_id]

        copied_schema = schema.copy(storage=self.storage)
        copied_schema.project = self.project
        copied_schema.save()

        for field in schema.fields:
            self._copy_field(field, copied_schema)

        self.copied_schemas[schema_id] = copied_schema
        return copied_schema

    def copy_annotation(self, annotation, item, field):
        copied_ann = annotation.copy(
            '{}|{}'.format(short_guid(), short_guid()),
            storage=self.storage)
        copied_ann.field = self.copied_fields[field.id]
        item.annotations.add(copied_ann)

        copied_ann.save()
        return copied_ann

    def copy_extractors(self, extractors):
        copied = []
        for extractor in extractors:
            # TODO: Skip missing extractors in ORM
            try:
                self.from_project.extractors[extractor]
            except KeyError:
                continue
            copied_extractor = self._copy_extractor(extractor)
            copied.append(copied_extractor)
        return copied

    def group(self, models):
        instances = defaultdict(list)
        errors = []
        for model_meta in models:
            _id, model_type = model_meta['id'], model_meta['type']
            collection = getattr(self.from_project, model_type, {})
            try:
                instance = collection[_id]
                instances[model_type].append(instance)
            except (KeyError, TypeError):
                errors.append(_id)
        if errors:
            raise MissingModelException(errors)
        return instances

    def _copy_field(self, field, schema):
        copied_field = field.copy(storage=self.storage)
        copied_field.schema = schema
        copied_field.save()
        self.copied_fields[field.id] = copied_field

    def _copy_extractor(self, extractor):
        extractor_id = extractor.id
        if extractor_id in self.copied_extractors:
            return self.copied_extractors[extractor_id]

        copied_extractor = extractor.copy(short_guid(), storage=self.storage)
        copied_extractor.project = self.project

        copied_extractor.save()
        self.copied_extractors[extractor_id] = copied_extractor
        return copied_extractor

    def _copy_body(self, body, sample):
        body_id = '{}_{}'.format(sample.id, body.Meta.name)
        copied_body = body.copy(body_id, storage=self.storage)
        copied_body.sample = sample

        copied_body.save()
        return copied_body

    def _unique_id(self, spider_id):
        unique_id = spider_id
        while unique_id in self.spider_ids:
            match = re.match(self.SPIDER_NAME, unique_id)
            if match:
                unique_id = match.group(1) + str(int(match.group(2)) + 1)
            else:
                unique_id += '_1'
        return unique_id
