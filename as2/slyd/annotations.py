"""
code for transposition of annotations from the annotated source generated
in the browser to the final template.
"""
import json
from scrapely.htmlpage import parse_html, HtmlPage, HtmlTag, HtmlTagType
from .utils import serialize_tag

TAGID = u"data-tagid"


def _is_generated(htmltag):
    template_attr = htmltag.attributes.get("data-scrapy-annotate")
    if template_attr is None:
        return False
    unescaped = template_attr.replace('&quot;', '"')
    annotation = json.loads(unescaped)
    return annotation.get("generated", False)


def _must_add_tagid(element):

    return isinstance(element, HtmlTag) and \
        element.tag_type != HtmlTagType.CLOSE_TAG and \
        not _is_generated(element)


def add_tagids(source):
    """
    Applies a unique attribute code number for each tag element in order to be
    identified later in the process of apply annotation"""
    output = []
    tagcount = 0
    if not isinstance(source, HtmlPage):
        source = HtmlPage(body=source)
    for element in source.parsed_body:
        if _must_add_tagid(element):
            element.attributes[TAGID] = str(tagcount)
            tagcount += 1
            output.append(serialize_tag(element))
        else:
            output.append(source.body[element.start:element.end])

    return ''.join(output)


def remove_tagids(source):
    """remove from the given page, all tagids previously added by add_tagids()
    """
    output = []
    if not isinstance(source, HtmlPage):
        source = HtmlPage(body=source)
    for element in source.parsed_body:
        if _must_add_tagid(element):
            element.attributes.pop(TAGID, None)
            output.append(serialize_tag(element))
        else:
            output.append(source.body[element.start:element.end])
    return ''.join(output)


def _get_data_id(annotation):
    """gets id (a str) of an annotation"""

    if isinstance(annotation, HtmlTag):
        return annotation.attributes[TAGID]
    else:  # partial annotation
        for p in annotation:
            if (isinstance(p, HtmlTag) and "insert-after" in p.attributes):
                return p.attributes["insert-after"]


def _get_closing_tags(annotation):
    """get closing tabs of an extracted partial annotation"""
    if isinstance(annotation, list):
        for p in annotation:
            if (isinstance(p, HtmlTag) and "closing-tags" in p.attributes):
                return p.attributes["closing-tags"]


def _extract_annotations(source):
    """
    Extracts the raw annotations in a way they can be applied
    unambigously to the target non annotated source
    """
    if not isinstance(source, HtmlPage):
        source = HtmlPage(body=source)

    annotations = []
    otherdata = []
    last_id = -1
    last_annotation_id = -1
    cache = []
    inside_insert = False
    insert_end = False
    closing_tags = 0
    for element in source.parsed_body:
        if isinstance(element, HtmlTag):

            if inside_insert:
                if element.tag == "ins":  # closing ins
                    annotations[-1].append(element)
                    insert_end = True
                    continue
                elif insert_end:
                    inside_insert = False  # end of insert group
                else:
                    annotations[-1].append(element)

            else:
                if TAGID in element.attributes:
                    last_id = element.attributes[TAGID]
                    cache = []
                for key in element.attributes:
                    if key == "data-scrapy-annotate":
                        # inserted tag (partial annotation)
                        if not TAGID in element.attributes:

                            if last_id == last_annotation_id and \
                                    isinstance(annotations[-1], list):
                                insertion = annotations[-1]
                                insertion.extend(cache)
                                cache = []
                            else:
                                insertion = []
                                annotations.append(insertion)
                                element.attributes["closing-tags"] = \
                                    closing_tags
                            element.attributes["insert-after"] = last_id
                            if cache and not isinstance(cache[-1], HtmlTag):
                                insertion.append(cache[-1])
                                cache = []
                            insertion.append(element)
                            inside_insert = True
                            insert_end = False
                        else:  # normal annotation
                            annotations.append(element)
                        last_annotation_id = last_id
                        break
                else:
                    for key in element.attributes:
                        if key.startswith("data-scrapy-"):
                            otherdata.append(element)

            # count number of close tags after a numerated one
            if element.tag_type == HtmlTagType.CLOSE_TAG and not inside_insert:
                closing_tags += 1
                cache.append(element)
            else:
                cache = []
                closing_tags = 0

        else:  # an HtmlDataFragment
            if inside_insert:
                annotations[-1].append(element)
                if insert_end:
                    inside_insert = False
            else:
                cache.append(element)

    return sorted(otherdata + annotations, key=lambda x: int(_get_data_id(x)))


def _get_cleansing(target_html, annotations):
    """
    Gets relevant pieces of text affected by browser cleansing.
    """

    numbered_html = add_tagids(target_html)
    target = HtmlPage(body=numbered_html)
    element = target.parsed_body[0]

    all_cleansing = {}
    for annotation in annotations:
        if isinstance(annotation, list):  # partial annotation

            # search insert point we are interested on
            target_it = iter(target.parsed_body)
            for p in annotation:
                if isinstance(p, HtmlTag) and "insert-after" in p.attributes:
                    insert_after = p.attributes["insert-after"]
                    break
            while not (isinstance(element, HtmlTag) and
                       element.attributes.get(TAGID) == insert_after):
                element = target_it.next()

            # 1. browser removes tags inside <option>...</option>
            # 2. browser adds </option> if it is not present
            if element.tag == "option" and \
                    element.tag_type == HtmlTagType.OPEN_TAG:
                cached = []
                add_cached = False
                closed_option = False
                element = target_it.next()
                while not (isinstance(element, HtmlTag) and
                           element.tag in ["option", "select"]):
                    cached.append(element)
                    if hasattr(element, 'tag'):
                        add_cached = True
                    element = target_it.next()

                if (element.tag == "option" and
                    element.tag_type == HtmlTagType.OPEN_TAG) or \
                        (element.tag == "select" and
                         element.tag_type == HtmlTagType.CLOSE_TAG):
                    closed_option = True

                if add_cached or closed_option:
                    out = "".join([numbered_html[e.start:e.end]
                                  for e in cached])
                    all_cleansing[insert_after] = out

    return all_cleansing


def _order_is_valid(parsed):
    """Checks if tag ordering is valid, so to help merge_code
    to select correct alternative among the generated ones
    """
    tag_stack = []
    for e in parsed:
        if isinstance(e, HtmlTag):
            if e.tag_type == HtmlTagType.OPEN_TAG:
                tag_stack.append(e.tag)
            elif e.tag_type == HtmlTagType.CLOSE_TAG:
                if tag_stack and tag_stack[-1] == e.tag:
                    tag_stack.pop()
                else:
                    return False
    return True


def _merge_code(code1, code2):
    """merges two pieces of html code by text content alignment."""
    parsed1 = list(parse_html(code1))
    parsed2 = list(parse_html(code2))

    insert_points1 = []
    tags1 = []
    p = 0
    text1 = ""
    for e in parsed1:
        if isinstance(e, HtmlTag):
            insert_points1.append(p)
            tags1.append(e)
        else:
            p += e.end - e.start
            text1 += code1[e.start:e.end]

    insert_points2 = []
    tags2 = []
    p = 0
    text2 = ""
    for e in parsed2:
        if isinstance(e, HtmlTag):
            insert_points2.append(p)
            tags2.append(e)
        else:
            p += e.end - e.start
            text2 += code2[e.start:e.end]

    assert(text1.startswith(text2) or text2.startswith(text1))

    # unique sorted list of insert points
    _insert_points = sorted(insert_points1 + insert_points2)
    insert_points = []
    for i in _insert_points:
        if not i in insert_points:
            insert_points.append(i)

    possible_outs = [""]
    start = 0
    # insert tags in correct order, calculate all alternatives when
    # when order is ambiguous
    for end in insert_points:
        possible_outs = [out + text1[start:end] for out in possible_outs]
        dup_possible_outs = [out for out in possible_outs]
        if end in insert_points1:
            tag1 = tags1.pop(0)
            possible_outs = [out + code1[tag1.start:tag1.end]
                             for out in possible_outs]
        if end in insert_points2:
            tag2 = tags2.pop(0)
            possible_outs = [out + code2[tag2.start:tag2.end]
                             for out in possible_outs]
            if end in insert_points1:
                dup_possible_outs = [out + code2[tag2.start:tag2.end]
                                     for out in dup_possible_outs]
                dup_possible_outs = [out + code1[tag1.start:tag1.end]
                                     for out in dup_possible_outs]
                possible_outs += dup_possible_outs
        start = end

    # choose the first valid
    for out in possible_outs:
        parsed_out = list(parse_html(out))
        if _order_is_valid(parsed_out):
            break

    if text1.startswith(text2):
        out += text1[len(text2):]
    else:
        out += text2[len(text1):]

    tag_count1 = sum(1 for i in parsed1 if isinstance(i, HtmlTag))
    tag_count_final = sum(1 for i in parsed_out if isinstance(i, HtmlTag))

    return out, tag_count_final - tag_count1


def apply_annotations(source_html, target_html):
    """
    Applies annotations present in source_html, into
    raw target_html. source_html must be taggered source,
    target_html is the original raw (no tags, no annotations)
    source.
    """
    annotations = _extract_annotations(source_html)
    target_page = HtmlPage(body=target_html)
    cleansing = _get_cleansing(target_page, annotations)

    numbered_html = add_tagids(target_page)
    target = parse_html(numbered_html)
    output = []

    element = target.next()
    eof = False
    while not (isinstance(element, HtmlTag) and TAGID in element.attributes):
        output.append(numbered_html[element.start:element.end])
        element = target.next()
    last_id = element.attributes[TAGID]
    for i in range(len(annotations)):

        annotation = annotations[i]
        # look up replacement/insertion point
        aid = _get_data_id(annotation)
        # move target until replacement/insertion point
        while int(last_id) < int(aid):
            output.append(numbered_html[element.start:element.end])
            element = target.next()
            while not (isinstance(element, HtmlTag) and
                       TAGID in element.attributes):
                output.append(numbered_html[element.start:element.end])
                element = target.next()
            last_id = element.attributes[TAGID]

        # replace/insert in target
        if isinstance(annotation, HtmlTag):
            for key, val in annotation.attributes.items():
                if key.startswith("data-scrapy-"):
                    element.attributes[key] = val
            output.append(serialize_tag(element))
            if not (i + 1 < len(annotations) and
                    _get_data_id(annotations[i + 1]) == aid):
                element = target.next()

        else:  # partial annotation
            closing_tags = _get_closing_tags(annotation)
            if not (i > 0 and _get_data_id(annotations[i - 1]) == aid):
                output.append(numbered_html[element.start:element.end])
                while closing_tags > 0:
                    element = target.next()
                    output.append(numbered_html[element.start:element.end])
                    if isinstance(element, HtmlTag) and \
                            element.tag_type == HtmlTagType.CLOSE_TAG:
                        closing_tags -= 1

            elif (i > 0 and isinstance(annotations[i - 1], HtmlTag) and
                    annotation[0].start > annotations[i - 1].end):
                element = target.next()
                while closing_tags > 0:
                    output.append(numbered_html[element.start:element.end])
                    element = target.next()
                    if isinstance(element, HtmlTag) and \
                            element.tag_type == HtmlTagType.CLOSE_TAG:
                        closing_tags -= 1

                output.append(numbered_html[element.start:element.end])

            num_tags_inside = 0
            partial_output = ""

            # computes number of tags inside a partial annotation
            for p in annotation:
                partial_output += source_html[p.start:p.end]
                if isinstance(p, HtmlTag):
                    num_tags_inside += 1
                    if "insert-after" in p.attributes:
                        num_tags_inside -= 2

            if aid in cleansing:
                partial_output, fix_tag_count = _merge_code(
                    partial_output, cleansing[aid])
                num_tags_inside += fix_tag_count

            output.append(partial_output)

            element = target.next()  # consume reference tag

            # consume the tags inside partial annotation
            while num_tags_inside > 0:
                if isinstance(element, HtmlTag):
                    num_tags_inside -= 1
                element = target.next()

            if not isinstance(element, HtmlTag):
                element = target.next()

        if not (i + 1 < len(annotations) and
                _get_data_id(annotations[i + 1]) == aid):
            try:
                while not (isinstance(element, HtmlTag) and
                           TAGID in element.attributes):
                    output.append(numbered_html[element.start:element.end])
                    element = target.next()
            except StopIteration:
                eof = True
            else:
                last_id = element.attributes[TAGID]

    if not eof:
        output.append(numbered_html[element.start:element.end])
    for element in target:
        output.append(numbered_html[element.start:element.end])

    return remove_tagids(''.join(output))