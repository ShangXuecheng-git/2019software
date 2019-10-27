Page({
  onTap:function(){
   wx.navigateTo({       //页面跳转，左上角有返回
     url: '../search/search',
   })
   /*
   wx.redirectTo({
     url: '../search/search',
   })页面跳转，左上角无法返回，二者生命周期不同
   */
  }
})
