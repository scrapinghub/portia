from collections import defaultdict
from itertools import chain

from portia_orm.models import Project


class MissingModelException(Exception):
    """Error thrown when model for id is not present in project."""


class ModelCopier(object):
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

    def copy(self, models):
        grouped = self.group(models)
        models = self.resolve(grouped)
        self.save(models)

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

    def resolve(self, instances):
        models = []
        for spider in instances.get('spiders', []):
            spider.start_urls
            new_spider = spider.with_storage(self.storage)
            new_spider.project = self.project
            for sample in spider.samples:
                for item in sample.items:
                    schema = item.schema.with_storage(self.storage)
                    schema.fields = item.schema.fields
                    self.project.schemas.add(schema)
                    for annotation in item.annotations:
                        extractors = []
                        for extractor in annotation.extractors:
                            # TODO: Skip missing extractors in ORM
                            try:
                                self.from_project.extractors[extractor]
                            except TypeError:
                                continue
                            extractor = extractor.with_storage(self.storage)
                            self.project.extractors.add(extractor)
                            extractors.append(extractor)
                        # Remove unavailable extractors
                        annotation.extractors = extractors
                sample = sample.with_storage(self.storage)
                sample.spider = new_spider
                models.append(sample)
            models.append(new_spider)
        for schema in instances.get('schemas', []):
            self.project.schemas.add(schema)
        return models

    def save(self, models):
        project = self.project
        for model in chain(project.schemas, project.extractors, models):
            model.save()
        self.storage.commit()
