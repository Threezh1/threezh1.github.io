---
title: 初探Docker之搭建CTF平台
date: June 6th 2019
tags: [Docker, CTF, 运维, 环境搭建]
summary: 使用腾讯云学生机初探 Docker，记录基于 CTFd 框架与 Docker 容器技术搭建 CTF 竞赛平台的完整过程。
---

# 初探Docker之搭建CTF平台

## 说在前面

腾讯10元学生机 [购买](https://cloud.tencent.com/act/campus?fromSource=gwzcw.1110156.1110156.1110156&gclid=CjwKCAjw0N3nBRBvEiwAHMwvNlylCbGdNZtjAnOQXkyllVSfCVgTS8gvywBaaFainLdyhJDNkvadPhoCgjQQAvD_BwE)  
也可以使用阿里云的学生机，都很便宜。

这里我选择了Ubuntu系统。

## 安装Docker + Docker-compose

- 安装Docker：

可以参考这个：[Ubuntu Docker 安装](https://www.runoob.com/docker/ubuntu-docker-install.html)

```
安装最新的docker
wget -qO- https://get.docker.com/ | sh

安装完会有一个提示，按照提示去执行
sudo usermod -aG docker ubuntu
```

命令执行完成之后，执行 `docker verison` 来查看是否安装完成。

![anzhuangdocker.jpg](https://i.loli.net/2019/06/06/5cf8b92a35cbe47448.jpg)

- 安装Docker-compose：

参考：[https://github.com/docker/compose/releases](https://github.com/docker/compose/releases)

因为我的腾讯云不是root权限，在执行命令前要加sudo

```
sudo curl -L https://github.com/docker/compose/releases/download/1.25.0-rc1/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

同样的，命令执行完成之后，执行 `docker-compose verison` 来查看是否安装完成。

![anzhuangdockercompose.jpg](https://i.loli.net/2019/06/06/5cf8b92a4434a94613.jpg)

## 搭建CTF平台

直接用github上已经集成的平台ctfd来搭建。

地址：[https://github.com/CTFd/CTFd](https://github.com/CTFd/CTFd)

下载项目：

```
git clone https://github.com/CTFd/CTFd.git

cd CTFd
```

![ctfddownload.jpg](https://i.loli.net/2019/06/06/5cf8b92cae22420102.jpg)

运行安装：

```
docker-compose up -d
这个命令要在CTFd目录中执行
```

第一次运行就比较慢，会下载很多东西。(可能会等很久，实在等不下去了就先退出，进入CTFd文件夹又可以docker-compose up -d 继续)

下面这种情况就是安装好了：

![ctfdanzhuanghao.jpg](https://i.loli.net/2019/06/06/5cf8b92ad092988684.jpg)

使用命令 docker-compose ps查看运行的容器

![ctfcomposeps.jpg](https://i.loli.net/2019/06/06/5cf8b92a80dd092669.jpg)

这时候就可以去访问自己的ip地址了，记得加上端口号8000。比如：[http://ip:8000/](http://ip:8000/)

![ctfdchenggong.jpg](https://i.loli.net/2019/06/06/5cf8b92c550c320698.jpg)

可以看到平台已经搭建成功了。

如果你想停止运行平台的话，在CTFd目录下执行 docker-compose stop即可。

继续运行：docker-compose up -d

## 搭建ctf题目环境

用docker来搭建ctf题目环境

这里只尝试搭建一个简单的ctf题目环境。

去网易镜像中心寻找一个合适的镜像：[https://c.163yun.com/hub](https://c.163yun.com/hub)

这里我选择了 public /LAMP 镜像。

下载镜像：

```
docker pull hub.c.163.com/public/lamp:latest
```

我们可以使用docker images查看已经下载的镜像

![ctfdockerimages.jpg](https://i.loli.net/2019/06/06/5cf8b92ca519541036.jpg)

运行镜像，绑定端口：

```
docker run -d -p 3333:80 hub.c.163.com/public/lamp
端口是可以自己更改的，我这里是指定了3333端口。(记得去服务器商那设置安全组，不然3333端口是访问不了的)
```

会返回一串随机字符，也就是容器的ID。

这时可以用docker ps查看正则运行的容器

![ctfrun.jpg](https://i.loli.net/2019/06/06/5cf8b92cdd26d78991.jpg)

复制文件到容器内：

```
docker cp ./index.php 321780737d:/var/www/
只需取容器ID前面部分即可
```

进入容器内部查看：

```
docker exec -it 321780737d bash
```

![ctfbash.jpg](https://i.loli.net/2019/06/06/5cf8b92a63a6d51587.jpg)

从浏览器访问：[http://ip:3333/](http://ip:3333/) 可以看到，已经部署成功了。

![ctfover.jpg](https://i.loli.net/2019/06/06/5cf8b92cb015617422.jpg)

就可以把题目链接挂到CTF平台上面了。

## 总结

docker还有很多内容都没有接触到，这里只是利用docker和docker-compose搭建了一个简单的题目环境。

后面等用到再继续深入学习docker。

## 参考

- http://blog.5am3.com/2017/12/08/SCodeCTF/
- https://www.imooc.com/learn/867