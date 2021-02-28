const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect("mongodb+srv://Shantanu:Test@123@cluster0.guvbr.mongodb.net/list", { useNewUrlParser: true, useUnifiedTopology: true});
//mongoose.connect("mongodb://localhost:27017/todolist", { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

const listSchema = new mongoose.Schema({
  task:{type:String, required:[true,'give a name to the task']}
});
const DailyTask = mongoose.model("dailyTask", listSchema);

const customSchema = new mongoose.Schema({
  name:String,
  list:[listSchema]
});
const List = mongoose.model("customTasks", customSchema);

var app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.get("/", function(req, res){
  var allLists = [];
  List.find({},{},{},function (err, result) {
    if(!err){
      result.forEach(function (item) {
        allLists.push(item.name);
        //console.log(item.name);
      });
    }
  });

  DailyTask.find({},{},{}, function (err, dailyTasks) {
    if (err) {
      //console.log(err);
    } else {
      //console.log("getting daily tasks, total tasks in the list- " + dailyTasks.length);
      res.render('list', {kindofday:dailyTasks, titlename:"Daily", everyList:allLists});
    }
  });
});

app.get("/:topic", function(req, res){
  var tableName = _.capitalize(req.params.topic);

  var allLists = [];
  List.find({},{},{},function (err, result) {
    if(!err){
      result.forEach(function (item) {
        allLists.push(item.name);
        //console.log(item.name);
      });
    }
  });

  List.findOne({name:tableName}, function (err, foundList) {
    if(!err){
      if(!foundList){
        const list = new List({
          name:tableName,
          list:[]
        });

        list.save();
        allLists.push(tableName);
        res.render('list', {kindofday:list.list, titlename:list.name, everyList:allLists});

      } else {
        res.render('list', {kindofday:foundList.list, titlename:foundList.name, everyList:allLists});
      }
    }
  });

});

app.post("/", function(req, res){
  const taskname = req.body.fname;
  const listName = req.body.button;

  const task = new DailyTask({
      task:taskname
    });

  if(listName==="Daily") {
    //console.log("posting daily - " + task.task);
    const promise =task.save();
    promise.then(function (doc) {
      res.redirect("/");
    });

    //res.redirect("/");
  } else {
    //console.log("inside");
    List.findOne({name:listName}, function (err, foundList) {
      if(!err){
        foundList.list.push(task);
        foundList.save();
        res.redirect("/"+listName);
      }
    });
  }

});

app.post("/createlist", function(req, res){
  var lstname = req.body.fname;
  res.redirect("/"+lstname);
});

app.post("/delete", function(req, res){
  var tsk = req.body.chk;
  var lstname = req.body.listName;

  if (lstname === "Daily"){
    DailyTask.findByIdAndRemove(tsk, function (err) {
      if (!err) {
        res.redirect("/");
      } else {
      }
    });
  } else {
    List.findOneAndUpdate({name:lstname}, {$pull:{list:{_id:tsk}}}, function (err, result) {
      if (!err) {
        res.redirect("/" + lstname);
      }
    });
  }

});

app.listen(process.env.PORT || 3000, function(){
  //console.log("running");
});
