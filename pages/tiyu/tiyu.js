// pages/tiyu/tiyu.js
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseList: [],
    name:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    db.collection('course').where({
      type: 'tiyu'
    }).get().then(res=>{
          // res.data 是包含以上定义的两条记录的数组
          console.log(res.data)
          this.setData({
            courseList: res.data
          })
        })
  },

  getDetail: function(event){
    wx.navigateTo({
      url: `../searchoutcome/searchoutcome?courseid=${event.target.dataset.courseid}`,
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
