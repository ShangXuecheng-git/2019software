// pages/Search/Search.js
const db = wx.cloud.database();

Page({

  data: {
    centent_Show: true,
    searchValue: '',   //用户在搜索框内输入的内容
    goodList: [],      //搜索结果列表
    hasResult: true,   //是否有搜索结果
    historyList: [],   //历史搜索列表
    hasInput: true,    //用户是否输入内容
    img: '',
    nanshen_card: '',
    /* 测试数据*/
  },

  /**
   * 监听页面加载
   */
  onLoad: function () {
    this.setData({
      historyList: wx.getStorageSync('historyList') || []
    })
  },

  /**
  * 将页面input数据赋值给data: searchValue
  */
  searchValueInput: function (e) {
    var value = e.detail.value;
    this.setData({
      searchValue: value,
    });
  },

  /**
   * 课程关键字模糊搜索
   */
  search: function(e){
    //将搜索的内容存到历史搜索中，仅保留10条数据，并且用户没有输入时候不保存
    var searchValue = this.data.searchValue
    console.log("查询：",searchValue)
    var historyList = wx.getStorageSync('historyList')||[]
    if(historyList.length < 10 && searchValue != ""){
      var flag = 0;
      for(let i = 0; i < historyList.length; i++){ 
        if(historyList[i] == searchValue){
          flag = 1;
        }
      }
      if(flag == 0){
        historyList.unshift(searchValue)
      }
    }else if(historyList.length >= 10 && searchValue != ""){
      var flag = 0;
      for (let i = 0; i < historyList.length; i++) {
        if (historyList[i] == searchValue) {
          flag = 1;
        }
      }
      if (flag == 0) {
        historyList.unshift(searchValue)
        historyList.pop()
      }
    };
    try {
      console.log("保存输入内容到hsitoryList ",historyList.length)
      wx.setStorageSync('historyList', historyList)
      this.setData({
        historyList: historyList
      })
    } catch (e) { 
      console.log("e:",e)
    }
    //重新给hasResult赋值为true，默认有搜索结果
    this.setData({
      hasResult: true,
      hasInput: true
    })
    wx.showLoading({
      title: '正在搜索',
      mask: true,
    })
    //重新给数组赋值为空
    this.setData({
      goodList: []
    })
    if(searchValue != ""){
      //数据库正则对象
      db.collection('course').where({
        name: db.RegExp({
          regexp: searchValue,  //作为关键字进行匹配
          options: 'i',   //不区分大小写
        })
      }).get().then(res => {
        console.log("数据库查询返回res：", res)
        if (res.data.length == 0) {
          wx.hideLoading();
          this.setData({
            hasResult: false,
          })
        }
        for (var i = 0; i < res.data.length; i++) {
          var name = "goodList[" + i + "].name"
          var score = "goodList[" + i + "].score"
          var teacher = "goodList[" + i + "].teacher"
          this.setData({
            [name]: res.data[i].name,
            [score]: res.data[i].score,
            [teacher]: res.data[i].teacher
          })
          console.log(this.data.goodList[i].name)
          wx.hideLoading();
        }
      }).catch(err => {
        console.error(err)
        wx.hideLoading();
      })
    }else{
      wx.hideLoading();
      this.setData({
        hasInput: false,
      })
    }
    //将用户的搜索内容插入到数据库中
    db.collection('search').where({
      name: searchValue
    }).get().then(res=>{
      if(res.data.length == 0){
        db.collection('search').add({
          data:{
            name: searchValue,
            num: 1
          },
          success: res=>{
            console.log("已经插入新的搜索词",res)
          },
          fail: err=>{
            console.log("插入新的搜索词失败",err)
          }
        })
      }//end if
      else{
        console.log("这个热词当前的搜索数为",res)
        var num = res.data[0].num
        wx.cloud.callFunction({
          name: 'updateNum',
          data: {
            name: searchValue,
            num: ++num
          },
          success: res => {
            console.log("云函数updateNum执行成功", res)
          },
          fail: res => {
            console.log("云函数updateNum执行失败", err)
          }
        })//end callFunction
      }//end else
    })
  },

  /**
   * 清空搜索框数据
   */
  clear: function(){
    this.setData({
      searchValue: ""
    })
  },

  /**
   * 清空历史记录
   */
  clearHistory:function(){
    wx.removeStorageSync('historyList')
    this.setData({
      historyList:[]
    })
  },

  suo: function(e) {
    var id = e.currentTarget.dataset.id
    var program_id = app.program_id;
    var that = this;
    wx.request({
      url: 'aaa.php', //这里填写后台给你的搜索接口
      method: 'post',
      data: {
        str: that.data.searchValue,
        program_id: program_id,
        style: id
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res) {
        if (res.data.length == 0) {
          that.setData({
            centent_Show: false,
          });
        }
        that.setData({
          nanshen_card: res.data,
        });
      },
      fail: function(e) {
        wx.showToast({
          title: '网络异常！',
          duration: 2000
        });
      },
    });
  },
  /*测试函数 */
 
})