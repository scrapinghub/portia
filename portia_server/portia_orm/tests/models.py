from .. import fields
from ..base import Model


class ExampleModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Boolean()


class RequiredFieldModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field(required=True)


class SingleFileModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()

    class Meta:
        path = u'single.json'


class ManyFileModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    owner = fields.BelongsTo('ManyFileModel', related_name='owner',
                             on_delete=fields.CLEAR, ignore_in_file=True)

    class Meta:
        path = u'many.json'
        owner = 'owner'


class ParamFileModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    param = fields.String()

    class Meta:
        path = u'param-{self.param}.json'


class OneToOneModel1(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    m2 = fields.BelongsTo('OneToOneModel2', related_name='m1',
                          on_delete=fields.CLEAR, only='id')

    class Meta:
        path = u'o2o-model-1.json'


class OneToOneModel2(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    m1 = fields.BelongsTo(OneToOneModel1, related_name='m2',
                          on_delete=fields.CLEAR)

    class Meta:
        path = u'o2o-model-2.json'


class ChildModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    parent = fields.BelongsTo('ParentModel', related_name='children',
                              on_delete=fields.CLEAR, only='id')

    class Meta:
        path = u'{self.parent.id}/children.json'
        owner = 'parent'


class ParentModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    children = fields.HasMany(ChildModel, related_name='parent',
                              on_delete=fields.CLEAR)

    class Meta:
        path = u'parents.json'


class ManyToManyModel1(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    m2 = fields.HasMany('ManyToManyModel2', related_name='m1',
                        on_delete=fields.CLEAR, only='id')

    class Meta:
        path = u'm2m-model-1.json'


class ManyToManyModel2(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    m1 = fields.HasMany(ManyToManyModel1, related_name='m2',
                        on_delete=fields.CLEAR)

    class Meta:
        path = u'm2m-model-2.json'
        owner = 'm1'


class PolymorphicParentModel(Model):
    id = fields.String(primary_key=True)
    field = fields.Field()
    children = fields.HasMany('PolymorphicChildBase', related_name='parent',
                              polymorphic=True, on_delete=fields.CASCADE,
                              only='id')

    class Meta:
        path = u'parents.json'


class PolymorphicChildBase(Model):
    id = fields.String(primary_key=True)
    parent = fields.BelongsTo(PolymorphicParentModel, related_name='children',
                              on_delete=fields.CLEAR, only='id')

    class Meta:
        path = u'children.json'
        owner = 'parent'
        polymorphic = True


class PolymorphicChildModel1(PolymorphicChildBase):
    field1 = fields.Field()


class PolymorphicChildModel2(PolymorphicChildBase):
    field2 = fields.Field()

    class Meta:
        polymorphic = '_type_'
