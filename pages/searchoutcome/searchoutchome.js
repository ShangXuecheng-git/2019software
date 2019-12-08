// pages/searchoutcome/searchoutcome.js
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    courseid: -1,  //当前课程的id
    name: '',      //课程名称
    score: 0,     //课程评分
    teacher: '',   //教师
    collectionStatus: true, //当前用户是否收藏了该课程
    checked: true,   //表示复选框是否被选中
    checked2: true,
    hasComment: false, //当前用户是否已经对这个课程发表了评论
    openid: '',     //评论者的openid
    nickname: '',   //评论者的昵称
    userTx: '',     //评论者的头像
    content: '',    //评价的内容
    value: 5,      //用户评分
    newscore: 0,   //新的评分
    images: [],    //要上传的图片
    fileIds: [],    //记录到数据库的fileid
    commentList: []    //关于这个课程的评论列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("options",options);
    var status = true
    if(options.collectionStatus == "false"){
      status = false
    }
    this.setData({
      courseid: options.courseid,
      collectionStatus : status
    });
    let promiseArr = [];
    var readyList = new Array();
    promiseArr.push(new Promise((reslove, reject) => {
      db.collection('course').where({
        _id: options.courseid
      }).get().then(res => {
        // res.data 是包含以上定义的两条记录的数组
        console.log('res', res.data)
        this.setData({
          name: res.data[0].name,
          score: res.data[0].score,
          teacher: res.data[0].teacher
        });
        reslove();
      });
    }));

    promiseArr.push(new Promise((reslove, reject) => {
      db.collection('comment').where({
        courseid: options.courseid,
      }).get().then(res2 => {
        console.log('res2', res2),
          readyList = res2.data;
        reslove();
      })
    }));

    promiseArr.push(new Promise((reslove, reject) => {
      //获取当前用户的openid
      wx.cloud.callFunction({
        name: 'login',
        complete: res => {
          console.log('调用云函数获取到的openid：', res.result.openid)
          this.setData({
            openid: res.result.openid
          });
          reslove();
        }
      })
    }));
    //遍历评论列表，看当前用户是否对其评论过
    Promise.all(promiseArr).then(res => {
      console.log('length:', readyList.length);
      console.log('promiseLength:', promiseArr.length);
      for (let i = 0; i < readyList.length; i++) {
        //判断当前用户是否对该课程评论过，（可删除）
        if (readyList[i]._openid == this.data.openid) {
          this.setData({
            hasComment: true
          })
        }
        for (let j = 0; j < readyList[i].likeList.length; j++) {
          if (readyList[i].likeList[j] == this.data.openid) {
            readyList[i].likeStatus = true
          }//end if
        }//end for j
        for (let z = 0; z < readyList[i].disList.length; z++){
          if(readyList[i].disList[z] == this.data.openid){
            readyList[i].disStatus = true
          }//end if
        }//end for z
      }//end for i
      this.setData({
        commentList: readyList
      })
    })
  },

  /**
   * 收藏课程
   */
  onTapCollection: function(e){
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    if (this.data.collectionStatus) {    //如果已经收藏，页面数据collection置为false,则将图片变为未收藏，并从课程收藏列表中删除该用户，从用户的收藏列表中删除这门课程
      this.setData({
        collectionStatus: false
      })
      var flag = 0
      var flag2 = 0
      let promiseArr = []
      var newList = new Array()
      var newList2 = new Array()
      promiseArr.push(new Promise((reslove, reject) => {
        db.collection('course').where({
          _id: this.data.courseid
        }).get({
          success: res => {
            console.log("查询course数据表操作成功", res)
            newList = res.data[0].likeList
            for (var i = 0; i < newList.length; i++) {
              if (newList[i] == this.data.openid) {
                newList.splice(i, 1);
                flag = 1;
                reslove();
              }
            }//end for
            if(flag == 0){
              reslove();
            }
          },
          fail: err => {
            console.log("查询course数据表操作失败", err)
          }
        })
      }));
      promiseArr.push(new Promise((reslove, reject)=>{
        db.collection('user').where({
          _openid:this.data.openid
        }).get({
          success: res => {
            newList2 = res.data[0].collectionList
            for(var i = 0; i < newList2.length; i++){
              if(newList2[i] == this.data.courseid){
                flag2 = 1;
                newList2.splice(i,1);
                reslove();
              }
            }//end for
            if(flag2 == 0){
              reslove();
            }
          },
          fail: err => {
            console.log("查询user数据表操作失败",err)
          }
        })
      }));
      Promise.all(promiseArr).then(res => {
        wx.cloud.callFunction({
          name: 'updateLikeList',
          data: {
            courseid: this.data.courseid,
            likeList: newList
          },
          success: res => {
            console.log("用户取消收藏课程成功", res)
            wx.hideLoading()
            wx.showToast({
              title: '取消收藏',
            })
          },
          fail: err => {
            console.log("用户取消收藏课程失败", err)
            wx.hideLoading()
            wx.showToast({
              icon: 'none',
              title: '失败！',
            })
          }
        })//end callFunction updateLikeList
        wx.cloud.callFunction({
          name: 'updateMyList',
          data:{
            courseid:this.data.courseid,
            collectionList:newList2
          },
          success: res => {
            console.log("用户将课程从收藏列表中删除成功")
          },
          fail: err => {
            console.log("用户将课程从收藏列表中删除失败")
          }
        })//end callFunction updateMyList
      })//end Promise.all
    }//end if
    else{
      this.setData({
        collectionStatus: true
      })
      let promiseArr = []
      var newList = new Array()
      var newList2 = new Array()
      promiseArr.push(new Promise((reslove, reject) => {
        db.collection('course').where({
          _id: this.data.courseid
        }).get({
          success: res => {
            console.log("查询course数据表操作成功", res)
            newList = res.data[0].likeList
            newList.push(this.data.openid)
            reslove();
          },
          fail: err => {
            console.log("查询course数据表操作失败", err)
          }
        })
      }));
      promiseArr.push(new Promise((reslove, reject) => {
        db.collection('user').where({
          _openid: this.data.openid
        }).get({
          success: res=>{
            newList2 = res.data[0].collectionList
            newList2.push(this.data.courseid)
            reslove();
          },
          fail: err=>{
            console.log("出现错误")
          }
        })
      }));
      Promise.all(promiseArr).then(res=>{
        wx.cloud.callFunction({
          name:'updateLikeList',
          data:{
            courseid: this.data.courseid,
            likeList:newList
          },
          success: res=>{
            console.log("用户收藏课程成功",res)
            wx.hideLoading()
            wx.showToast({
              title: '已收藏',
            })
          },
          fail: err=>{
            console.log("用户收藏课程失败",err)
            wx.hideLoading()
            wx.showToast({
              icon: 'none',
              title: '失败！',
            })
          }
        }) //end callFunction updateLikeList
        wx.cloud.callFunction({
          name: 'updateMyList',
          data: {
            courseid: this.data.courseid,
            collectionList: newList2
          },
          success: res => {
            console.log("用户添加课程到收藏列表成功")
          },
          fail: err => {
            console.log("用户添加课程到收藏列表失败")
          }
        })//end callFunction updateMyList
      })//end Promise.all
    }//end else
  },


  /**
   * 复选框1：是否匿名
   */
  onChange: function (event) {
    this.setData({
      checked: event.detail
    });
  },
  /**
   * 复选框2：是否上过
   */
  onChange2: function (event) {
    this.setData({
      checked2: event.detail
    });
  },
  /**
   * 将页面的评论内容赋值给content
   */
  onContentChange: function (event) {
    this.setData({
      content: event.detail
    })
  },
  /**
   * 将页面的评分赋值给value
   */
  onScoreChange: function (event) {
    this.setData({
      value: event.detail
    });
  },
  /**
   * 上传图片
   */
  uploadImg: function () {
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
  toFixed: function (x) {
    var f = parseFloat(x);
    if (isNaN(f)) {
      return;
    }
    f = Math.round(x * 10) / 10;
    return f;
  },
  
  /**
    * 提交评论
    */
  submit: function (e) {
    console.log('e', e);
    wx.showLoading({
      title: '评论中',
    })
    console.log(this.data.content, this.data.value, this.data.courseid);
    //上传图片到云存储
    let promiseArr = [];
    promiseArr.push(new Promise((reslove,reject)=>{
      var flag = 0;
      for (let i = 0; i < this.data.images.length; i++) {
        let item = this.data.images[i];
        let suffix = /\.\w+$/.exec(item)[0];//正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix,
          filePath: item, // 文件路径
          success: res => {
            // get resource ID 返回文件id
            console.log(res.fileID)
            flag = 1;
            this.setData({
              fileIds: this.data.fileIds.concat(res.fileID)
            });
            reslove();
          },
          fail: err => {
            // handle error
          }
        })
      }//end for
      if(flag == 0){
        reslove();
      }
    }));
    
    //文件上传到云存储全部成功后，开始执行下面的代码：插入数据到数据库
    Promise.all(promiseArr).then(res => {
      let promiseArr2 = []
      //插入数据
      promiseArr2.push(new Promise((reslove,reject)=>{
        //1、获取当前用户的头像、昵称等信息
        this.setData({
          nickname: e.detail.userInfo.nickName,
          userTx: e.detail.userInfo.avatarUrl
        })
        //2、将信息插入到数据库中
        var date = new Date();
        var empList = new Array();  //建立一个空数组作为新评论的点赞列表
        db.collection('comment').add({
          data: {
            content: this.data.content,
            score: this.data.value,
            courseid: this.data.courseid,
            createtime: date.getFullYear().toString() + '-' + (date.getMonth() + 1).toString() + '-' + date.getDate().toString(),
            fileIds: this.data.fileIds,
            nickname: this.data.nickname,
            userTx: this.data.userTx,
            likeNum: 0,
            disNum: 0,
            reNum: 0,
            likeList: empList,
            disList: empList,
            likeStatus: false,
            disStatus: false,
          }
        }).then(res => {
          wx.hideLoading();
          wx.showToast({
            title: '评价成功',
          })
          console.log("上传评论到数据库")
          this.setData({
            hasComment: true
          })
          reslove();
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: '评价失败',
          })
        })
      }));
      Promise.all(promiseArr2).then(res =>{
        let promiseArr3 = []
        promiseArr3.push(new Promise((reslove,reject)=>{
          //计算评分
          db.collection('comment').where({
            courseid: this.data.courseid,
          }).get().then(res => {
            console.log("计算评分")
            this.setData({
              commentList: res.data,
            })
            var sum = 0;
            for (let i = 0; i < this.data.commentList.length; i++) {
              sum = this.data.commentList[i].score + sum
            }
            console.log('sum', sum);
            this.setData({
              newscore: this.toFixed(sum / (this.data.commentList.length))
            })
            reslove();
          })
        }));
        Promise.all(promiseArr3).then(res=>{
          //更新评分
          wx.cloud.callFunction({
            name: 'update',
            data: {
              newscore: this.data.newscore,
              courseid: this.data.courseid,
            }
          }).then(res => {
            console.log("更新评分")
            this.setData({
              score: this.data.newscore
            })
          })
        })//end Promise.all(promiseArr)
      })//end Promise.all(promiseArr2)
    });//end Promise.all(promiseArr)
  },

  /**
   * 点赞功能
   */
  onTapLike: function (e) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    var index = e.currentTarget.dataset.index;  //得到当前是哪个评论
    var newList = this.data.commentList;
    console.log('点击的index为', index);
    if (newList[index].likeStatus) {//如果当前点了“赞”，则将likeStatus置为false,然后将likeNum减1
      var n = newList[index].likeList.indexOf(this.data.openid);
      newList[index].likeList.splice(n, 1);
      wx.cloud.callFunction({
        name: 'like',
        data: {
          likeNum: --newList[index].likeNum,
          cId: newList[index]._id,
          likeList: newList[index].likeList
        },
        success: res => {
          newList[index].likeStatus = false;
          wx.hideLoading();
          wx.showToast({
            title: '取消点赞',
          })
          this.setData({
            commentList: newList
          })
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '取消点赞失败'
          })
        }
      })
    } else if (newList[index].disStatus) {//如果当前点了“踩”，则先将disStatus置为false,然后将disNum减1，再执行点“赞”
      var n = newList[index].disList.indexOf(this.data.openid);
      newList[index].disList.splice(n, 1);
      wx.cloud.callFunction({
        name: 'dislike',
        data: {
          disNum: --newList[index].disNum,
          cId: newList[index]._id,
          disList: newList[index].disList
        },
        success: res => {            //第一个云函数（取消“踩”）执行完毕后，再执行第二个云函数（点“赞”）
          newList[index].disStatus = false,
            newList[index].likeList.push(this.data.openid);
          wx.cloud.callFunction({
            name: 'like',
            data: {
              likeNum: ++newList[index].likeNum,
              cId: newList[index]._id,
              likeList: newList[index].likeList
            },
            success: res2 => {
              newList[index].likeStatus = true;
              wx.hideLoading();
              wx.showToast({
                title: '点赞成功',
              })
              this.setData({
                commentList: newList
              })
            },
            fail: err2 => {
              wx.hideLoading();
              wx.showToast({
                icon: 'none',
                title: '点赞失败'
              })
            }
          });
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '点赞失败'
          })
        }
      })
    } else {//如果当前既没有点“赞”，也没有点“踩”，则直接将likeStatus置为true，然后令likeNum加1
      newList[index].likeList.push(this.data.openid);
      wx.cloud.callFunction({
        name: 'like',
        data: {
          likeNum: ++newList[index].likeNum,
          cId: newList[index]._id,
          likeList: newList[index].likeList
        },
        success: res => {
          newList[index].likeStatus = true;
          wx.hideLoading();
          wx.showToast({
            title: '点赞成功',
          })
          this.setData({
            commentList: newList
          })
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '点赞失败'
          })
        }
      })
    }
  },

  /**
   * 踩功能
   */
  onTapDislike: function (e) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    var index = e.currentTarget.dataset.index;  //得到当前是哪个评论
    var newList = this.data.commentList;
    console.log('点击的index为', index);
    if (newList[index].likeStatus) {  //如果当前点了赞，应该先执行点赞取消，再执行“踩”
      var n = newList[index].likeList.indexOf(this.data.openid);
      newList[index].likeList.splice(n, 1);
      wx.cloud.callFunction({
        name: 'like',
        data: {
          likeNum: --newList[index].likeNum,
          cId: newList[index]._id,
          likeList: newList[index].likeList
        },
        success: res => {
          newList[index].likeStatus = false;
          newList[index].disList.push(this.data.openid);
          wx.cloud.callFunction({
            name: 'dislike',
            data: {
              disNum: ++newList[index].disNum,
              cId: newList[index]._id,
              disList: newList[index].disList
            },
            success: res => {
              newList[index].disStatus = true;
              wx.hideLoading();
              wx.showToast({
                title: '已踩',
              })
              this.setData({
                commentList: newList
              })
            },
            fail: err => {
              wx.hideLoading();
              wx.showToast({
                icon: 'none',
                title: '失败'
              })
            }
          })
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '取消点赞失败'
          })
        }
      })
    } else if (newList[index].disStatus) {//如果当前点了“踩”，应该将disStatus置为false，然后将disNum减1
      var n = newList[index].disList.indexOf(this.data.openid);
      newList[index].disList.splice(n, 1);
      wx.cloud.callFunction({
        name: 'dislike',
        data: {
          disNum: --newList[index].disNum,
          cId: newList[index]._id,
          disList: newList[index].disList
        },
        success: res => {
          newList[index].disStatus = false;
          wx.hideLoading();
          wx.showToast({
            title: '已取消',
          })
          this.setData({
            commentList: newList
          })
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '取消失败'
          })
        }
      })
    } else {//如果既没有点“赞”，也没有点“踩”，直接将“踩”数加一，disStatus置为true
      newList[index].disList.push(this.data.openid);
      wx.cloud.callFunction({
        name: 'dislike',
        data: {
          disNum: ++newList[index].disNum,
          cId: newList[index]._id,
          disList: newList[index].disList
        },
        success: res => {
          newList[index].disStatus = true;
          wx.hideLoading();
          wx.showToast({
            title: '已踩',
          })
          this.setData({
            commentList: newList
          })
        },
        fail: err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '失败'
          })
        }
      })
    }
  },

  /**
   * 删除评论功能
   */
  onTapDelete: function(e){
    wx.showLoading({
      title: '正在删除',
      mask: true
    })
    var index = e.currentTarget.dataset.index;  //得到当前是哪个评论
    console.log("要删除的评论index:",index);
    var newList = this.data.commentList;
    var commentid = newList[index]._id;   //将id赋给commentid,再将commentid传给云函数
    newList.splice(index, 1);
    console.log("id",commentid);
    wx.cloud.callFunction({
      name: 'deleteComment',
      data:{
        commentid: commentid
      },
      success: res => {
        wx.hideLoading();
        this.setData({
          commentList: newList
        })
        wx.showToast({
          title: '已删除',
        })
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          icon: 'none',
          title: '失败'
        })
      }
    })
  },

  /**
   * 回复功能
   */
  onTapReply: function(e){
    var index = e.currentTarget.dataset.index;
    var commentId = this.data.commentList[index]._id;
    wx.navigateTo({
      url: `../reply/reply?commentid=${commentId}&person=${this.data.openid}`,
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
