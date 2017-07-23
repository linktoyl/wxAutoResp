// chatroom.js

let RecordStatus = {
  SHOW: 0,
  HIDE: 1,
  HOLD: 2,
  SWIPE: 3,
  RELEASE: 4
}

let RecordDesc = {
  0: '长按开始录音',
  2: '向上滑动取消',
  3: '松开手取消',
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chatMsg: [],
    emojiStr: '',
    yourname: '',
    myName: '',
    sendInfo: '',
    userMessage: '',
    inputMessage: '',
    indicatorDots: true,
    autoplay: false,
    interval: 5000,
    duration: 1000,
    show: 'emoji_list',
    view: 'scroll_view',
    toView: '',
    msgView: {},
    RecordStatus: RecordStatus,
    RecordDesc: RecordDesc,
    recordStatus: RecordStatus.HIDE,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    this.setData({
      inputMessage: ''
    })
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
  //***************** 录音 begin ***************************
  changedTouches: null,
  toggleRecordModal: function (e) {
    this.setData({
      recordStatus: this.data.recordStatus == RecordStatus.HIDE ? RecordStatus.SHOW : RecordStatus.HIDE
    })
  },
  toggleWithoutAction: function (e) {
    console.log('toggleWithoutModal 拦截请求不做处理')
  },
  handleRecording: function (e) {
    var self = this
    console.log('handleRecording')
    this.changedTouches = e.touches[0]
    this.setData({
      recordStatus: RecordStatus.HOLD
    })
    wx.startRecord({
      success: function (res) {
        console.log('success')
        // 取消录音发放状态 -> 退出不发送
        if (self.data.recordStatus == RecordStatus.RELEASE) {
          console.log('user canceled')
          return
        }
        // console.log(tempFilePath)
        self.uploadRecord(res.tempFilePath)
      },
      fail: function (err) {
        // 时间太短会失败
        console.log(err)
      },
      complete: function () {
        console.log("complete")
        this.handleRecordingCancel()
      }.bind(this)
    })

    setTimeout(function () {
      //超时 
      self.handleRecordingCancel()
    }, 100000)
  },
  handleRecordingMove: function (e) {
    var touches = e.touches[0]
    var changedTouches = this.changedTouches

    if (!this.changedTouches) {
      return
    }
    // 无效
    // var changedTouches = e.changedTouches[0]
    // console.log(changedTouches.pageY, touches.pageY)

    if (this.data.recordStatus == RecordStatus.SWIPE) {
      if (changedTouches.pageY - touches.pageY < 20) {
        this.setData({
          recordStatus: RecordStatus.HOLD
        })
      }
    }
    if (this.data.recordStatus == RecordStatus.HOLD) {
      if (changedTouches.pageY - touches.pageY > 20) {
        this.setData({
          recordStatus: RecordStatus.SWIPE
        })
      }
    }

  },
  stopRecord: function (e) {
    let { url, mid } = e.target.dataset
    this.data.msgView[mid] = this.data.msgView[mid] || {}
    this.data.msgView[mid].isPlay = false;
    this.setData({
      msgView: this.data.msgView
    })
    wx.stopVoice()
  },
  playRecord: function (e) {
    let { url, mid } = e.target.dataset
    this.data.msgView[mid] = this.data.msgView[mid] || {}

    // reset all plays
    for (let v in this.data.msgView) {
      this.data.msgView[v] = this.data.msgView && (this.data.msgView[v] || {})
      this.data.msgView[v].isPlay = false
    }

    // is play then stop
    if (this.data.msgView[mid].isPlay) {
      this.stopRecord(e)
      return;
    }

    console.log(url, mid)
    this.data.msgView[mid].isPlay = true;
    this.setData({
      msgView: this.data.msgView
    })

    wx.getStorage({
      key: 'yanglin',
      success: function(res) {
        var msgs = res.data
        var msg = msgs[msgs.length-1]
        console.log(msg.msg.url)
        wx.playVoice({
          filePath: msg.msg.url,
          complete: function () {
            this.stopRecord(e)
          }.bind(this)
        })
      }.bind(this),
      fail: function (err) {
        console.log('playVoice err.',err)
      },
      complete: function complete() {
      }
    })

    
  },
  handleRecordingCancel: function () {
    console.log('handleRecordingCancel')
    // 向上滑动状态停止：取消录音发放
    if (this.data.recordStatus == RecordStatus.SWIPE) {
      this.setData({
        recordStatus: RecordStatus.RELEASE
      })
    } else {
      this.setData({
        recordStatus: RecordStatus.HIDE
      })
    }
    wx.stopRecord()
  }, 
  uploadRecord: function (tempFilePath) {
    var that = this

    var msgData = {
      info: {
        to: 'vitco'
      },
      username: 'yanglin',
      yourname: 'vitco',
      msg: {
        type: 'audio',
        data: '',
        url: tempFilePath,
      },
      style: 'self',
      time: '2017-07-23 10:00:08',
      mid: '1'
    }
    that.data.chatMsg.push(msgData)
    console.log(that.data.chatMsg)

    //console.log('success', that.data)
    wx.setStorage({
      key: 'yanglin',
      data: that.data.chatMsg,
      success: function () {
        //console.log('success', that.data)
        that.setData({
          chatMsg: that.data.chatMsg
        })
        setTimeout(function () {

          that.setData({
            toView: that.data.chatMsg[that.data.chatMsg.length - 1].mid
          })
        }, 10)
      }
    })

  },
  //***************** 录音 end ***************************
  sendMessage: function (e) {
    var userMsg = '' + e.detail.value
    if (!userMsg.trim()) return;
    var that = this
    var msgData = {
      info: {
        to: 'vitco'
      },
      username: 'yanglin',
      yourname: 'vitco',
      msg: {
        type: 'txt',
        data: [{ type: 'txt', data: userMsg }]
      },
      style: 'self',
      time: '2017-07-22 23:23:23',
      mid: '212'
    }
    that.data.chatMsg.push(msgData)
    that.setData({
      chatMsg: that.data.chatMsg,
      emojiList: [],
      inputMessage: ''
    })
    setTimeout(function () {
      that.setData({
        toView: that.data.chatMsg[that.data.chatMsg.length - 1].mid
      })
    }, 100)

    var msgData2 = {
      info: {
        from: 'vitco',
        to: 'yanglin'
      },
      username: 'vitco',
      yourname: 'vitco',
      msg: {
        type: 'txt',
        data: [{ type: 'txt', data: 'Yes!' }],
        url: 'http://www.baidu.com'
      },
      style: '',
      time: '2017-07-23 23:23:23',
      mid: '2121'
    }
    msgData2.username = 'vitco'

    //console.log(msgData, that.data.chatMsg, that.data)
    that.data.chatMsg.push(msgData2)
    that.setData({
      chatMsg: that.data.chatMsg,
    })
    setTimeout(function () {
      that.setData({
        toView: that.data.chatMsg[that.data.chatMsg.length - 1].mid
      })
    }, 1000)
  }
})