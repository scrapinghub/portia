from slyd.orm.exceptions import ImproperlyConfigured


__all__ = [
    'get_model',
]

models = {}


def get_model(model_name):
    try:
        return models[model_name]
    except KeyError:
        raise ImproperlyConfigured(
            u"No model named '{}' exists".format(model_name))
