---
title: Head First Javascript笔记
date: January 1st 2019
tags: [JavaScript, 笔记, 编程基础]
summary: Head First JavaScript 入门学习笔记，记录变量声明、定时器、DOM 操作、函数等 JavaScript 基础语法要点。
---

# Head First Javascript笔记

# JavaScript

Hello World.  
Go to a new world again.

## Begin

The first program:

```java
setTimeout(wakeUpUser, 5000)
function wakeUpUser(){
	alert("Yep! love you!!! honny.")
}
```

```java
var skater;
var age = 20;
var name = "threezh1";
var isBoy = ture/false;
//This will not show for others.

document.write("Hello World.");

console.log("Just like history?");

<script src="mycode.js"></script>

GetUserEnter = prompt("Please enter whatever you want to say!");
document.write(GetUserEnter);

//Get a random.This will return a number in (0~1)
var randomLoc = Math.random();
//If you want get a number in (0~5 haven't 5 like 4.999...)
var randomLoc = Math.random() * 5;
//Get a complete number:
var randomLoc = Math.floor(Math.random() * 5);

```

## Function

```java

function threezh1(varchar, number){
	alert("What you wanna to say.");
	alert("This is the first parameter:" + varchar);
	alert("This is the second parameter:" + varchar);
	return 0;
}

threezh1("Hello World.", 33);

// If a variable is created in outside the function, it is a global variable.

// You can use a variable as a function name.
var func = function(num){
	...
}
func(3);

// No name
window.onload = function() { alert("Yeah, that page loaded/1");};

```

## Array

```java

var scores = [10, 20, 33, 50, 60];

var myscore = scores[2];

scores.length

// Create a array object

var emptyArray = new Array();
emptyArray[0] = 33;

```

## Object

```java

// Create a object and use it.

var threezh1 = {
	name: "threezh1",
	age: 20,
	color: "yellow",
	speed: 20
	skate: function(){
		document.write("I like play skate!");
		if (this.speed > 20){
			alert("Your speed is too fast!");
		}
	}
};
var myname = threezh1.name;
document.write(myname);
threezh1.skate();

// Create a object.
function Dog(name, breed, weight){
	this.name = name;
	this.breed = bread;
	this.weight = weight;
}
var fido = new Dog("Fido", "Mixed", 38);

// Delete a attribute.
delete fido.weight;

// Add a attribute.
fido.trust = function(person) {
	...
}

```

## DOM

This is a very important content.

```java

// Get a HtmlElement:
var access = document.getElementById("id_name");
var code = access.innerHTML;
alert(code);
// The "code" is the text of label who id = id_name.
// Ps: This codes should be put after the element.

// Change the text of a label:
access.innerHTML = "Some other words what you wanna change!";

// If you wanna use a callback function. you can use the window.onload.
<script>
function init(){
	var access = document.getElementById("id_name");
	var code = access.innerHTML;
	alert(code);
}
window.onload = init;
</script>

// Also, you can us setArribute to change the parameter in the table.
access.setArribute("class", "redtext");
var ia_name = access.getArribute("id");

```

## others

```java

// Judge a variable's type:
type = tyepof(variable);

if (something == null){
	...
}

// NaN, isn't a number.
if (isNaN(variable) == ture){
	alert("This isn't a number.");
}

==	equal
===	absolutely equal

// String's length
var length = somewords.length

// Split the string:
stringarray = somewords.charAt

// find a word in a string and return a index of this word.
var index = somewords.indexOf("otherword");

// Get a word  in two index.
var val = somewords.substring(5, 10);

// Split a string by a word.
var vals = somewords.split("|");

...

// Add a act when the element be clicked.

window.onload = init;
function init(){
	var image = document.getElementById("zero");
	image.onclick = showAnswer;
}
function showAnswer(){
	...
}

// Add more act when one of  elements be clicked.

var images = document.getElementByTagName("img");
for (var i = 0; i < images.length; i++){
	images[i].onclick = showAnswer;
}

function showAnswer(eventObj){
	var image = eventObj.target;//taget can get the name of the element.
}

// Time:

var now = new Date();
var dateString = now.toString();
var theYear = now.getFullYear();
var theDayOfWeek = now.getDay();

var birthday = new Date("May 1, 2019 08:03 pm");

// Array

```