---
title: Linux学习笔记
date: January 1st 2019
tags: [Linux, 运维, 笔记, 基础]
summary: Linux 系统基础学习笔记，涵盖 RPM 包管理、Yum 软件仓库、用户权限管理、Shell 脚本、网络配置等核心知识点。
---

# Linux学习笔记

## 第一章,部署虚拟环境安装Linux系统

### RPM(红帽软件包管理器)

常用命令：

```plain
安装软件		rpm -ivh filename.rpm
升级软件		rpm -Uvh filename.rpm
卸载软件		rpm -e filename.rpm
查询软件描述信息	rpm -qpi filename.rpm
列出软件文件信息	rpm -qpi filename.rpm
查询文件属于哪个RPM	rpm -qf filename.rpm
```

### Yum软件仓库

常用Yum命令：

```plain
yum repolist all			列出所有仓库
yum list all				列出仓库中所有软件包
yum info 软件包名称			查看软件包信息
yum install 软件包名称		安装软件包
yum reinstall 软件包名称		重新安装软件包
yum update 软件包名称		升级软件包
yum remove 软件包名称		移除软件包
yum clean all				移除所有仓库缓存
yum check-update			检查可更新的软件包
yum grouplist				查看系统中已经安装的软件包组
yum groupinstall 软件包组	安装指定的软件包组
yum groupremove 软件包组		移除指定的软件包组
yum groupinfo	软件包组		查询指定的软件包组信息
```

## 第二章,新手必须掌握的Linux命令

### 常用系统工作命令

- 1, echo 命令

echo 命令用于在终端输出字符串或变量提取后的值，格式为“echo [字符串 | $变量]”。

输出字符串：echo Hello World!!!

提取变量SHELL的值：echo $SHELL

- 2, date 命令

date 命令用于显示及设置系统的时间或日期，格式为`date [选项] [+指定的格式]`。

date 命令中的参数以及作用：

```plain
%t 	跳格[Tab键]
%H 	小时（00～23）
%I 	小时（00～12）
%M 	分钟（00～59）
%S 	秒（00～59）
%j 	今年中的第几天
```

查看当前系统时间：date

date 命令中输入以“+”号开头的参数，即可按照指定格式来输出系统的时间或日期

按照“年-月-日 小时:分钟:秒”的格式查看当前系统时间：  
`date "+%Y-%m-%d %H:%M:%S"`

将系统的当前时间设置为 2017 年 9 月 1 日 8 点 30 分的 date 命令:  
`date -s "20170901 8:30:00"`

再次使用 date 命令并按照默认的格式查看当前的系统时间:  
`date`

date 命令中的参数%j 可用来查看今天是当年中的第几天。这个参数能够很好地区分备份时  
间的新旧，即数字越大，越靠近当前时间。  
`date "+%j"`

- 3, reboot 命令

重启计算机

- 4, poweroff 命令

关闭系统

- 5, wget 命令

wget 命令用于在终端中下载网络文件，格式为“wget [参数] 下载地址”。

wget命令的参数以及作用：

```plain
-b 后台下载模式
-P 下载到指定目录
-t 最大尝试次数
-c 断点续传
-p 下载页面内所有资源，包括图片、视频等
-r 递归下载
```

下载一个pdf文档：`wget http://www.linuxprobe.com/docs/LinuxProbe.pdf`

使用 wget 命令递归下载 `www.linuxprobe.com` 网站内的所有页面数据以及  
文件，下载完后会自动保存到当前路径下一个名为 `www.linuxprobe.com` 的目录中。

`wget -r -p http://www.linuxprobe.com，`

- 6, ps 命令

ps 命令用于查看系统中的进程状态，格式为“ps [参数]”。

ps命令的参数以及作用：

```plain
-a 显示所有进程（包括其他用户的进程）
-u 用户以及其他详细信息
-x 显示没有控制终端的进程
```

Linux系统中进程状态：

```plain
R(运行)		进程正在运行或在运行队列中等待。
S(中断)		进程处于休眠中，当某个条件形成后或者接收到信号时，则脱离该状态。
D(不可中断)	进程不响应系统异步信号，即便用 kill 命令也不能将其中断。
Z(僵死)		进程已经终止，但进程描述符依然存在, 直到父进程调用 wait4()系统函数后将进程释放。
T(停止)		进程收到停止信号后停止运行。
```

- 7, top 命令

top 命令用于动态地监视进程活动与系统负载等信息，其格式为 top。

第 1 行：系统时间、运行时间、登录终端数、系统负载（三个数值分别为 1 分钟、5分钟、15 分钟内的平均值，数值越小意味着负载越低）。  

第 2 行：进程总数、运行中的进程数、睡眠中的进程数、停止的进程数、僵死的进程数。 

第 3 行：用户占用资源百分比、系统内核占用资源百分比、改变过优先级的进程资源百分比、空闲的资源百分比等。  

第 4 行：物理内存总量、内存使用量、内存空闲量、作为内核缓存的内存量。

第 5 行：虚拟内存总量、虚拟内存使用量、虚拟内存空闲量、已被提前加载的内存量。

- 8, pidof 命令

pidof 命令用于查询某个指定服务进程的 PID 值，格式为`pidof [参数] [服务名称]`。

- 9, kill 命令

kill 命令用于终止某个指定 PID 的服务进程，格式为`kill [参数] [进程 PID]`。

- 10, killall 命令

killall 命令用于终止某个指定名称的服务所对应的全部进程，格式为：`killall [参数] [服务名称]`。

### 系统状态检测命令

- 1, ifconfig 命令

ifconfig 命令用于获取网卡配置与网络状态等信息，格式为`ifconfig [网络设备] [参数]”`。

```plain
主要查看的就是
网卡名称、
inet 参数后面的 IP 地址、
ether 参数后面的网卡物理地址（又称为 MAC 地址），
以及 RX、TX 的接收数据包与发送数据包的个数及累计流量

eno16777728: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        ether 00:0c:29:26:b9:b3  txqueuelen 1000  (Ethernet)
        RX packets 45  bytes 4992 (4.8 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 0  bytes 0 (0.0 B)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 0  (Local Loopback)
        RX packets 770  bytes 62348 (60.8 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 770  bytes 62348 (60.8 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

```

- 2, uname 命令

uname 命令用于查看系统内核与系统版本等信息，格式为“uname [-a]”。

如果要查看当前系统版本的详细信息，则需要查看 redhat-release 文件，其命令以及相应的结果如下：

`cat /etc/redhat-release`

- 3, uptime 命令

uptime 用于查看系统的负载信息，格式为 uptime。

- 4, free 命令

free 用于显示当前系统中内存的使用量信息，格式为“free [-h]”。

- 5, who 命令

who 用于查看当前登入主机的用户终端信息，格式为“who [参数]”。

- 6, last 命令

last 命令用于查看所有系统的登录记录，格式为“last [参数]”。

- 7, history 命令

history 命令用于显示历史执行过的命令，格式为“history [-c]”。

历史命令会被保存到用户家目录中的.bash_history 文件中。

`cat ~/.bash_history`

清空历史记录信息： `history -c`

- 8, sosreport 命令

sosreport 命令用于收集系统配置及架构信息并输出诊断文档，格式为 sosreport。

### 工作目录切换命令

- 1, pwd 命令

pwd 命令用于显示用户当前所处的工作目录，格式为“pwd [选项]”。

- 2, cd 命令

cd 命令用于切换工作路径，格式为“cd [目录名称]”。

```plain
cd - 命令回到上一次所处的目录
cd. 命令进入上级目录
cd ~ 命令切换到当前用户的家目录
cd 路径
```

- 3, ls 命令

ls 命令用于显示目录中的文件信息，格式为`ls [选项] [文件]`。

使用 ls 命令的“-a”参数看到全部文件（包括隐藏文件），使用“-l”参数可以查看文件的属性、大小等详细信息。

`ls -al`

查看目录属性信息，则需要额外添加一个-d 参数。

`ls -ld /etc`

### 文本文件编辑命令

- 1, cat 命令

cat 命令用于查看纯文本文件（内容较少的），格式为`cat [选项] [文件]`。

如果在查看文本内容时还想顺便显示行号的话，可以在 cat 命令后面追加一个-n 参数

`cat -n initial-setup-ks.cfg`

- 2, more 命令

more 命令用于查看纯文本文件（内容较多的），格式为“more [选项]文件”。

对于长篇的文本内容，推荐使用 more 命令来查看。more 命令会在最下面使用百分比的形式来提示您已经阅读了多少内容。您还可以使用空格键或回车键向下翻页。

` more initial-setup-ks.cfg`

- 3, head 命令

head 命令用于查看纯文本文档的前 N 行，格式为`head [选项] [文件]`。

`head -n 20 initial-setup-ks.cfg`

- 4, tail 命令

tail 命令用于查看纯文本文档的后 N 行或持续刷新内容，格式为`tail [选项] [文件]`。

tail 命令最强悍的功能是可以持续刷新一个文件的内容，当想要实时查看最新日志文件时，这特别有用，此时的命令格式为“tail -f 文件名”：

`tail -f /var/log/messages`

- 5, tr 命令

tr 命令用于替换文本文件中的字符，格式为`tr [原始字符] [目标字符]`。

可以先使用 cat 命令读取待处理的文本，然后通过管道符（详见第 3 章）把这些文本内容传递给 tr 命令进行替换操作即可。例如，把某个文本内容中的英文全部替换为大写

`cat anaconda-ks.cfg | tr [a-z] [A-Z]`

- 6, wc 命令

wc 命令用于统计指定文本的行数、字数、字节数，格式为“wc [参数] 文本”。

```plain
-l 只显示行数
-w 只显示单词数
-c 只显示字节数
```

- 7, stat 命令

stat 命令用于查看文件的具体存储信息和时间等信息，格式为“stat 文件名称”。

- 8, cut 命令

cut 命令用于按“列”提取文本字符，格式为“cut [参数] 文本”。

使用-f 参数来设置需要看的列数，使用-d 参数来设置间隔符号。

读取两行： `head -n 2 /etc/passwd` 

读取按：间隔的第一列文本：`cut -d: -f1 /etc/passwd`

- 9, diff命令

diff 命令用于比较多个文本文件的差异，格式为“diff [参数] 文件”。

来使用 diff –brief 命令显示比较后的结果，判断文件是否相同：

`diff --brief diff_A.txt diff_B.txt`

使用带有-c 参数的 diff 命令来描述文件内容具体的不同：

`diff -c diff_A.txt diff_B.txt`

### 文件目录管理命令

- 1, touch 命令

touch 命令用于创建空白文件或设置文件的时间，格式为`touch [选项] [文件]`。

```plain
-a 仅修改“读取时间”（atime）
-m 仅修改“修改时间”（mtime）
-d 同时修改 atime 与 mtime
```

先使用 ls 命令查看一个文件的修改时间，然后修改这个文件，最后再通过 touch命令把修改后的文件时间设置成修改之前的时间。

```plain
ls -l wordpress.txt
echo "This is a test!!!" >> wordpress.txt
ls -l wordpress.txt
touch -d "2019-2-25 20:06" wordpress.txt
ls -l wordpress.txt
```

- 2, mkdir 命令

mkdir 命令用于创建空白的目录，格式为“mkdir [选项] 目录”

除了能创建单个空白目录外，mkdir命令还可以结合-p 参数来递归创建出具有嵌套叠层关系的文件目录。

`mkdir -p a/b/c/d/e`

- 3, cp 命令

cp 命令用于复制文件或目录，格式为“cp [选项] 源文件 目标文件”。

```plain
-p 保留原始文件的属性
-d 若对象为“链接文件”，则保留该“链接文件”的属性
-r 递归持续复制（用于目录）
-i 若目标文件存在则询问是否覆盖
-a 相当于-pdr（p、d、r 为上述参数）
```

使用 touch 创建一个名为 install.log 的普通空白文件，然后将其复制为一份名为x.log 的备份文件。

`cp install.log x.log`

- 4, mv 命令

mv 命令用于剪切文件或将文件重命名，格式为“mv [选项] 源文件 [目标路径|目标文件名]”。

- 5, rm 命令

rm 命令用于删除文件或目录，格式为“rm [选项] 文件”。

在 Linux 系统中删除文件时，系统会默认向您询问是否要执行删除操作，如果不想总是看到这种反复的确认信息，可在 rm 命令后跟上-f 参数来强制删除。

`rm -f linux.log`

- 6, dd 命令

dd 命令用于按照指定大小和个数的数据块来复制文件或转换文件，格式为“dd [参数]”。

- 7 file 命令

file 命令用于查看文件的类型，格式为“file 文件名”。

### 打包压缩与搜索命令

- 1, tar 命令

tar 命令用于对文件进行打包压缩或解压，格式为`tar [选项] [文件]`。

```plain
-c 创建压缩文件
-x 解开压缩文件
-t 查看压缩包内有哪些文件
-z 用 Gzip 压缩或解压
-j 用 bzip2 压缩或解压
-v 显示压缩或解压的过程
-f 目标文件名
-p 保留原始的权限与属性
-P 使用绝对路径来压缩
-C 指定解压到的目录
```

```plain
tar -czvf 压缩包名称.tar.gz 要打包的目录
tar -xzvf 压缩包名称.tar.gz 要解压的目录
tar -czvf etc.tar.gz /etc
tar xzvf etc.tar.gz -C /root/etc
```

-C 参数用于指定要解压到哪个指定的目录。-f 参数特别重要，它必须放到参数的最后一位，代表要压缩或解压的软件包名称。

- 2, grep 命令

grep 命令用于在文本中执行关键词搜索，并显示匹配的结果，格式为`grep [选项] [文件]`。

```plain
-b 将可执行文件（binary）当作文本文件（text）来搜索
-c 仅显示找到的行数
-i 忽略大小写
-n 显示行号
-v 反向选择—仅列出没有“关键词”的行
```

-n 参数用来显示搜索到信息的行号；-v 参数用于反选信息（即没有包含关键词的所有信息行）。

使用 grep 命令来查找出当前系统中不允许登录系统的所有用户信息:

`grep /sbin/nologin /etc/passwd`

- 3, find 命令

find 命令用于按照指定条件来查找文件，格式为“find [查找路径] 寻找条件 操作”。

```plain
-name 匹配名称
-perm 匹配权限（mode 为完全匹配，-mode 为包含即可）
-user 匹配所有者
-group 匹配所有组
-mtime -n +n 匹配修改内容的时间（-n 指 n 天以内，+n 指 n 天以前）
-atime -n +n 匹配访问文件的时间（-n 指 n 天以内，+n 指 n 天以前）
-ctime -n +n 匹配修改文件权限的时间（-n 指 n 天以内，+n 指 n 天以前）
-nouser 匹配无所有者的文件
-nogroup 匹配无所有组的文件
-newer f1 !f2 匹配比文件 f1 新但比 f2 旧的文件
--type
b/d/c/p/l/f
匹配文件类型（后面的字母参数依次表示块设备、目录、字符设备、管
道、链接文件、文本文件）
-size
匹配文件的大小（+50KB 为查找超过 50KB 的文件，而-50KB 为查找小
于 50KB 的文件）
-prune 忽略某个目录
-exec …… {}\; 后面可跟用于进一步处理搜索结果的命令（下文会有演示）
```

Linux 系统中的配置文件会保存到/etc 目录中（详见第 6 章）。如果要想获取到该目录中所有以 host 开头的文件列表，可以执行如下命令：

`find /etc -name "host*" -print`

## 第三章,管道符、重定向与环境变量

### 输入输出重定向

输入重定向是指把文件导入到命令中，而输出重定向则是指把原本要输出到屏幕的数据信息写入到指定文件中。

```plain
标准输入重定向（STDIN，文件描述符为 0）：默认从键盘输入，也可从其他文件或命令中输入。
标准输出重定向（STDOUT，文件描述符为 1）：默认输出到屏幕。
错误输出重定向（STDERR，文件描述符为 2）：默认输出到屏幕。
```

输入重定向中用到的符号及其作用:

```plain
命令 < 文件 				将文件作为命令的标准输入
命令 << 分界符 			从标准输入中读入，直到遇见分界符才停止
命令 < 文件 1 > 文件 2 	将文件 1 作为命令的标准输入并将标准输出到文件 2
```

输出重定向中用到的符号及其作用:

```plain
命令 > 文件 		将标准输出重定向到一个文件中（清空原有文件的数据）
命令 2> 文件 	将错误输出重定向到一个文件中（清空原有文件的数据）
命令 >> 文件 	将标准输出重定向到一个文件中（追加到原有内容的后面）
命令 2>> 文件 	将错误输出重定向到一个文件中（追加到原有内容的后面）
命令 >> 文件 2>&1或
命令 &>> 文件
				将标准输出与错误输出共同写入到文件中（追加到原有内容的后面）
```

### 管道命令符

```plain
找出被限制登录用户的命令是 grep "/sbin/nologin" /etc/passwd；
统计文本行数的命令则是 wc -l。
```

用翻页的形式查看/etc 目录中的文件列表及属性信息

`ls -l /etc/ | more`

### 命令行的通配符

```plain
通配符就是通用的匹配信息的符号，比如星号（*）代表匹配零个或多个字符，问号（?）代表匹配单个字符，中括号内加上数字[0-9]代表匹配 0～9 之间的单个数字的字符，而中括号内加上字母[abc]则是代表匹配 a、b、c 三个字符中的任意一个字符。

匹配所有在/dev 目录中且以 sda 开头的文件：

ls -l /dev/sda*

只想查看文件名为 sda 开头，但是后面还紧跟其他某一个字符的文件的相关信息.

ls -l /dev/sda?

除了使用[0-9]来匹配 0~9 之间的单个数字，也可以用[135]这样的方式仅匹配这三个指定
数字中的一个，若没有匹配到，则不会显示出来.

ls -l /dev/sda[0-9]
```

### 常用的转义字符

4 个最常用的转义字符：

```plain
反斜杠（\）：使反斜杠后面的一个变量变为单纯的字符串。
单引号（''）：转义其中所有的变量为单纯的字符串。
双引号（""）：保留其中的变量属性，不进行转义处理。
反引号（``）：把其中的命令执行后返回结果。
```

先定义一个名为 PRICE 的变量并赋值为 5，然后输出以双引号括起来的字符串与变量信息：

```plain
THREE=3
echo "I'm $THREE"
```

### 重要的环境变量

```plain
HOME 用户的主目录（即家目录）
SHELL 用户在使用的 Shell 解释器名称
HISTSIZE 输出的历史命令记录条数
HISTFILESIZE 保存的历史命令记录条数
MAIL 邮件保存路径
LANG 系统语言、语系名称
RANDOM 生成一个随机数字
PS1 Bash 解释器的提示符
PATH 定义解释器搜索用户执行命令的路径
EDITOR 用户默认的文本编辑器
```

以使用 export 命令将其提升为全局变量，这样其他用户也就可以使用它了

`export WORKDIR`

## 第四章,Vim编辑器与Shell命令脚本

### Vim文本编辑器

```plain
命令模式：控制光标移动，可对文本进行复制、粘贴、删除和查找等工作。
输入模式：正常的文本录入。
末行模式：保存或退出文档，以及设置编辑环境。

命令模式：
	a,i,o等键：输入模式
	：键		末行模式
	ESC返回命令模式
```

- Vim 中常用的命令：

```plain
dd 删除（剪切）光标所在整行
5dd 删除（剪切）从光标处开始的 5 行
yy 复制光标所在整行
5yy 复制从光标处开始的 5 行
n 显示搜索命令定位到的下一个字符串
N 显示搜索命令定位到的上一个字符串
u 撤销上一步的操作
p 将之前删除（dd）或复制（yy）过的数据粘贴到光标后面
```

- 末行模式中可用的命令：

```plain
:w 保存
:q 退出
:q! 强制退出（放弃对文档的修改内容）
:wq! 强制保存退出
:set nu 显示行号
:set nonu 不显示行号
:命令 执行该命令
:整数 跳转到该行
:s/one/two 将当前光标所在行的第一个 one 替换成 two
:s/one/two/g 将当前光标所在行的所有 one 替换成 two
:%s/one/two/g 将全文中的所有 one 替换成 two
?字符串 在文本中从下至上搜索该字符串
/字符串 在文本中从上至下搜索该字符串

```

- 配置主机名称：

1. 使用 Vim 编辑器修改“/etc/hostname”主机名称文件。
2. 把原始主机名称删除后追加“linuxprobe.com”。注意，使用 Vim 编辑器修改主机名称文件后，要在末行模式下执行:wq!命令才能保存并退出文档。
3. 保存并退出文档，然后使用 hostname 命令检查是否修改成

- 配置网卡信息：

1. 首先切换到/etc/sysconfig/network-scripts 目录中（存放着网卡的配置文件）。
2. 使用 Vim 编辑器修改网卡文件 ifcfg-eno16777736，逐项写入下面的配置参数并保存退出。由于每台设备的硬件及架构是不一样的，因此请读者使用 ifconfig 命令自行确认各自网卡的默认名称。 1  
2  
3  
4  
5  
6  
7  
8  
设备类型：TYPE=Ethernet  
地址分配模式：BOOTPROTO=static  
网卡名称：NAME=eno16777736  
是否启动：ONBOOT=yes  
IP 地址：IPADDR=192.168.10.10  
子网掩码：NETMASK=255.255.255.0  
网关地址：GATEWAY=192.168.10.1  
DNS 地址：DNS1=192.168.10.1
3. 重启网络服务并测试网络是否联通。进入到网卡配置文件所在的目录，然后编辑网卡配置文件，在其中填入下面的信息： 1  
2  
3  
4  
cd /etc/sysconfig/network-scripts/  
vim ifcfg-eno16777736  
systemctl restart network  
ping 192.168.10.10

- 配置Yum软件仓库

1. 进入到/etc/yum.repos.d/目录中（因为该目录存放着 Yum 软件仓库的配置文件）。
2. 使用 Vim 编辑器创建一个名为 rhel7.repo 的新配置文件（文件名称可随意，但后缀必须为.repo），逐项写入下面加粗的配置参数并保存退出（不要写后面的中文注释）。 1  
2  
3  
4  
5  
6  
[rh2l-media]:Yum 软件仓库唯一标识符，避免与其他仓库冲突。  
name=linuxprobe:Yum 软件仓库的名称描述，易于识别仓库用处。  
baseurl=file:///media/cdrom:提供的方式包括 FTP（ftp://..）、HTTP（http://..）、本地（file:///..）。  
enabled=1:设置此源是否可用；1 为可用，0 为禁用。  
gpgcheck=1:设置此源是否校验文件；1 为校验，0 为不校验。  
gpgkey=file:///media/cdrom/RPM-GPG-KEY-redhat-release:若上面参数开启校验，那么请指定公钥文件地址。
3. 按配置参数的路径挂载光盘，并把光盘挂载信息写入到/etc/fstab 文件中。 1  
2  
3  
4  
mkdir -p /media/cdrom  
mount /dev/cdrom /media/cdrom  
vim /etc/fstab  
yum install httpd
4. 使用“yum install httpd -y”命令检查 Yum 软件仓库是否已经可用

尝试使用 Yum 软件仓库来安装 Web 服务，出现 Complete！则代表配置正确.

### 编写Shell脚本

交互式（Interactive）：用户每输入一条命令就立即执行。

批处理（Batch）：由用户事先编写好一个完整的 Shell 脚本，Shell 会一次性执行脚本中诸多的命令。

echo $SHELL 输出当前命令终端解释器

- 编写简单的脚本： (查看当前所在工作路径并列出当前目录下所有的文件及属性信息)

```plain
#!/bin/bash
#For Example BY linuxprobe.com
pwd
ls -al
```

第一行的脚本声明（#!）用来告诉系统使用哪种 Shell 解释器来执行该脚本;

第二行的注释信息（#）是对脚本功能和某些命令的介绍信息;

第三、四行的可执行语句也就是我们平时执行的 Linux 命令了。

- 接收用户的参数：

内设的用于接受参数的变量：

```plain
$0 对应的是当前 Shell 脚本程序的名称
$# 对应的是总共有几个参数
$* 对应的是所有位置的参数值
$? 对应的是显示上一次命令的执行返回值
而$1、$2、$3……则分别对应着第 N 个位置的参数值
```

```plain
#!/bin/bash
#For Example BY linuxprobe.com
script's name is $0"
echo "All we have $# parameter, which is $*."
echo "The first parameter is $1, the fifth is $5."
```

#### 判断用户的参数

测试语句的格式： [ 条件表达式 ]

按照测试对象来划分，条件测试语句可以分为 4 种：

```plain
文件测试语句；
逻辑测试语句；
整数值比较语句；
字符串比较语句。
```

文件测试所用的参数：

```plain
-d 测试文件是否为目录类型
-e 测试文件是否存在
-f 判断是否为一般文件
-r 测试当前用户是否有权限读取
-w 测试当前用户是否有权限写入
-x 测试当前用户是否有权限执行
```

面使用文件测试语句来判断/etc/fstab 是否为一个目录类型的文件，然后通过 Shell 解释器的内设$?变量显示上一条命令执行后的返回值。如果返回值为 0，则目录存在；如果返回值为非零的值，则意味着目录不存在：

```plain
[ -d /etc/fstab ]
echo $?
```

再使用文件测试语句来判断/etc/fstab 是否为一般文件，如果返回值为 0，则代表文件存在，且为一般文件：

```plain
[root@linuxprobe ~]# [ -f /etc/fstab ]
[root@linuxprobe ~]# echo $?
```

在 Shell终端中逻辑“与”的运算符号是&&，它表示当前面的命令执行成功后才会执行它后面的命令.

判断/dev/cdrom 文件是否存在，若存在则输出 Exist 字样。

`[ -e /dev/cdrom ] && echo "Exist"`

逻辑“或”，它在 Linux 系统中的运算符号为||，表示当前面的命令执行失败后才会执行它后面的命令.

“非”，在 Linux 系统中的运算符号是一个叹号（！），它表示把条件测试中的判断结果取相反值。

来结合系统环境变量 USER 来判断当前登录的用户是否为非管理员身份：

```plain
echo $USER
[ $USER = root ] || echo "user"
[ ! $USER = root ] || echo "user"

[ ! $USER = root ] && echo "user" || echo "root"
```

可用的整数比较运算符：

```plain
-eq 是否等于
-ne 是否不等于
-gt 是否大于
-lt 是否小于
-le 是否等于或小于
-ge 是否大于或等于
```

10 是否大于 10 以及 10 是否等于 10（通过输出的返回值内容来判断）：

```plain
[ 10 -gt 10]
[ 10 -eq 10 ]
```

来先使用 free -m 命令查看内存使用量情况（单位为 MB），然后通过 grep Mem:命令过滤出剩余内存量的行，再用 awk ‘{print $4}’命令只保留第四列，最后用 FreeMem=`语句`的方式把语句内执行的结果赋值给变量。

```plain
FreeMem=`free -m | grep Mem: | awk '{print $4}'`
```

使用整数运算符来判断内存可用量的值是否小于 1024，若小于则会提示“Insufficient Memory”（内存不足）的字样：

`[ $FreeMem -lt 1024 ] && echo "Insufficient Memory"`

字符串比较语句用于判断测试字符串是否为空值，或两个字符串是否相同。它经常用来判断某个变量是否未被定义（即内容为空值）

```plain
= 比较字符串内容是否相同
!= 比较字符串内容是否不同
-z 判断字符串内容是否为空
```

过判断 String 变量是否为空值，进而判断是否定义了这个变量。`[ -z $String]`

### 流程控制语句

- if 语句

```plain
if 条件测试操作
	then 命令序列
fi

#!/bin/bash
DIR="/media/cdrom"
if [ ! -e $DIR ]
then
mkdir -p $DIR
fi

判断是否创建成功：

bash mkcdrom.sh
ls -d /media/cdrom

if 条件测试操作
	then 命令序列1
	else 命令序列2
fi

if 条件测试操作1
	then 命令序列1
elif 条件测试操作2
	then 命令序列2
else
	命令序列3
fi
```

使用双分支的 if 条件语句来验证某台主机是否在线，然后根据返回值的结果，要么显示主机在线信息，要么显示主机不在线信息。

脚本主要使用 ping 命令来测试与对方主机的网络联通性，而 Linux 系统中的 ping 命令不像 Windows 一样尝试 4 次就结束，因此为了避免用户等待时间过长，**需要通过-c 参数来规定尝试的次数，并使用-i 参数定义每个数据包的发送间隔，以及使用-W 参数定义等待超时时间。**

```plain
#!/bin/bash
ping -c 3 -i 0.2 -w 3 $1 &> /dev/null
if [ $? -eq 0 ]
then
echo "Host $1 is On-line."
else
echo "Host $1 is Off-line"
fi

Test:bash chkhost.sh 192.168.10.10
```

read 是用来读取用户输入信息的命令，能够把接收到的用户输入信息赋值给后面的指定变量，-p 参数用于向用户显示一定的提示信息。

```plain
#!/bin/bash
read -p "Enter your score (0-100): " GRADE
```

- for 条件循环语句：

```plain
for 变量名 in 取值列表
do
	命令序列
done
```

来编写 Shell 脚本 Example.sh。在脚本中使用 read 命令读取用户输入的密码值，然后赋值给 PASSWD 变量，并通过-p 参数向用户显示一段提示信息，告诉用户正在输入的内容即将作为账户密码。在执行该脚本后，会自动使用从列表文件 users.txt 中获取到所有的用户名称，然后逐一使用“id 用户名”命令查看用户的信息，并使用$?判断这条命令是否执行成功，也就是判断该用户是否已经存在。

`/dev/null 是一个被称作 Linux 黑洞的文件，把输出信息重定向到这个文件等同于删除数据（类似于没有回收功能的垃圾箱`

```sh
#/bin/bash
read -p "Enter The Users Password : " PASSWD
for UNAME in `cat users.txt`
do
id $UNAME &> /dev/null
if [ $? -eq 0 ]
then
echo "Already exists"
else
useradd $UNAME &> /dev/null
## 存在疑问
echo "$PASSWD" | passwd --stdin $UNAME &> /dev/null
## passwd --stdin? 这是一条修改密码的命令，为$UNAME用户的密码修改为$PSSWD。
if [ $? -eq 0 ]
then
echo "$UNAME, Create success"
else
echo "$UNAME, Create failure"
fi
fi
done
```

让脚本从文本中自动读取主机列表，然后自动逐个测试这些主机是否在线。

```plain
#!/bin/bash
HLIST = $(cat ~/ipadds.txt)
for IP in $HLIST
do
ping -c 3 -i 0.2 -w 3 $IP &> /dev/null
if [ $? -eq 0 ] ; then
echo "Host $IP is On-line."
else
echo "Host $IP is Off-line."
fi
done

192.168.10.10
192.168.10.11
192.168.10.12

```

- while 条件循环语句

```plain
while 条件测试操作
do
	命令序列
done

exit 0 退出循环

#!/bin/bash
PRICE=$(expr $RANDOM % 1000)
TIMES=0
echo "商品实际价格为 0-999 之间，猜猜看是多少？"
while true
do
read -p "请输入您猜测的价格数目：" INT
let TIMES++
if [ $INT -eq $PRICE ] ; then
echo "恭喜您答对了，实际价格是 $PRICE"
echo "您总共猜 g $TIMES 次"
exit 0
elif [ $INT -gt $PRICE ] ; then
echo "太高了！"
else
echo "太低了！"
fi
done

```

- case 条件测试语句

```plain
case 变量值 in
模式1)
	命令序列 1
	;;
模式2)
	命令序列 2
	;;
	......
*)
	默认命令序列
esac

#!/bin/bash
read -p "请输入一个字符，并按 Enter 键确认：" KEY
case "$KEY" in
[a-z]|[A-Z])
echo "您输入的是 字母。"
;;
[0-9])
echo "您输入的是 数字。"
;;
*)
echo "您输入的是 空格、功能键或其他控制字符。"
esac
[root@linuxprobe ~]# bash Checkkeys.sh
请输入一个字符，并按 Enter 键确认：6
您输入的是 数字。
[root@linuxprobe ~]# bash Checkkeys.sh
请输入一个字符，并按 Enter 键确认：p
您输入的是 字母。
[root@linuxprobe ~]# bash Checkkeys.sh
请输入一个字符，并按 Enter 键确认：^[[15~
您输入的是 空格、功能键或其他控制字符。

```

### 计划任务服务程序

```plain
at 时间

查看已设置好但还未执行的一次性计划任务： at -l

删除： atrm 任务序号

```

将系统设置为在今晚 23:30 分自动重启网站服务。

```plain
at 23:30

at > systemctl restart httpd

at > 此处请同时按下 Ctrl + D 组合键来结束编写计划任务

echo "systemctl restart httpd" | at 23:30

```

能够周期性地、有规律地执行某些具体的任务：

```plain
创建、编辑计划任务的命令为“crontab -e”
查看当前计划任务的命令为“crontab -l”
删除某条计划任务的命令为“crontab -r”
如果您是以管理员的身份登录的系统，还可以在 crontab 命令中加上-u 参数来编辑他人的计划任务。

在 crond 服务的计划任务参数中，所有命令一定要用绝对路径的方式来写

如果不知道绝对路径，请用 whereis 命令进行查询，rm 命令路径为下面输出信息中加粗部分。

格式为：分、时、日、月、星期 命令
(需要注意的是，如果有些字段没有设置，则需要使用星号（*）占位)

使用 crond 设置任务的参数字段说明:

分 取值为 0～59 的整数
时 取值为 0～23 的任意整数
日 取值为 1～31 的任意整数
月 取值为 1～12 的任意整数
星期 取值为 0～7 的任意整数，其中 0 与 7 均为星期日
命令 要执行的命令或程序脚本
```

假设在每周一、三、五的凌晨 3 点 25 分，都需要使用 tar 命令把某个网站的数据目录进行打包处理，使其作为一个备份文件。

```plain
crontab -e
no crontab for root - using an empty one
crontab: installing new crontab
```

需要说明的是，除了用逗号（,）来分别表示多个时间段，例如“8,9,12”表示 8 月、9 月和 12 月。还可以用减号（-）来表示一段连续的时间周期（例如字段“日”的取值为“12-15”，则表示每月的 12～15 日）。以及用除号（/）表示执行任务的间隔时间（例如`*/2`表示每隔2 分钟执行一次任务）

如果在 crond 服务中需要同时包含多条计划任务的命令语句，应每行仅写一条。

每周一至周五的凌晨 1 点钟自动清空/tmp 目录内的所有文件。

```plain
whereis em
crontab -e
crontab -l
25 3 * * 1,3,5 /usr/bin/tar -czvf backup.tar.gz /home/wwwroot
0 1 * * 1-5 /usr/bin/rm -rf /tmp/*
```

## 第五章,用户身份与文件权限

### 用户身份与能力

- useradd 命令

useradd 命令用于创建新的用户，格式为“useradd [选项] 用户名”。

```plain
-d 指定用户的家目录（默认为/home/username）
-e 账户的到期时间，格式为 YYYY-MM-DD.
-u 指定该用户的默认 UID
-g 指定一个初始的用户基本组（必须已存在）
-G 指定一个或多个扩展用户组
-N 不创建与用户同名的基本用户组
-s 指定该用户的默认 Shell 解释器
```

创建一个普通用户并指定家目录的路径、用户的 UID 以及 Shell 解释器。在下面的命令中，请注意/sbin/nologin，它是终端解释器中的一员，与 Bash 解释器有着天壤之别。一旦用户的解释器被设置为 nologin，则代表该用户不能登录到系统中：

```plain
useradd -d /home/linux -u 8888 -s /sbin/nologin linuxtest
id linuxtest
```

- groupadd 命令

groupadd 命令用于创建用户组，格式为“groupadd [选项] 群组名”。

`groupadd ronny`

- usermod 命令

usermod 命令用于修改用户的属性，格式为“usermod [选项] 用户名”。

```plain
-c 填写用户账户的备注信息
-d -m 参数-m 与参数-d 连用，可重新指定用户的家目录并自动把旧的数据转移过去
-e 账户的到期时间，格式为 YYYY-MM-DD
-g 变更所属用户组
-G 变更扩展用户组
-L 锁定用户禁止其登录系统
-U 解锁用户，允许其登录系统
-s 变更默认终端
-u 修改用户的 UID
```

后将用户 linuxprobe 加入到 root 用户组中，这样扩展组列表中则会出现 root 用户组的字样，而基本组不会受到影响。

`usermod -G root linuxprobe`

用-u 参数修改 linuxprobe 用户的 UID 号码值。

`usermod -u 8888 linuxprobe`

- passwd 命令

passwd 命令用于修改用户密码、过期时间、认证信息等，格式为`passwd [选项] [用户名]`。

```plain
-l 锁定用户，禁止其登录
-u 解除锁定，允许用户登录
--stdin 允许通过标准输入修改用户密码，如 echo "NewPassWord" | passwd --stdinUsername
-d 使该用户可用空密码登录系统
-e 强制用户在下次登录时修改密码
-S 显示用户的密码是否被锁定，以及密码所采用的加密算法名称

修改自己的密码：passwd
修改别人的密码：passwd linuxprobe
锁定别人的账号：passwd -l linuxprobe

```

- userdel 命令

userdel 命令用于删除用户，格式为“userdel [选项] 用户名”。

```plain
-f 强制删除用户
-r 同时删除用户及用户家目录
```

### 文件权限与归属

Linux文件类型：

```plain
-：普通文件。
d：目录文件。
l：链接文件。
b：块设备文件。
c：字符设备文件。
p：管道文件。

可读（r）、可写（w）、可执行（x）
分别用数字 4、2、1 来表示

在有这样一个文件，其所有者拥有可读、可写、可执行的权限，其文件所属组拥有可读、可写的权限；而且其他人只有可读的权限。那么，这个文件的权限就是 rwxrw-r--，数字法表示即为 764。
```

### 文件的特殊权限

文件最大的 777 权限（rwxrwxrwx）

- SUID

SUID 是一种对二进制程序进行设置的特殊权限，可以让二进制程序的执行者临时拥有属主的权限（仅对拥有执行权限的二进制程序有效）。

查看 passwd 命令属性时发现所有者的权限由 rwx 变成了 rws，其中 x 改变成 s 就意味着该文件被赋予了 SUID 权限。

- SGID

SGID 主要实现如下两种功能：

让执行者临时拥有属组的权限（对拥有执行权限的二进制程序进行设置）  
在某个目录中创建的文件自动继承该目录的用户组（只可以对目录进行设置。

SGID 的第一种功能是参考 SUID 而设计的，不同点在于执行程序的用户获取的不再是文件所有者的临时权限，而是获取到文件所属组的权限。

chmod : 设置文件或目录的权限 `chmod[参数] 权限 文件或目录名称 chmod -Rf 777 testdir/`

chown : 以设置文件或目录的所有者和所属组 `chown [参数] 所有者:所属组 文件或目录名称`。

`chown root:bin test`

录进行操作时需要加上大写参数-R 来表示递归操作，即对目录内所有的文件进行整体操作。

- SBIT

SBIT 特殊权限位可确保用户只能删除自己的文件，而不能删除其他用户的文件。

当目录被设置 SBIT 特殊权限位后，文件的其他人权限部分的 x 执行权限就会被替换成 t 或者 T，原本有 x 执行权限则会写成 t，原本没有 x 执行权限则会被写成 T。

`chmod -R o+t linux/`

### 文件的隐藏属性

- chattr

chattr 命令用于设置文件的隐藏权限，格式为“chattr [参数] 文件”。

chattr 命令中用于隐藏权限的参数及其作用：

```plain
i 无法对文件进行修改；若对目录设置了该参数，则仅能修改其中的子文件内容而不能新建或删除文件
a 仅允许补充（追加）内容，无法覆盖/删除内容（Append Only）
S 文件内容在变更后立即同步到硬盘（sync）
s 彻底从硬盘中删除，不可恢复（用 0 填充原文件所在硬盘区域）
A 不再修改这个文件或目录的最后访问时间（atime）
b 不再修改文件或目录的存取时间
D 检查压缩文件中的错误
d 使用 dump 命令备份时忽略本文件/目录
c 默认将文件或目录进行压缩
u 当删除该文件后依然保留其在硬盘中的数据，方便日后恢复
t 让文件系统支持尾部合并（tail-merging）
X 可以直接访问压缩文件中的内容
```

- lsattr 命令

lsattr 命令用于显示文件的隐藏权限，格式为“lsattr [参数] 文件”。

```plain
ls -al Linuxprobe #不能看到隐藏的权限
lsattr linuxprobe #能看懂隐藏的权限
```

### 文件访问控制列表：

- setfacl 命令

setfacl 命令用于管理文件的 ACL 规则，格式为“setfacl [参数] 文件名称”。

其中，针对目录文件需要使用-R 递归参数；针对普通文件则使用-m 参数；如果想要删除某个文件的 ACL，则可以使用-b 参数。

文件的权限最后一个点（.）变成了加号（+）,这就意味着该文件已经设置了 ACL 了。

- getfacl 命令

getfacl 命令用于显示文件上设置的 ACL 信息，格式为“getfacl 文件名称”。

`getfacl /root`

### su命令与sudo命令

从管理员切换到普通用户： `su - linuxprobe`

su 命令与用户名之间有一个减号（-），这意味着完全切换到新的用户，即把环境变量信息也变更为新用户的相应信息，而不是保留原始的信息。强烈建议在切换用户身份时添加这个减号（-）。

也可以使用 exit 来返回root权限

sudo 命令用于给普通用户提供额外的权限来完成原本 root 管理员才能完成的任务，格式为“sudo [参数] 命令名称”。

```plain
-h 列出帮助信息
-l 列出当前用户可执行的命令
-u 用户名或 UID 值 以指定的用户身份执行命令
-k 清空密码的有效时间，下次执行 sudo 时需要再次进行密码验证
-b 在后台执行指定的命令
-p 更改询问密码的提示语

限制用户执行指定的命令：
记录用户执行的每一条命令；
配置文件（/etc/sudoers）提供集中的用户管理、权限与主机等参数；
验证密码的后 5 分钟内（默认值）无须再让用户再次验证密码。

部分权限：

visudo

96 ##
97 ## Allow root to run any commands anywhere
98 root ALL=(ALL) ALL
99 linuxprobe ALL=(ALL) /usr/bin/cat

不用输入一次密码：

whereis poweroff
poweroff: /usr/sbin/poweroff /usr/share/man/man8/poweroff.8.gz

visudo

………………省略部分文件内容………………
96 ##
97 ## Allow root to run any commands anywhere
98 root ALL=(ALL) ALL
99 linuxprobe ALL=NOPASSWD: /usr/sbin/poweroff
………………省略部分文件内容………………
```