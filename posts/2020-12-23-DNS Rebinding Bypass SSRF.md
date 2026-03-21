---
title: DNS Rebinding Bypass SSRF
date: December 23rd 2020
tags: [Web安全, SSRF, DNS重绑定, Bypass]
summary: DNS 重绑定攻击原理详解，介绍如何通过控制 DNS TTL 与 IP 轮换机制绕过服务端请求伪造（SSRF）的 IP 黑名单过滤。
---

# DNS Rebinding Bypass SSRF

## 什么是DNS Rebinding？

维基百科上是这样描述的：

> DNS重新绑定是计算机攻击的一种形式。 在这种攻击中，恶意网页会导致访问者运行客户端脚本，攻击网络上其他地方的计算机。 从理论上讲，同源策略可防止发生这种情况：客户端脚本只能访问为脚本提供服务的同一主机上的内容。 比较域名是实施此策略的重要部分，因此DNS重新绑定通过滥用域名系统（DNS）来绕过这种保护。  
> 这种攻击可以通过让受害者的网络浏览器访问专用IP地址的机器并将结果返回给攻击者来破坏专用网络。 它也可以用于使用受害者机器发送垃圾邮件，分布式拒绝服务攻击或其他恶意活动。

由于我们是用它来绕过SSRF漏洞，所以简单理解就是：当某一个SSRF检测是通过DNS解析后的`ip地址`来判断是否为安全地址的话，我们可以通过`DNS rebinding`来进行绕过。

## 传统SSRF过滤流程

1. 获取到输入的URL，从该URL中提取host
2. 对该host进行DNS解析，获取到解析的IP
3. 检测该IP是否是合法的，比如是否是私有IP等
4. 如果IP检测为合法的，则进入curl的阶段发包

从DNS解析的角度来看，这个过程一共有两次解析，第一次是`对该host进行DNS解析`，第二次是`进入curl的阶段发包`，这两次请求之间存在一个时间差，如果我们能够修改DNS地址在第一次请求的时候为合法地址，第二次请求时为恶意地址，就可以绕过这个检测了。

## DNS Rebinding如何利用？

> 攻击者注册一个域名（如attacker.com），并在攻击者控制下将其代理给DNS服务器。 服务器配置为很短响应时间的TTL记录，防止响应被缓存。 当受害者浏览到恶意域时，攻击者的DNS服务器首先用托管恶意客户端代码的服务器的IP地址作出响应。 例如，他们可以将受害者的浏览器指向包含旨在在受害者计算机上执行的恶意JavaScript或Flash脚本的网站。  
> 恶意客户端代码会对原始域名（例如attacker.com）进行额外访问。 这些都是由同源政策所允许的。 但是，当受害者的浏览器运行该脚本时，它会为该域创建一个新的DNS请求，并且攻击者会使用新的IP地址进行回复。 例如，他们可以使用内部IP地址或互联网上某个目标的IP地址进行回复。

TTL是一条域名解析记录在DNS服务器中的存留时间。把这个值设置的非常小可以防止DNS解析结果被缓存，进而使得每次获取DNS解析结果是不同的。

简单理一下这个过程：

1. 攻击者配置了一台DNS服务器用于解析某域名
2. 每次请求后返回的解析结果不一样，分别是一个合法地址，一个是恶意地址
3. 当服务器在第一次请求的时候返回合法地址，第二次请求时返回的是恶意地址。就可以绕过限制进行利用

当然有师傅会觉得比较麻烦，还需要搭DNS服务器啥的，这里提供两个方式可以降低利用复杂度。不需要自己去搭建一个DNS服务器来进行利用，可以使用一些平台来构造。

1. http://ceye.io/
2. https://lock.cmpxchg8b.com/rebinder.html

## DNS Rebinding 题目场景

这次huaweictf中有一道题就是利用`DNS Rebinding`来绕过SSRF检测拿到flag。题目环境中存在一个疑似可利用的SSRF漏洞，各种条件限制的非常严格。题目部分代码如下：

```python
app.get('/flag', function(req, res){
    if (req.ip === '127.0.0.1') {
        res.status(200).send(env.parsed.flag)
    } else res.status(403).end('not so simple');
}); // 这里可以获取flag

app.post('/admin', (req, res) => {
    if ( !req.body.fileurl || !check(req.body.fileurl) ) {
        res.end("Invalid file link")
        return
    }
    let file = req.body.fileurl;

    //dont DOS attack, i will sleep before request
    cp.execSync('sleep 5')

    let options = {url : file, timeout : 3000}
    request.get(options ,(error, httpResponse, body) => {
        if (!error) {
            res.set({"Content-Type" : "text/html; charset=utf-8"})
            res.end(body)
        } else {
            res.end( JSON.stringify({"code" : "-1", "message" : error.toString()}) )
        }
    });
})
```

这里会接收一个`fileurl`的参数，使用`check`函数对其进行检查，如果通过，则使用`request.get`发起请求并返回结果。获取flag的页面对来源`ip`进行了限制，只允许`127.0.0.1`进行获取。那这里的利用思路就比较直接，绕过这个`check`函数，拿到`flag`。

来看下这个`check`函数。

```python
const cp = require('child_process')
const ip = require('ip')
const url = require('url');
const {docker} = require("./docker.js")

const checkip = function (value) {
    let pattern = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (!pattern.exec(value))
        return false;
    let ary = value.split('.');
    for(let key in ary)
    {
        if (parseInt(ary[key]) > 255)
            return false;
    }
    return true ;
}

const dnslookup = function(s) {
    if (typeof(s) == 'string' && !s.match(/[^\w-.]/)) {
        let query = '';
        try {
            query = JSON.parse(cp.execSync(`curl http://ip-api.com/json/${s}`)).query
        } catch (e) {
            return 'wrong'
        }
        return checkip(query) ? query : 'wrong'
    } else return 'wrong'
}

const check = function(s) {
    if (!typeof (s) == 'string' || !s.match(/^http\:\/\//))
        return false

    let blacklist = ['wrong', '127.', 'local', '@', 'flag']
    let host, port, dns;

    host = url.parse(s).hostname
    port = url.parse(s).port
    if ( host == null || port == null)
        return false

    dns = dnslookup(host); // 这里要获取主机的dns信息

    if ( ip.isPrivate(dns) || dns != docker.ip || ['80','8080'].includes(port) )
        return false

    for (let i = 0; i < blacklist.length; i++)
    {
        let regex = new RegExp(blacklist[i], 'i');
        try {
            if (ip.fromLong(s.replace(/[^\d]/g,'').substr(0,10)).match(regex))
                return false
        } catch (e) {}
        if (s.match(regex))
            return false
    }
    return true
}

exports.check = check
```

针对`fileurl`的检查流程是由三个函数所组成的，主要检查的内容如下：

1. 检查是否是字符串类型，是否以http://开头
2. 使用url.parse获取hostname和port，其中一个都不能为null
3. 调用curl http://ip-api.com/json/${s}获取域名的DNS最终的解析地址，dns地址必须为docker.ip。(这个地址是题目中已经定义好了的一个ip地址)
4. port不能是80或者8080端口
5. 整个url中不能有包含['wrong', '127.', 'local', '@', 'flag']

通过这个检查流程，可以拦截绝大多数绕过SSRF的方式。但是这里存在一个问题，判断dns地址是否`docker.ip`和真正请求地址是分开的，分别是两个不同的请求。所以这里可以利用`DNS rebinding`方式进行绕过，让上面的第3步获取到的dns地址是`docker.ip`，而后面真正请求的时候，则获取到的是我们构造的恶意服务器地址。

这里我用了第二个平台来进行利用，A一个绑定了我的vps地址，B绑定了`docker.ip`:

![-w800](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/24/16087250521006.jpg)

下面生成了一个地址，可以用`https://tool.chinaz.com/dns/`查询一下，在结果中可以看到不同的地区查询出来的最终解析地址是不一样的，一个是我的vps地址，另一个是题目的`docker.ip`。并且这里的TTL都为1。

![-w800](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/24/16087251753711.jpg)

在`vps`上起一个web服务，端口不为`80`与`8080`，写一个`index.php`页面用于跳转：(我这里用的端口为9024)

```php
<?php
    header("Location:http://127.0.0.1/flag");
?>
```

由于`flag`这个字符是在跳转里的，并没有在url中，自然也就不会被拦截了。这样，我们只需要给admin页面传入`fileurl=http://xxxxxx.7925af9a.rbndr.us:9024/`就可以绕过检测来进行SSRF漏洞的利用了。

服务器那边解析不一定就会按照预想的来，需要不停的发包来碰撞。最终拿到flag如下：

![-w881](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/24/16087257962369.jpg)

## 修复

1. 如果应用服务所接收的url是一个固定的域名或者域名范围可控，就应该创建白名单来校验域名。
2. 如果接收的url的域名是不可控的，则可以考虑用一个沙箱环境来进行数据请求，实现内网分离。
3. …

## 参考

- https://blog.csdn.net/u011721501/article/details/54667714