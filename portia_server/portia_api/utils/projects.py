def unique_name(base_name, disallow=(), initial_suffix=''):
    disallow = set(disallow)
    suffix = initial_suffix
    while True:
        name = u'{}{}'.format(base_name, suffix)
        if name not in disallow:
            break
        try:
            suffix += 1
        except TypeError:
            suffix = 1
    return name
