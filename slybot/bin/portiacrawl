#!/usr/bin/env python
"""Allow to easily run slybot spiders on console. If spider is not given, print a list of available spiders inside the project"""
import os
import subprocess
from optparse import OptionParser

def main():
    parser = OptionParser(description=__doc__,
            usage="%prog <project dir/project zip> [spider] [options]")
    parser.add_option("--settings", help="Give specific settings module (must be on python path)", default='slybot.settings')
    parser.add_option("--logfile", help="Specify log file")
    parser.add_option("-a", help="Add spider arguments", dest="spargs", action="append", default=[], metavar="NAME=VALUE")

    opts, args = parser.parse_args()

    try:
        project_specs = args[0]
        if not os.path.exists(project_specs) or len(args) > 2:
            parser.print_help()
            return
    except IndexError:
        parser.print_help()
        return
    
    
    if opts.settings:
        os.environ["SCRAPY_SETTINGS_MODULE"] = opts.settings

    command_spec = ["scrapy", "crawl", args[1]] if len(args) == 2 else ["scrapy", "list"]
    if project_specs.endswith(".zip"):
        command_spec.extend([
            "-s", "PROJECT_ZIPFILE=%s" % project_specs,
            "-s", "SPIDER_MANAGER_CLASS=slybot.spidermanager.ZipfileSlybotSpiderManager",
        ])
    else:
        command_spec.extend([
            "-s", "PROJECT_DIR=%s" % project_specs,
            "-s", "SPIDER_MANAGER_CLASS=slybot.spidermanager.SlybotSpiderManager",
        ])

    if opts.logfile:
        command_spec.append("--logfile=%s" % opts.logfile)

    for sparg in opts.spargs:
        command_spec.append("-a")
        command_spec.append(sparg)

    subprocess.call(command_spec)

main()
