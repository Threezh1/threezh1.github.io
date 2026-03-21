---
title: phpmyadmin 4.8.1任意文件包含漏洞-CTF
date: January 1st 2018
tags: [CTF, Writeup, 文件包含, phpMyAdmin]
summary: CTF 题目复现 phpMyAdmin 4.8.1 任意文件包含漏洞，通过 mb_substr 路径截断绕过白名单过滤，利用 PHP Session 文件包含实现代码执行。
---

# phpmyadmin 4.8.1任意文件包含漏洞-CTF

题目地址：[http://222.18.158.226:50000/](http://222.18.158.226:50000/)

打开之后一个很大的滑稽图标~  
有一个链接：[http://222.18.158.226:50000/index.php?file=hint.php](http://222.18.158.226:50000/index.php?file=hint.php) 点进去显示：flag not here, and flag in ffffllllaaaagggg  
很明显，这里没有flag，lag在ffffllllaaaagggg里面。  
这个页面源码什么都没有~  
返回到原来的题目地址看看源码。  在源码当中发现了一个注释：  
按照前面hint链接的形式进入发现一段php代码：  

```php
    class emmm
    {
        public static function checkFile(&$page)
        {
            $whitelist = ["source"=>"source.php","hint"=>"hint.php"];	//定义了一个白名单。只有file的名字在这里名单的才可以往下继续进行。只有source.php与hint.php。
            if (! isset($page) || !is_string($page)) {
                echo "you can't see it";
                return false;
            }

            if (in_array($page, $whitelist)) {		//判断file页面是否在白名单里面。
                return true;
            }
            $_page = mb_substr(				//mb_substr 在第一个参数的字符串当中，从第二个参数的位置开始，取到第三个参数的位置。
                $page,
                0,
                mb_strpos($page . '?', '?')	//mb_strpos — 查找字符串在另一个字符串中首次出现的位置	 在这里它在page后面加了一个? 就正好将从第一个问号开始把后面取完了。
            );
            //重点在这个语句，这个语句会将第一个问号之后的内容都取出来。
            //到此的page为：hint.php%3f../../../../../fuck.txt
            if (in_array($_page, $whitelist)) {
                return true;
            }
            $_page = urldecode($page); 	//将file的值url解码
            //到此的page为：hint.php?../../../../../fuck.txt
            $_page = mb_substr(			//再取一遍问号之后的内容
                $_page,
                0,
                mb_strpos($_page . '?', '?')		
            );
            if (in_array($_page, $whitelist)) {
                return true;
            }
            echo "you can't see it";
            return false;
        }
    }
    if (! empty($_REQUEST['file'])
        && is_string($_REQUEST['file'])
        && emmm::checkFile($_REQUEST['file'])
    ) {
        include $_REQUEST['file'];
        exit;
    } else {
        echo "<br><img src=\"https://i.loli.net/2018/11/01/5bdb0d93dc794.jpg\" />";
    }  
?>

```

从这段代码来看，考的是phpmyadmin 4.8.1任意文件包含漏洞。  

问题出现在下面这段判断语句，在条件都为真的情况下就会包含参数file所赋予的内容。

判断语句里使用了emmm类的checkFile方法来判断file是否符合条件，看一下file方法里面的判断。分析内容在源码里。

从分析的内容来看，构造的链接要满足：  

1. file后面的网页必须在白名单内
2. 遍历前面的问号要经过两次url编码

构造语句为：[http://222.18.158.226:50000/index.php?file=hint.php%253f/../../../../../ffffllllaaaagggg](http://222.18.158.226:50000/index.php?file=hint.php%253f/../../../../../ffffllllaaaagggg) 

进入得到flag