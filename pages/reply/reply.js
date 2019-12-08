// pages/reply/reply.js
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    commentid: '', //当前页面对应的评论id
    person: '',    //当前评论的写作者
    content: '',   //当前评论的内容
    score: 0,     //当前评论的评分
    createTime: '',   //当前评论的创建时间
    replyList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      commentid: options.commentid,
      person: options.person
    })
    //查询当前评论的信息
    db.collection('comment').where({
      _id: this.data.commentid
    }).get().then(res=>{
      this.setData({

      })
    })
    //查询当前对这条评论的回复列表
    db.collection('reply').where({
      commentid: this.data.commentid
    }).get().then(res=>{
      console.log("查询reply返回结果：", res),
        this.setData({
          replyList: res.data
        })
    })
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
