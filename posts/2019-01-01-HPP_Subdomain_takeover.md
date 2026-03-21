---
title: 了解HPP
date: January 1st 2019
tags: [Web安全, HTTP参数污染, 子域名接管, 笔记]
summary: HTTP 参数污染（HPP）与子域名接管漏洞学习笔记，介绍 HPP 的测试步骤、利用场景及子域名接管的发现与利用方法。
---

# 了解HPP

# HPP

## 测试：

存在于POST,GET之中。

步骤：

1. page?par1=vall
2. page?par1=HPP_TEST1
3. page?par1=val1&par1=HPP_TEST1

更详细的：[https://www.acunetix.com/blog/whitepaper-http-parameter-pollution/](https://www.acunetix.com/blog/whitepaper-http-parameter-pollution/)

Use to:

1. 取代现有的编码HTTP参数。
2. 更改或修改预期/正常应用程序行为。
3. 访问并利用未正确控制的变量。
4. 绕过WAF规则或输入验证机制。

## Referer:

- #BugBounty — Compromising User Account- ”How I was able to compromise user account via HTTP Parameter Pollution(HPP)”
- HTTP Parameter Pollution

# Subdomain_takeover

## 测试

使用：dig nslookup host来探测子域名解析的地址

对比：

- [https://github.com/EdOverflow/can-i-take-over-xyz](https://github.com/EdOverflow/can-i-take-over-xyz)
- [https://dzone.com/articles/what-are-subdomain-takeovers-how-to-test-and-avoid](https://dzone.com/articles/what-are-subdomain-takeovers-how-to-test-and-avoid)

来判断是否可以进行托管。

只能先作为一个简单的了解，利用只能等后面遇到再试了。