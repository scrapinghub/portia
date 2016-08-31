import mock

from slyd.utils.storage import ContentFile


def mock_storage(files):
    def exists(name):
        return name in files

    def open_(name, *args, **kwargs):
        try:
            data = files[name]
        except KeyError:
            raise IOError(2, 'No file or directory', name)
        return ContentFile(data, name)

    def save(name, content):
        files[name] = content.read()

    def delete(name):
        try:
            del files[name]
        except KeyError:
            raise IOError(2, 'No file or directory', name)

    def listdir(path):
        path = path.rstrip('/') + '/'
        dir_set, file_set = set(), set()
        for p in files.keys():
            if not p.startswith(path):
                continue
            parts = p[len(path):].split('/')
            if len(parts) == 1:
                file_set.add(parts[0])
            else:
                dir_set.add(parts[0])
        return sorted(dir_set), sorted(file_set)

    storage = mock.MagicMock()
    storage.files = files
    storage.exists.side_effect = exists
    storage.open.side_effect = open_
    storage.save.side_effect = save
    storage.delete.side_effect = delete
    storage.listdir.side_effect = listdir
    return storage
