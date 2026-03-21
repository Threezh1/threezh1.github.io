---
title: Hacktm中一道Node.js题分析(Draw with us)
date: February 2nd 2020
tags: [CTF, Writeup, Node.js, Web安全]
summary: HackTM CTF 2020 Node.js 题 Draw with us 详细分析，梳理 WebSocket 与原型链污染结合的漏洞利用链构造思路。
---

# Hacktm中一道Node.js题分析(Draw with us)

## 说在前面

请教Hpdoger师傅Node.js的问题时，他给了我一道HackTM CTF 2020的Node.js题。花了几个小时看也没有很好的解决。最后还是他给了思路才把想整个过程理清楚。由于才刚刚学习node.js，文章中如果出现问题还希望师傅们指出来，十分感谢。

## 解题思路

题目界面：

![ctf_web.png](https://i.loli.net/2020/02/11/QtYxnKybMk3oIl5.png)

题目部分源码：

```js
const express = require("express");
const cors = require("cors");
const app = express();
const uuidv4 = require("uuid/v4");
const md5 = require("md5");
const jwt = require("express-jwt");
const jsonwebtoken = require("jsonwebtoken");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const bigInt = require("big-integer");
const { flag, p, n, _clearPIN, jwtSecret } = require("./flag");

const config = {
  port: process.env.PORT || 8081,
  width: 120,
  height: 80,
  usersOnline: 0,
  message: "Hello there!",
  p: p,
  n: n,
  adminUsername: "hacktm",
  whitelist: ["/", "/login", "/init"],
  backgroundColor: 0x888888,
  version: Number.MIN_VALUE
};

io.sockets.on("connection", function(socket) {
  config.usersOnline++;
  socket.on("disconnect", function() {
    config.usersOnline--;
  });
});

let users = {
  0: {
    username: config.adminUsername,
    rights: Object.keys(config)
  }
};

let board = new Array(config.height)
  .fill(0)
  .map(() => new Array(config.width).fill(config.backgroundColor));
let boardString = boardToStrings();

app.use(express.json());
app.use(cors());
app.use(
  jwt({ secret: jwtSecret }).unless({
    path: config.whitelist
  })
);
app.use(function(error, req, res, next) {
  if (error.name === "UnauthorizedError") {
    res.json(err("Invalid token or not logged in."));
  }
});

function sign(o) {
  return jsonwebtoken.sign(o, jwtSecret);
}

function isAdmin(u) {
  return u.username.toLowerCase() == config.adminUsername.toLowerCase();
}

function ok(data = {}) {
  return { status: "ok", data: data };
}

function err(msg = "Something went wrong.") {
  return { status: "error", message: msg };
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

app.get("/", (req, res) => {
  // Get current board
  res.json(ok({ board: boardString }));
});

app.post("/init", (req, res) => {
  // Initialize new round and sign admin token
  // RSA protected!
  // POST
  // {
  //   p:"0",
  //   q:"0"
  // }

  let { p = "0", q = "0", clearPIN } = req.body;

  let target = md5(config.n.toString());

  let pwHash = md5(
    bigInt(String(p))
      .multiply(String(q))
      .toString()
  );

  if (pwHash == target && clearPIN === _clearPIN) {
    // Clear the board
    board = new Array(config.height)
      .fill(0)
      .map(() => new Array(config.width).fill(config.backgroundColor));
    boardString = boardToStrings();

    io.emit("board", { board: boardString });
  }

  //Sign the admin ID
  let adminId = pwHash
    .split("")
    .map((c, i) => c.charCodeAt(0) ^ target.charCodeAt(i))
    .reduce((a, b) => a + b);

  console.log(adminId);

  res.json(ok({ token: sign({ id: adminId }) }));
});

app.get("/flag", (req, res) => {
  // Get the flag
  // Only for root
  if (req.user.id == 0) {
    res.send(ok({ flag: flag }));
  } else {
    res.send(err("Unauthorized"));
  }
});

app.get("/serverInfo", (req, res) => {
  // Get server info
  // Only for logged in users

  let user = users[req.user.id] || { rights: [] };
  let info = user.rights.map(i => ({ name: i, value: config[i] }));
  res.json(ok({ info: info }));
});

app.post("/paint", (req, res) => {
  // Paint on the canvas
  // Only for logged in users
  // POST
  // {
  //   x:0,
  //   y:0
  // }
  let user = users[req.user.id] || {};

  x = req.body.x;
  y = req.body.y;

  let color = user.color || 0x0;

  if (board[y] && board[y][x] >= 0) {
    board[y][x] = color;
    boardString = boardToStrings();
    io.emit("change", { change: { pos: [x, y], color: color } });
    res.send(ok());
  } else {
    res.send(err("Invalid painting"));
  }
});

app.post("/updateUser", (req, res) => {
  // Update user color and rights
  // Only for admin
  // POST
  // {
  //   color: 0xDEDBEE,
  //   rights: ["height", "width", "usersOnline"]
  // }
  let uid = req.user.id;
  let user = users[uid];
  if (!user || !isAdmin(user)) {
    res.json(err("You're not an admin!"));
    return;
  }
  let color = parseInt(req.body.color);
  users[uid].color = (color || 0x0) & 0xffffff;
  let rights = req.body.rights || [];
  if (rights.length > 0 && checkRights(rights)) {
    users[uid].rights = user.rights.concat(rights).filter(onlyUnique);
  }

  res.json(ok({ user: users[uid] }));
});

app.post("/login", (req, res) => {
  // Login
  // POST
  // {
  //   username: "dumbo",
  // }

  let u = {
    username: req.body.username,
    id: uuidv4(),
    color: Math.random() < 0.5 ? 0xffffff : 0x0,
    rights: [
      "message",
      "height",
      "width",
      "version",
      "usersOnline",
      "adminUsername",
      "backgroundColor"
    ]
  };

  if (isValidUser(u)) {
    users[u.id] = u;
    res.send(ok({ token: sign({ id: u.id }) }));
  } else {
    res.json(err("Invalid creds"));
  }
});

function isValidUser(u) {
  return (
    u.username.length >= 3 &&
    u.username.toUpperCase() !== config.adminUsername.toUpperCase()
  );
}

function boardToStrings() {
  return board.map(b => b.join(","));
}

function checkRights(arr) {
  let blacklist = ["p", "n", "port"];
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (blacklist.includes(element)) {
      return false;
    }
  }
  return true;
}

server.listen(config.port, () =>
  console.log(`Server listening on port ${config.port}!`)
);
```

整个题目就是一个在线画图的程序，当输入用户名登录之后就可以对网页上的颜色格子进行操作。(这不是重点)服务端使用了`express`框架，并使用`express-jwt`来进行用户验证。

比较重要的页面分别是：

1. /init 获取POST数据中的p和q参数，最终生成一个adminId，返回一个id=adminId的用户token
2. /serverInfo 根据用户的权限返回config内的信息
3. /updateUser 更新用户信息，设置用户权限
4. /login 登录账户
5. /flag 获取Flag

逆推整个过程的话，大概是这样的思路：

### 怎么获取Flag？

访问Flag页面需要对adminId进行判断，adminId需要为0才能获取得到Flag。而adminId是可以通过/init传递p和q参数进行设置的。怎么将adminId设置为0呢？

### 怎么将adminId设置为0？

来具体看一下`/init`页面，它会获取POST数据中的p和q参数，并最终生成一个adminId：

```js
app.post("/init", (req, res) => {
  let { p = "0", q = "0", clearPIN } = req.body; // 从POST数据当中获取得到p和q
  let target = md5(config.n.toString()); // target是config中n的md5加密
  let pwHash = md5(
    bigInt(String(p))
      .multiply(String(q))
      .toString()
  ); // 将p与p相乘
  if (pwHash == target && clearPIN === _clearPIN) {
    // 清理面板
    board = new Array(config.height)
      .fill(0)
      .map(() => new Array(config.width).fill(config.backgroundColor));
    boardString = boardToStrings();
    io.emit("board", { board: boardString });
  }
  //Sign the admin ID
  let adminId = pwHash
    .split("")
    .map((c, i) => c.charCodeAt(0) ^ target.charCodeAt(i))
    .reduce((a, b) => a + b); // 取合值
  console.log(adminId);
  res.json(ok({ token: sign({ id: adminId }) }));
});
```

- node.js中map可以参考：Array.prototype.map()
- reduce可以参考：Array.prototype.reduce()

一些语句已经作了注释，最重要的在后面的`map((c, i) => c.charCodeAt(0) ^ target.charCodeAt(i))`，这个语句的作用就是将pwHash中的每一位与target中的相同位置的字符进行异或。最后reduce将异或后的值进行取和。

pwnHash的来源是`md5(p*q)`，target的来源是`md5(n)`，如果想要它们异或后再取和的值为0的话，我们该怎么做呢？

我们首先得知道n的值是多少。在知道n的情况下，将p设置为n的值，q设置为1。(qp互换也可以)这样pwnHash和target的值就会相同。相同的值进行异或就会为0，取和之后也为0。这样就可以使adminId为0了。页面最终还会返回id为0的token，利用token就可以获取flag了。

那现在的问题就是怎么得到n的值。

### 怎么获取n的值？

在源码中可以知道，`/serverInfo`会根据用户的权限(right)返回config内的信息。默认获取得到的值中是没有n的，所以我们需要通过`/updateUser`页面来设置当前用户查看config信息的权限。

先来看下`/updateUser`页面的源码：

```js
app.post("/updateUser", (req, res) => {
  // Update user color and rights
  // Only for admin
  // POST
  // {
  //   color: 0xDEDBEE,
  //   rights: ["height", "width", "usersOnline"]
  // }
  let uid = req.user.id;
  let user = users[uid];
  if (!user || !isAdmin(user)) {
    res.json(err("You're not an admin!"));
    return;
  }
  let color = parseInt(req.body.color);
  users[uid].color = (color || 0x0) & 0xffffff;
  let rights = req.body.rights || [];
  if (rights.length > 0 && checkRights(rights)) { //检查rights
    users[uid].rights = user.rights.concat(rights).filter(onlyUnique); //去重操作
  }

  res.json(ok({ user: users[uid] }));
});
```

数据包格式为：

```plain
{
	color: 0xDEDBEE,
	rights: ["height", "width", "usersOnline"]
}
```

rights部分就是要添加查看的权限。

先不看前面是否为管理员的判断，直接看后面添加权限时的判断。这里调用了`checkRights()`来进行权限检查。

```js
function checkRights(arr) {
  let blacklist = ["p", "n", "port"];
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (blacklist.includes(element)) {
      return false;
    }
  }
  return true;
}
```

函数中设置了一个黑名单，不允许`p、n、port`被添加进用户的查看权限中。验证方式是用for循环获取每一个权限，查看其是否在blacklist中。如果存在就返回false，不存在就返回true。所以传递rights的不能直接传递”n”。

先来看`/serverInfo`页面是怎么获取config的值的，

```js
app.get("/serverInfo", (req, res) => {
  // Get server info
  // Only for logged in users

  let user = users[req.user.id] || { rights: [] };
  let info = user.rights.map(i => ({ name: i, value: config[i] }));
  res.json(ok({ info: info }));
});
```

这里获取config的值就是通过config[i]获取的(i是键名)。那如何不直接传递”n”而得到n的值呢？

这里要了解javascript中数组取值的方式。定义一个array1数组如图，注意赋值时的参数值：

![node_array.png](https://i.loli.net/2020/02/11/r6PEAHZRoh89Vjs.png)

可以看到，我这里传递给array1的键值是一个多维数组，但是同样可以获取得到数组中键名为”port”的值。(这种取值的方式在python、php中不行)

由于这样的取值方式是可行的，所以我们只需要给right赋值一个`["n"]`就可以绕过前面的黑名单了。

好，现在可以取到n了，再来看看怎么登陆管理员用户名。

### 怎么使用管理员用户名登陆？

登陆页面`/login`中有一个函数用于判断用户名是否为合理的用户名：

```js
function isValidUser(u) {
  return (
    u.username.length >= 3 &&
    u.username.toUpperCase() !== config.adminUsername.toUpperCase()
    // 长度大于3并且不能为adminUsername
  );
}
```

在`/updateUser`页面中有一个函数用于判断用户是否为管理员：

```js
function isAdmin(u) {
  return u.username.toLowerCase() == config.adminUsername.toLowerCase();
}
```

在登录时，`isValidUser`函数会对用户输入的用户名进行`toUpperCase`处理，再与管理员用户名进行对比。如果输入的用户名与管理员用户名相同，就不允许登录。

但是我们可以看到，在之后的一个判断用户是否为管理员的函数中，对用户名进行处理的是`toLowerCase`。所以这两个差异，就可以使用大小写特性来进行绕过。

大小写差异可以参考p神的这篇文章：[Fuzz中的javascript大小写特性](https://www.leavesongs.com/HTML/javascript-up-low-ercase-tip.html)

题目中默认的管理员用户名为：hacktm

所以，我们指定登录时的用户名为：hacKtm 即可绕过`isValidUser`和`isAdmin`的验证。

### 思路总结

- 利用javascript大小写特性使用管理员的用户名登录
- 给用户添加查看n的权限并查看n的值
- 通过赋值p、q将adminId设置为0
- 获取Flag

## 过程复现

- 利用javascript大小写特性使用管理员的用户名登录

![ctf_01.png](https://i.loli.net/2020/02/11/DWk8mzRydb6Q5Ls.png)

- 给用户添加查看n的权限并查看n的值

![ctf_02.png](https://i.loli.net/2020/02/11/FDihNnWXYVHCfug.png)

查看n的值：

![ctf_03.png](https://i.loli.net/2020/02/11/AuER7M3Ywg86eZK.png)

- 通过赋值p、q将adminId设置为0

![ctf_04.png](https://i.loli.net/2020/02/11/YDQNIyWcvXoJFEs.png)

- 获取Flag

![ctf_05.png](https://i.loli.net/2020/02/11/uEp3HdzKocv8JjD.png)