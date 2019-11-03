// pages/searchoutcome/searchoutcome.js
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseid: -1,  //当前课程的id
    name:'',      //课程名称
    score: 0,     //课程评分
    teacher:'',   //教师
    checked: true,   //表示复选框是否被选中
    checked2: true,
    openid:'',     //评论者的openid
    nickname:'',   //评论者的昵称
    userTx:'',     //评论者的头像
    content:'',    //评价的内容
    value: 5,      //用户评分
    newscore: 0,   //新的评分
    images: [],    //要上传的图片
    fileIds:[],    //记录到数据库的fileid
    commentList: []    //关于这个课程的评论列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    this.setData({
      courseid: options.courseid
    });
    db.collection('course').where({
      _id: options.courseid
    }).get().then(res => {
      // res.data 是包含以上定义的两条记录的数组
      console.log(res.data)
      this.setData({
        name: res.data[0].name,
        score: res.data[0].score,
        teacher:res.data[0].teacher
      })
    });
    db.collection('comment').where({
      courseid: options.courseid,
    }).get().then(res2 => {
      console.log('res2',res2),
      this.setData({
        commentList: res2.data,
      })
    })
  },
  /**
   * 复选框1：是否匿名
   */
  onChange: function(event) {
    this.setData({
      checked: event.detail
    });
  },
  /**
   * 复选框2：是否上过
   */
  onChange2: function(event) {
    this.setData({
      checked2: event.detail
    });
  },
  /**
   * 将页面的评论内容赋值给content
   */
  onContentChange: function(event){
    this.setData({
      content:event.detail
    })
  },
  /**
   * 将页面的评分赋值给value
   */
  onScoreChange: function(event){
    this.setData({
      value: event.detail
    });
  },
  /**
   * 上传图片
   */
  uploadImg: function(){
    //选择图片
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // tempFilePath可以作为img标签的src属性显示图片
        const tempFilePaths = res.tempFilePaths
        console.log(tempFilePaths);
        this.setData({
          images: this.data.images.concat(tempFilePaths)
        })
      }
    })
  },
  /**
   * 实现浮点数保留一位小数的功能
   */
  toFixed :function(x) {
    var f = parseFloat(x);
    if(isNaN(f)) {
  return;
  }
  f = Math.round(x * 10) / 10;
  return f;        
  },
 /**
   * 提交评论
   */
  submit: function(e){
    console.log('e',e);
    wx.showLoading({
      title: '评论中',
    })
    console.log(this.data.content,this.data.value,this.data.courseid);
    //上传图片到云存储
    let promiseArr = [];
    for(let i = 0; i < this.data.images.length; i++){
      promiseArr.push(new Promise((reslove, reject) => {
        let item = this.data.images[i];
        let suffix = /\.\w+$/.exec(item)[0];//正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix,
          filePath: item, // 文件路径
          success: res => {
            // get resource ID 返回文件id
            console.log(res.fileID)
            this.setData({
              fileIds: this.data.fileIds.concat(res.fileID)
            });
            reslove();
          },
          fail: err => {
            // handle error
          }
        })
      }));
    }//end for
    //文件上传到云存储全部成功后，开始执行下面的代码：插入数据到数据库
    Promise.all(promiseArr).then(res => {
      //插入数据
      //1、先调用云函数获取当前用户的openid
      wx.cloud.callFunction({
        name:'login',
        complete:res=> {
          console.log('调用云函数获取到的openid：',res.result.openid)
          this.setData({
            openid: res.result.openid
          })
        }
      })
      //2、根据得到的用户openid查询到当前用户的头像、昵称等信息
      this.setData({
        nickname: e.detail.userInfo.nickName,
        userTx: e.detail.userInfo.avatarUrl
      })
      //3、将信息插入到数据库中
      var date = new Date();
      db.collection('comment').add({
        data:{
          content: this.data.content,
          score: this.data.value,
          courseid: this.data.courseid,
          createtime: date.getFullYear().toString() + '-' + (date.getMonth()+1).toString() + '-' + date.getDate().toString(),
          fileIds: this.data.fileIds,
          nickname: this.data.nickname,
          userTx: this.data.userTx
        }
      }).then(res=>{
        wx.hideLoading();
        wx.showToast({
          title: '评价成功',
        })
      }).catch(err=>{
        wx.hideLoading();
        wx.showToast({
          title:'评价失败',
        })
      })
      //计算评分
      db.collection('comment').where({
        courseid: this.data.courseid,
      }).get().then(res => {
        this.setData({
          commentList: res.data,
        })
        let sum = 0;
        for (let i = 0; i < this.data.commentList.length; i++) {
          sum = this.data.commentList[i].score + sum
        }
        console.log('sum',sum);
        this.setData({
          newscore : this.toFixed(sum / (this.data.commentList.length))
        })
        //更新评分
        wx.cloud.callFunction({
          name: 'update',
          data: {
            newscore: this.data.newscore.toString(),
            courseid: this.data.courseid,
          }
        }).then(res => {
          console.log('云结果', res);
        })
        console.log('newscore', this.data.newscore);
      })     
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})