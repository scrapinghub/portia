# -*- coding: utf-8 -*-
import unittest

from scrapely.htmlpage import HtmlPage, HtmlTag
from slyd.utils import add_tagids, TAGID
from slyd.plugins.scrapely_annotations import Annotations


# Test page extracted from:
# https://wanqu.co/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html
TEST_PAGE=ur"""
<!DOCTYPE html>
<html xmlns:og="http://opengraphprotocol.org/schema/" xmlns:fb="http://www.facebook.com/2008/fbml" xmlns:wb="http://open.weibo.com/wb" lang="en"><!--

 _       __
| |     / /___ _____  ____ ___  __
| | /| / / __ `/ __ \/ __ `/ / / /
| |/ |/ / /_/ / / / / /_/ / /_/ /
|__/|__/\__,_/_/ /_/\__, /\__,_/
                      /_/

By makers, for makers. Since 2014.

告诉你一个秘密哦，我一共丢过13辆自行车！

~ W

Oct. 10, 2015 @ San Francisco
--><head>
<meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta charset="utf-8">

    <meta http-equiv="X-UA-Compatible" content="IE=Edge">
    <meta name="HandheldFriendly" content="True">
    <meta name="MobileOptimized" content="320">
    <meta http-equiv="cleartype" content="on">

    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
    <meta name="description" content="很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。">
    <meta name="keywords" content="湾区日报,立足美国湾区,关注互联网,创业,以及技术,每天精选5篇优质英文文章,每天进步一点点,每天推送5篇优质英文文章到 iOS 与 Apple Watch, by makers for makers">

    <meta name="apple-mobile-web-app-title" content="湾区日报">
    <meta name="apple-mobile-web-app-capable" content="yes">

    <meta name="robots" content="NOYDIR,NOODP">

    <meta property="al:ios:url" content="wanqu://posts/2548">
    <meta property="al:ios:app_store_id" content="995762924">
    <meta property="al:ios:app_name" content="Wanqu">

    <meta name="twitter:card" content="summary">
    <meta name="twitter:site" content="@wanquribao">
    <meta name="twitter:app:name:iphone" content="Wanqu">
    <meta name="twitter:app:id:iphone" content="995762924">
    <meta name="twitter:app:name:ipad" content="Wanqu">
    <meta name="twitter:app:id:ipad" content="995762924">

    <meta name="twitter:title" content="放弃向风投融资，自力更生的盈利之路 | 湾区日报">
    <meta name="twitter:description" content="很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。">
    <meta name="twitter:creator" content="@wanquribao">
    <meta name="twitter:domain" content="wanqu.co">

    <meta property="og:type" content="article">
    <meta property="og:title" content="放弃向风投融资，自力更生的盈利之路 | 湾区日报">
    <meta property="og:url" content="https://wanqu.co/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html">
    <meta property="og:site_name" content="湾区日报">


    <meta name="weibo:article:title" content="放弃向风投融资，自力更生的盈利之路 | 湾区日报">
    <meta name="weibo:article:url" content="https://wanqu.co/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html">
    <meta name="weibo:article:description" content="很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。">
    <meta name="weibo:article:create_at" content="2016-01-06 0:01:12">
    <meta name="weibo:article:update_at" content="2016-01-06 0:01:12">




    <meta property="og:description" content="很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。">

    <meta name="google-site-verification" content="Y-rL8n4thby2ld-BKtZXbtxMsm1Cpu5kWICUBK3J-dQ">
    <meta name="google-site-verification" content="XmPYzCXub6K7fMjKmkXwzk3FeWXn-LAVd5FstclCKkU">
    <meta name="google-site-verification" content="qUoO_n-mqTemQFQFfsfnaiRqFisF6SU-anUbXKcsb_g">

    <!-- <meta name="apple-itunes-app" content="app-id=995762924, affiliate-data=1010l6Sv"> -->

    <title>
        放弃向风投融资，自力更生的盈利之路 | 湾区日报
    </title>

    <link rel="apple-touch-icon" sizes="57x57" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="https://wanqu.co/static/images/wanqu/favicons/apple-touch-icon-180x180.png">
    <link rel="icon" type="image/png" href="https://wanqu.co/static/images/wanqu/favicons/favicon-32x32.png" sizes="32x32">
    <link rel="icon" type="image/png" href="https://wanqu.co/static/images/wanqu/favicons/android-chrome-192x192.png" sizes="192x192">
    <link rel="icon" type="image/png" href="https://wanqu.co/static/images/wanqu/favicons/favicon-96x96.png" sizes="96x96">
    <link rel="icon" type="image/png" href="https://wanqu.co/static/images/wanqu/favicons/favicon-16x16.png" sizes="16x16">
    <link rel="manifest" href="https://wanqu.co/static/images/wanqu/favicons/manifest.json">
    <meta name="msapplication-TileColor" content="#da532c">
    <meta name="msapplication-TileImage" content="/static/images/wanqu/favicons/mstile-144x144.png">
    <meta name="theme-color" content="#ffffff">

    <link rel="stylesheet" href="Wanqu_files/bootstrap.css">
    <link rel="stylesheet" href="Wanqu_files/font-awesome.css">
    <link rel="stylesheet" href="Wanqu_files/main-fonts.css">
    <link rel="stylesheet" href="Wanqu_files/animate.css">
    <link rel="stylesheet" href="Wanqu_files/main.css">


<script src="Wanqu_files/analytics.js" async=""></script><script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "TechArticle",
  "headline": "放弃向风投融资，自力更生的盈利之路",
  "image": [""],
  "datePublished": "2016-01-06T13:26:28.063208+08:00",
  "description": "很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。"
}
</script>


    <script type="text/javascript">
        (function(document,navigator,standalone) {
            // prevents links from apps from opening in mobile safari
            // this javascript must be the first script in your <head>
            if ((standalone in navigator) && navigator[standalone]) {
                var curnode, location=document.location, stop=/^(a|html)$/i;
                document.addEventListener('click', function(e) {
                    curnode=e.target;
                    while (!(stop).test(curnode.nodeName)) {
                        curnode=curnode.parentNode;
                    }
                    // Condidions to do this only on links to your own app
                    // if you want all links, use if('href' in curnode) instead.
                    if(
                            'href' in curnode && // is a link
                            (chref=curnode.href).replace(location.href,'').indexOf('#') && // is not an anchor
                            (	!(/^[a-z\+\.\-]+:/i).test(chref) ||                       // either does not have a proper scheme (relative links)
                            chref.indexOf(location.protocol+'//'+location.host)===0 ) // or is in the same protocol and domain
                    ) {
                        e.preventDefault();
                        location.href = curnode.href;
                    }
                },false);
            }
        })(document,window.navigator,'standalone');

    </script>
    <script>

        var cacheBuster = '4ab360d';
        var WANQU_POST_ID = -1;
    </script>
<script src="Wanqu_files/embed.js" async="" type="text/javascript"></script><script src="Wanqu_files/generic.js" data-requiremodule="generic" data-requirecontext="_" async="" charset="utf-8" type="text/javascript"></script><style type="text/css">:root .adsbygoogle
{display:none !important;}</style><link href="Wanqu_files/loading.css" rel="stylesheet"><script src="Wanqu_files/jquery.js" data-requiremodule="jquery" data-requirecontext="_" async="" charset="utf-8" type="text/javascript"></script><script charset="UTF-8" async="" src="Wanqu_files/alfie.js"></script></head>

<body>
<nav class="navbar navbar-default nav-links navbar-fixed-top">
    <div class="container">
        <a class="mini-navbar navbar-brand" href="https://wanqu.co/" title="返回首页" onclick="ga('send', 'event', 'Nav', 'Nav Home');">
            湾区日报
        </a>
        <ul class="nav navbar-nav nav-style">
            <li class="" onclick="ga('send', 'event', 'Nav', 'Nav All');">
                <a href="https://wanqu.co/issues" title="查看往期湾区日报">往期</a></li>
            <li class="" onclick="ga('send', 'event', 'Nav', 'Nav Blog');">
                <a href="https://wanqu.co/blog" title="了解湾区日报背后的故事">博客</a>
            </li>
            <li class="" onclick="ga('send', 'event', 'Nav', 'About');">
                <a title="关于湾区日报" href="https://wanqu.co/about">关于</a>
            </li>
            <li onclick="ga('send', 'event', 'Nav', 'App Download');">
                <a title="在App Store下载。免翻墙，畅读高质量文章" href="https://itunes.apple.com/app/apple-store/id995762924?ct=web&amp;tduid=1010l6Sv&amp;partnerId=2003&amp;pt=1302761&amp;mt=8" class="app-download-button">下载App</a>
            </li>
        </ul>
    </div>
</nav>


<div class="container all-content">




<div class="row">
    <div class="col-lg-10 col-lg-offset-1">
        <div class="row">
    <div class="col-lg-12">

        <div class="promo text-center">

            <p>
                每天推送5篇优质英文文章 · <a href="https://wanqu.co/about?s=promo" title="湾区日报的故事" onclick="ga('send', 'event', 'Promo', 'Promo About');">By makers, for makers</a>
            </p>
            <form class="" action="/search/" method="post">
                <div class="input-group col-sm-8 col-sm-offset-2">
                    <input class="form-control input-sm" name="search-term-input" id="search-term-input" placeholder="请输入搜索关键词" type="search">
                    <span class="input-group-btn">

                    <button type="submit" class="btn btn-primary  btn-sm" id="search-button">搜索一下</button>

                        </span>
                </div>
            </form>
            <p class="small-promo-text" style="margin-top:10px;">
                <a href="https://wanqu.co/collections" title="查看所有精选合集" style="text-decoration: none" onclick="ga('send', 'event', 'Promo', 'view all collections');">
                    <i class="fa fa-list"></i>
                </a>
                <a href="https://wanqu.co/collections/failure" title="精选文章合集" onclick="ga('send', 'event', 'Promo', 'failure');">创业失败经验总结</a>
                ·
                <a href="https://wanqu.co/collections/migration" title="精选文章合集" onclick="ga('send', 'event', 'Promo', 'migration');">边开飞机边换引擎</a>
                ·
                <a href="https://wanqu.co/collections/story" title="精选文章合集" onclick="ga('send', 'event', 'Promo', 'story');">创业故事</a>
            </p>
            <p class="small-promo-text" style="">

                最新博文：<a href="https://wanqu.co/blog/2016-01-06-ios-changelog.html" title="挑了几个我比较喜欢的主题，把文章归类起来，方便对比阅读。">湾区日报 for iOS 的精选文章合集页面</a>

            </p>
        </div>
    </div>
</div>
        <div class="panel panel-primary">
            <!-- Default panel contents -->
            <div class="panel-heading more-link ">
                <p>
                    <span class="lead">放弃向风投融资，自力更生的盈利之路</span>
                </p>
                <p>
                    <a href="https://wanqu.co/p/2548" rel="alternate" onclick="ga('send', 'event', 'Post Bookmark', 'Post 放弃向风投融资，自力更生的盈利之路');"><i class="fa fa-bookmark"></i></a>
                    2016/01/06

                    <a href="https://wanqu.co/issues/451?s=post" class="" title="第451期" onclick="ga('send', 'event', 'Post Issue', 'Issue 451');">第451期</a> ·

                    <a href="https://wanqu.co/random?s=/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html" title="碰碰运气，刷出好文章" onclick="ga('send', 'event', 'Random', 'Post');">
                        刷出好文章
                    </a>
                </p>
            </div>
            <div class="panel-body">
                <script async="" src="Wanqu_files/adsbygoogle.js"></script>
                <!-- wanqu-wp-home -->
                <ins class="adsbygoogle" style="display: none ! important;" data-ad-client="ca-pub-7956536622149324" data-ad-slot="2242204994" data-ad-format="auto"></ins>
                <script>
                    (adsbygoogle = window.adsbygoogle || []).push({});
                </script><br>

                <div class="row">
                    <div class="col-lg-12">
                        <div class="pull-left">
                        <a href="http://skift.com/2016/01/02/how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits/" class="btn btn-primary animated pulse" rel="external" onclick="ga('send', 'event', 'Post URL', 'Post URL 放弃向风投融资，自力更生的盈利之路');"><i class="fa fa-link"></i> 原链接 skift.com</a>
                            </div>
                    </div>
                </div>
                <br>


                <div class="lead">

                    <p>很脚踏实地的文章，强烈推荐。Skift 这家公司在过去18个月，慢速发展，掌握自己的节奏，不加班，一切从简，学会像一切噪音说no，真心对待员工与客户。</p>
<br><p>"We have, at every step, communicated our underdog story to our
users, showing our scrappy, authentic opinionated self, showing all of
our warts, and the users have embraced it — including being generous
about our mistakes — they have been part of our story."</p>
                </div>
                <div class="row">
                    <div class="col-lg-12">

                        英文好书推荐：
                        <ul>

                            <li><a href="http://www.amazon.com/Founders-Work-Stories-Startups-Early/dp/1430210788/ref=sr_1_1?ie=UTF8&amp;sr=1-1&amp;s=books&amp;keywords=founders%2Bat%2Bwork&amp;tag=wanquribao-20&amp;qid=1439627743" title="Founders at Work: Stories of Startups' Early Days" onclick="ga('send', 'event', 'Book', 'Amazon');">采访了Apple、PayPal、Hotmail、Flickr、Craigslist等的创始人的「Founders at Work」</a></li>

                            <li><a href="http://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296/ref=sr_1_1?sr=8-1&amp;ie=UTF8&amp;keywords=zero%2Bto%2Bone&amp;tag=wanquribao-20&amp;qid=1439625140" title="Zero to One: Notes on Startups, or How to Build the Future" onclick="ga('send', 'event', 'Book', 'Amazon');">Peter Thiel 力作 「Zero to One」</a></li>

                            <li><a href="http://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898/?_encoding=UTF8&amp;camp=1789&amp;creative=9325&amp;keywords=The%20Lean%20Startup%3A%20How%20Today%27s%20Entrepreneurs%20Use%20Continuous%20Innovation%20to%20Create%20Radically%20Successful%20Businesses&amp;linkCode=ur2&amp;qid=1426484972&amp;sr=8-1&amp;tag=wanquribao-20&amp;linkId=EAOGNVTLOIJ5II4N" title="The Lean Startup: How Today's Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses" onclick="ga('send', 'event', 'Book', 'Amazon');">「The Lean Startup」，快速迭代地startup哲学</a></li>

                        </ul>
                        <br>

                    </div>
                </div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="pull-left">
                        <small>分享到：</small> <div class="addthis_sharing_toolbox"></div>
                            </div>
                        <div class="pull-right alert alert-link text-muted">
                            <span id="post-views">浏览量：955</span>
                        </div>
                    </div>
                </div>
                <br>
                <div class="row">
                    <div class="col-lg-12">


                        <div class="label label-primary tag-style"><a href="https://wanqu.co/tag/media" title="media" onclick="ga('send', 'event', 'Post Tag', 'Tag media');">
                            <i class="fa fa-tag"></i> media</a></div>

                        <div class="label label-primary tag-style"><a href="https://wanqu.co/tag/startup" title="startup" onclick="ga('send', 'event', 'Post Tag', 'Tag startup');">
                            <i class="fa fa-tag"></i> startup</a></div>

                        <div class="label label-primary tag-style"><a href="https://wanqu.co/tag/story" title="story" onclick="ga('send', 'event', 'Post Tag', 'Tag story');">
                            <i class="fa fa-tag"></i> story</a></div>


                    </div>
                </div>
                <div>
                    <nav>
                        <ul class="pager small">
                            <li class="previous">

                                <a href="https://wanqu.co/2016-01-06-silicon-valleys-startup-severance-package-falls-out-of-favor.html?s=newer-nav" title="Acquihire 的淡季" onclick="ga('send', 'event', 'Post Nav', 'Post Previous');"><span aria-hidden="true">←</span> Acquihire 的淡季</a>

                            </li>
                            <li class="next">

                                <a href="https://wanqu.co/2016-01-06-the-power-of-data-network-effects.html?s=older-nav" title="Data Network Effects" onclick="ga('send', 'event', 'Post Nav', 'Post Next');">Data Network Effects <span aria-hidden="true">→</span></a>

                            </li>

                        </ul>
                    </nav>


                </div>
                <hr>
                <div id="disqus_thread"><iframe verticalscrolling="no" horizontalscrolling="no" src="Wanqu_files/a.html" style="width: 100% ! important; border: medium none ! important; overflow: hidden ! important; height: 570px ! important;" title="Disqus" tabindex="0" scrolling="no" allowtransparency="true" name="dsq-app1" id="dsq-app1" frameborder="0" width="100%"></iframe><iframe style="width: 913px ! important; border: medium none ! important; overflow: hidden ! important; top: 0px ! important; min-width: 913px ! important; max-width: 913px ! important; position: fixed ! important; z-index: 2147483646 ! important; height: 29px ! important; min-height: 29px ! important; max-height: 29px ! important; display: none ! important;" title="Disqus" tabindex="0" scrolling="no" allowtransparency="true" name="indicator-north" id="indicator-north" frameborder="0"></iframe><iframe style="width: 913px ! important; border: medium none ! important; overflow: hidden ! important; bottom: 0px ! important; min-width: 913px ! important; max-width: 913px ! important; position: fixed ! important; z-index: 2147483646 ! important; height: 29px ! important; min-height: 29px ! important; max-height: 29px ! important; display: none ! important;" title="Disqus" tabindex="0" scrolling="no" allowtransparency="true" name="indicator-south" id="indicator-south" frameborder="0"></iframe></div>
            </div>
        </div>
    </div>
</div>



</div>

<div class="container">
    <hr>
    <small>
        <footer class="text-muted">
            <div class="row">
                <div class="col-lg-2 col-lg-offset-2 text-center hide-phone">
                    扫一扫，下载湾区日报App<br>
                    <a href="https://itunes.apple.com/app/apple-store/id995762924?ct=web&amp;tduid=1010l6Sv&amp;partnerId=2003&amp;pt=1302761&amp;mt=8" onclick="ga('send', 'event', 'Nav', 'App QR Code');">
                        <img src="Wanqu_files/app_qr_code.jpg" title="下载湾区日报 iPhone App" width="90px">
                    </a>
                    <br>
                </div>
                <div class="col-lg-4 text-center">
                    <a href="http://www.weibo.com/wanquribao" target="_blank" title="关注湾区日报微博" onclick="ga('send', 'event', 'Nav', 'Weibo Subscribe');"><i class="fa fa-weibo fa-2x"></i></a> &nbsp;
                    <a href="https://nfil.es/w/jS2Lka/" target="_blank" title="关注湾区日报微信公共账号" onclick="ga('send', 'event', 'Nav', 'Weixin Subscribe');"><i class="fa fa-weixin fa-2x"></i></a> &nbsp;
                    <a href="https://twitter.com/wanquribao" target="_blank" title="关注湾区日报Twitter" onclick="ga('send', 'event', 'Nav', 'Twitter Subscribe');"><i class="fa fa-twitter fa-2x"></i></a> &nbsp;
                    <a href="https://www.facebook.com/wanquribao" target="_blank" title="关注湾区日报Facebook页面" onclick="ga('send', 'event', 'Nav', 'Facebook Subscribe');">
                        <i class="fa fa-facebook fa-2x"></i></a> &nbsp;
                    <a href="https://plus.google.com/107100681231961224821/posts" target="_blank" title="关注湾区日报Google+页面" onclick="ga('send', 'event', 'Nav', 'Google+ Subscribe');">
                        <i class="fa fa-google-plus fa-2x"></i></a> &nbsp;
                    <a href="https://www.reddit.com/r/wanqu/" target="_blank" title="关注湾区日报subreddit" onclick="ga('send', 'event', 'Nav', 'Reddit Subscribe');"><i class="fa fa-reddit fa-2x"></i></a> &nbsp;
                    <a href="http://wanqu.co/feed" target="_blank" title="订阅湾区日报RSS" onclick="ga('send', 'event', 'Nav', 'RSS Subscribe');"><i class="fa fa-rss fa-2x"></i></a> &nbsp;
                    <a href="https://medium.com/@wanquribao/" target="_blank" title="湾区日报的官方博客" onclick="ga('send', 'event', 'Nav', 'Blog');"><i class="fa fa-medium fa-2x"></i></a>
                    <br><br>

                    <a href="https://wanqu.co/collections" title="按主题归类，精选文章合集" onclick="ga('send', 'event', 'Nav', 'Nav Collection');">精选合集</a> &nbsp;
                    <a href="https://wanqu.co/hot" title="查看近期热门文章" onclick="ga('send', 'event', 'Nav', 'Nav Hot');">热门</a> &nbsp;
                    <a href="https://wanqu.co/books" title="推荐书籍" onclick="ga('send', 'event', 'Nav', 'Nav Books');">荐书</a> &nbsp;
                    <a title="捐款" href="https://wanqu.co/donate" onclick="ga('send', 'event', 'Nav', 'Donate');">捐款</a>  &nbsp;
                    <a title="1分钟问卷调查" href="https://wanquribao.typeform.com/to/m6EkUp" onclick="ga('send', 'event', 'Nav', 'Survey');">问卷</a> &nbsp;
                    <a href="http://eepurl.com/1CSe1" target="_blank" title="订阅湾区日报邮件列表" onclick="ga('send', 'event', 'Nav', 'Email Subscribe');">邮件订阅</a>
                    <br><br>
                    © 2014-2016 湾区日报 &nbsp;<br>
                    <i class="fa fa-envelope"></i> <a href="mailto:hi@wanqu.co">hi@wanqu.co</a><br>
                    <br>
                </div>
                <div class="col-lg-3 col-offset-11" style="font-size:11px;">
                    <div class="" title="App提供内购：$3.99 或 ￥25，请我喝半杯咖啡吧（星巴克 Venti Vanilla Latte 一杯 $4.45）～">
                    <a href="https://wanqu.co/about">网站</a>上线523天，访问量715042，独立访客数206253，广告收入$1059.55（相当于湾区日报运营19个月的<a href="http://wanqu.co/blog/2015-08-06-one-year-anniversary.html">服务器、域名等费用</a>），最近一次更新网站代码是11天前
                    <br><br>
                    <a href="https://itunes.apple.com/app/apple-store/id995762924?ct=web&amp;tduid=1010l6Sv&amp;partnerId=2003&amp;pt=1302761&amp;mt=8" onclick="ga('send', 'event', 'Nav', 'App Stats');">
                       App </a>上线223天：下载量8957，其中597位读者请我喝了约268杯星巴克的<a href="http://foodmenuprices.net/starbucks-menu-prices/"> Venti Vanilla Latte</a>，最新版上线于5天前
                   </div>
                </div>
            </div>
            <br><br>
        </footer>
    </small>
</div>




<script type="text/javascript">
    /* * * CONFIGURATION VARIABLES * * */
    var disqus_url = 'https://wanqu.co/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html';
    var disqus_container_id = 'disqus_thread';
    var disqus_title = "放弃向风投融资，自力更生的盈利之路 | 湾区日报";
    var disqus_shortname = 'wanquco';
    var disqus_identifier = 'https://wanqu.co/2016-01-06-how-we-got-off-the-addiction-to-venture-capital-and-created-our-own-way-to-profits-skift.html';

    /* * * DON'T EDIT BELOW THIS LINE * * */
    (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>


<script>
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-53635138-1', 'auto');
    ga('send', 'pageview');

</script>
<!-- Go to www.addthis.com/dashboard to customize your tools -->
<script type="text/javascript" src="Wanqu_files/addthis_widget.js" async="async"></script>


<script>
    WANQU_POST_ID = 2548;
</script>


<script data-main="/static/js/generic" src="Wanqu_files/require.js" type="text/javascript"></script>

<script type="text/javascript">
/* <![CDATA[ */
(function(){try{var s,a,i,j,r,c,l=document.getElementsByTagName("a"),t=document.createElement("textarea");for(i=0;l.length-i;i++){try{a=l[i].getAttribute("href");if(a&&a.indexOf("/cdn-cgi/l/email-protection") > -1  && (a.length > 28)){s='';j=27+ 1 + a.indexOf("/cdn-cgi/l/email-protection");if (a.length > j) {r=parseInt(a.substr(j,2),16);for(j+=2;a.length>j&&a.substr(j,1)!='X';j+=2){c=parseInt(a.substr(j,2),16)^r;s+=String.fromCharCode(c);}j+=1;s+=a.substr(j,a.length-j);}t.innerHTML=s.replace(/</g,"&lt;").replace(/>/g,"&gt;");l[i].setAttribute("href","mailto:"+t.value);}}catch(e){}}}catch(e){}})();
/* ]]> */
</script>


</body></html>
"""


class AnnotationsTest(unittest.TestCase):
    def test_annotation(self):
        html_page = HtmlPage(body=TEST_PAGE)
        template = {
            'original_body': html_page.body
        }
        data = {
            'extracts': [
                {
                    'annotations': {'href': 'origin'},
                    'id': 'test-id-123',
                    'required': [],
                    'tagid': 123,
                    'variant': 0
                }
            ]
        }
        annotations = Annotations()
        annotations.save_extraction_data(data, template)
        sample = HtmlPage(body=add_tagids(template['annotated_body']))
        for element in sample.parsed_body:
            if isinstance(element, HtmlTag):
                tagid = element.attributes.get(TAGID, None)
                if tagid and int(tagid) == data['extracts'][0]['tagid']:
                    annotation = element.attributes.get('data-scrapy-annotate')
                    self.assertTrue(annotation)
                    self.assertTrue('&quot;id&quot;: &quot;test-id-123&quot;')
