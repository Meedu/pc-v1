<template>
  <div class="content" v-if="video">
    <div class="navheader">
      <div class="top">
        <div class="d-flex">
          <img
            @click="goDetail()"
            class="icon-back"
            src="../../../assets/img/commen/icon-back-h.png"
          />
          <span @click="goDetail()">{{ video.title }}</span>
        </div>
      </div>
    </div>
    <div class="live-banner">
      <div class="live-box" v-if="isLogin && video">
        <div class="live-item">
          <sign-dialog
            v-if="video.status === 1 && signStatus && signRecords"
            :cid="course.id"
            :records="signRecords"
            @close="closeSignDialog"
          ></sign-dialog>
          <div class="live-item-title">
            <span class="name">{{ video.title }}</span>
            <span class="time">
              <span v-if="video.status === 0">
                开播时间 {{ video.published_at }}
              </span>
              <span v-else-if="video.status === 1">直播中</span>
              <span v-else-if="video.status === 2">已结束</span>
            </span>
          </div>
          <div
            class="live-item-video"
            :style="{
              'background-image': 'url(' + course.poster + ')',
              'background-size': '100% 100%',
            }"
          >
            <template v-if="video.status === 1">
              <div class="alert-message" v-if="noTeacher">
                <div class="message">
                  讲师暂时离开直播间，稍后请刷新！<a @click="reloadPlayer()"
                    >点击刷新</a
                  >
                </div>
              </div>

              <div class="play" v-show="!noTeacher">
                <video id="meedu-live-player" v-if="webrtc_play_url"></video>
                <div
                  v-else
                  id="meedu-live-player"
                  style="width: 100%; height: 100%"
                ></div>
              </div>
            </template>
            <div class="alert-message" v-else-if="video.status === 0">
              <div class="message" v-if="waitTeacher">
                待讲师开播，<a @click="reloadPlayer()">点击刷新</a>
              </div>
              <div class="message" v-else>
                直播倒计时：{{ day }}天{{ hour }}小时{{ min }}分{{ second }}秒
              </div>
            </div>
            <template v-else-if="video.status === 2">
              <template v-if="record_exists === 1 && !vodPlayerStatus">
                <div class="alert-message">
                  <div class="message">
                    直播已结束，<a @click="showVodPlayer()">点击回看</a>
                  </div>
                </div>
              </template>
              <div class="play" v-if="record_exists === 1 && vodPlayerStatus">
                <div
                  id="meedu-vod-player"
                  style="width: 100%; height: 100%"
                ></div>
              </div>
            </template>
          </div>
          <div class="replybox">
            <template v-if="currentTab === 1 && video.status !== 2">
              <input
                class="reply-content"
                type="text"
                :disabled="messageDisabled"
                v-model="message.content"
                :placeholder="
                  messageDisabled
                    ? '禁言状态下无法发布消息'
                    : '按回车键可直接发送'
                "
                @keyup.enter="submitMessage()"
              />
              <div
                class="submit"
                :class="{
                  disabled: messageDisabled,
                }"
                @click="submitMessage()"
              >
                发布
              </div>
            </template>
          </div>
        </div>
        <div class="chat-item">
          <div class="tabs">
            <div
              class="item-tab"
              v-for="(item, index) in tabs"
              :key="index"
              :class="{ active: currentTab === item.id }"
              @click="tabChange(item.id)"
            >
              <div>{{ item.name }}</div>
              <div class="actline" v-if="currentTab === item.id"></div>
            </div>
          </div>
          <chat-box
            v-show="currentTab === 1"
            :chat="chat"
            :enabledChat="enabledChat"
            :status="video.status"
            :enabledMessage="roomDisabled"
            :disabled="userDisabled"
            :cid="course.id"
            :vid="video.id"
            @change="getStatus"
            @sign="openSignDialog"
            @endSign="closeSignDialog"
          ></chat-box>
          <attach-dialog
            v-if="currentTab === 2"
            :cid="course.id"
            :status="video.status"
            @reset="resetAttachDialog"
          ></attach-dialog>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState } from "vuex";
import ChatBox from "../../../components/chat-box.vue";
import AttachDialog from "./components/attach-dialog.vue";
import SignDialog from "./components/sign-dialog.vue";

export default {
  components: {
    ChatBox,
    AttachDialog,
    SignDialog,
  },
  data() {
    return {
      id: this.$route.query.id,
      playUrl: null,
      webrtc_play_url: null,
      aliRTSUrl: null,
      message: {
        content: null,
      },
      video: [],
      course: [],
      curStartTime: null,
      day: "0",
      hour: "00",
      min: "00",
      second: "00",
      vodPlayer: null,
      chat: null,
      isWebrtc: false,
      vodPlayerStatus: false,
      record_exists: 0,
      record_duration: 0,
      timeValue: 0,
      curDuration: 0,
      messageDisabled: false,
      roomDisabled: false,
      userDisabled: false,
      tabs: [
        {
          name: "聊天",
          id: 1,
        },
        {
          name: "课件",
          id: 2,
        },
      ],
      currentTab: 1,
      signRecords: null,
      signStatus: false,
      waitTeacher: false,
      noTeacher: false,
    };
  },
  computed: {
    ...mapState(["isLogin", "user", "config"]),
    enabledChat() {
      if (typeof this.video.status === "undefined") {
        return false;
      }
      return this.video.status === 0 || this.video.status === 1;
    },
    record_hour() {
      let h = parseInt(this.record_duration / 3600);
      if (h === 0) {
        return "";
      } else {
        return h >= 10 ? h + ":" : "0" + h + ":";
      }
    },
    record_minute() {
      let m = parseInt((this.record_duration % 3600) / 60);
      return m >= 10 ? m : "0" + m;
    },
    record_second() {
      let s = (this.record_duration % 3600) % 60;
      return s >= 10 ? s : "0" + s;
    },
    poster() {
      if (!this.course && !this.config) {
        return "";
      }
      return this.course.poster || this.config.player.cover;
    },
    bulletSecretColor() {
      if (!this.config) {
        return "red";
      }
      return !this.config.player.bullet_secret.color
        ? "red"
        : this.config.player.bullet_secret.color;
    },
    bulletSecretFontSize() {
      if (!this.config) {
        return "10px";
      }
      return !this.config.player.bullet_secret.size
        ? 14
        : this.config.player.bullet_secret.size;
    },
    bulletSecretText() {
      if (!this.config || !this.user) {
        return "";
      }
      return this.config.player.bullet_secret.text
        .replace("${user.mobile}", this.user.mobile)
        .replace("${mobile}", this.user.mobile)
        .replace("${user.id}", this.user.id);
    },
    enabledBulletSecret() {
      return parseInt(this.config.player.enabled_bullet_secret) === 1;
    },
  },
  mounted() {
    this.getData();
  },
  beforeDestroy() {
    this.vodPlayer && this.vodPlayer.destroy();

    if (window.liveDPlayer) {
      window.liveDPlayer.destroy();
    }
    if (window.liveTencentPlayer) {
      window.liveTencentPlayer.dispose();
    }
  },
  methods: {
    resetAttachDialog() {
      this.currentTab = null;
      setTimeout(() => {
        this.currentTab = 2;
      }, 150);
    },
    reloadPlayer() {
      window.location.reload();
    },
    openSignDialog(data) {
      if (window.liveDPlayer) {
        window.liveDPlayer.fullScreen.cancel();
      }
      if (window.liveTencentPlayer) {
        window.liveTencentPlayer.exitFullscreen();
      }
      this.signRecords = data;
      this.signStatus = true;
    },
    closeSignDialog() {
      this.signRecords = null;
      this.signStatus = false;
    },
    tabChange(key) {
      this.currentTab = key;
    },
    getStatus(status1, status2) {
      if (status1 || status2) {
        this.messageDisabled = true;
      } else {
        this.messageDisabled = false;
      }
    },
    goDetail() {
      this.$router.push({
        name: "liveDetail",
        query: { id: this.course.id, tab: 3 },
      });
    },
    getData() {
      this.$api.Live.Play(this.id).then((res) => {
        let resData = res.data;

        // 网页标题
        document.title = resData.video.title;

        if (!this.chat) {
          this.chat = resData.chat;
        }

        this.curStartTime = resData.video.published_at;
        this.course = resData.course;
        this.video = resData.video;
        this.playUrl = resData.play_url;
        this.record_exists = resData.record_exists;
        this.record_duration = resData.record_duration;
        this.webrtc_play_url = resData.web_rtc_play_url;
        this.aliRTSUrl = resData.ali_rts;
        this.roomDisabled = resData.room_is_ban === 1;
        this.userDisabled = resData.user_is_ban === 1;
        this.messageDisabled =
          resData.room_is_ban === 1 || resData.user_is_ban === 1;
        // 倒计时
        if (this.video.status === 0) {
          this.countTime();
        }

        //签到相关
        let sign_in_record = resData.sign_in_record;
        if (sign_in_record && sign_in_record.length !== 0) {
          this.signStatus = true;
          this.signRecords = sign_in_record;
        } else {
          this.signStatus = false;
          this.signRecords = null;
        }

        // 开始渲染播放器
        if (this.video.status === 1) {
          if (this.webrtc_play_url) {
            this.initLiveTencentPlayer();
          } else {
            this.initLivePlayer();
          }
        }
      });
    },
    showVodPlayer() {
      if (this.record_exists === 1 && this.playUrl.length > 0) {
        this.vodPlayerStatus = true;

        this.$nextTick(() => {
          this.initVodPlayer();
        });
      } else {
        this.$message.error("暂无回放");
      }
    },
    countTime() {
      let date = new Date();
      let now = date.getTime();
      let endDate = new Date(this.curStartTime);
      let end = endDate.getTime();
      let leftTime = end - now;
      if (leftTime >= 0) {
        // 天
        this.day = Math.floor(leftTime / 1000 / 60 / 60 / 24);
        // 时
        let h = Math.floor((leftTime / 1000 / 60 / 60) % 24);
        this.hour = h < 10 ? "0" + h : h;
        // 分
        let m = Math.floor((leftTime / 1000 / 60) % 60);
        this.min = m < 10 ? "0" + m : m;
        // 秒
        let s = Math.floor((leftTime / 1000) % 60);
        this.second = s < 10 ? "0" + s : s;
      } else {
        this.day = 0;
        this.hour = "00";
        this.min = "00";
        this.second = "00";
      }
      if (
        Number(this.hour) === 0 &&
        Number(this.day) === 0 &&
        Number(this.min) === 0 &&
        Number(this.second) === 0
      ) {
        // this.video.status = 1;
        this.waitTeacher = true;
        return;
      } else {
        setTimeout(this.countTime, 1000);
      }
    },
    initLivePlayer() {
      this.$nextTick(() => {
        let videoInfo = {
          url: this.playUrl,
          pic: this.poster,
        };
        if (this.aliRTSUrl) {
          videoInfo = {
            live_artc_url: this.aliRTSUrl,
            type: "artc",
            pic: this.poster,
          };
        }

        window.liveDPlayer = new window.DPlayer({
          container: document.getElementById("meedu-live-player"),
          live: true,
          video: videoInfo,
          autoplay: true,
          bulletSecret: {
            enabled: this.enabledBulletSecret,
            text: this.bulletSecretText,
            size: this.bulletSecretFontSize,
            color: this.bulletSecretColor,
            opacity: this.config.player.bullet_secret.opacity,
          },
        });
        window.liveDPlayer.on("timeupdate", () => {
          let duration = parseInt(window.liveDPlayer.currentTime);
          this.curDuration = duration;
          this.livePlayRecord(duration, false);
        });
        window.liveDPlayer.on("ended", () => {
          let duration = parseInt(window.liveDPlayer.currentTime);
          this.curDuration = duration;
          this.livePlayRecord(duration, true);
        });
        window.liveDPlayer.on("play_error", (e) => {
          console.log("play_error", e);
          this.noTeacher = true;
        });
      });
    },
    initLiveTencentPlayer() {
      this.$nextTick(() => {
        window.liveTencentPlayer = new window.TCPlayer("meedu-live-player", {
          width: 950,
          height: 535,
          sources: [{ src: this.webrtc_play_url }],
          controls: true,
          autoplay: true,
          poster: this.poster,
          bigPlayButton: true,
          reportable: false,
          webrtcConfig: {
            connectRetryCount: 3,
            connectRetryDelay: 1,
            receiveVideo: true,
            receiveAudio: true,
            showLog: false,
          },
          plugins: {
            DynamicWatermark: this.enabledBulletSecret
              ? {
                  type: "text",
                  speed: 0.2,
                  content: this.bulletSecretText,
                  opacity: this.config.player.bullet_secret.opacity,
                  fontSize: this.bulletSecretFontSize,
                  color: this.bulletSecretColor,
                }
              : null,
          },
        });

        window.liveTencentPlayer.on("timeupdate", () => {
          this.livePlayRecord(window.liveTencentPlayer.currentTime(), false);
        });
        window.liveTencentPlayer.on("ended", () => {
          this.livePlayRecord(window.liveTencentPlayer.currentTime(), true);
        });
        window.liveTencentPlayer.on("error", (e) => {
          console.log("视频播放出现错误", e);
          window.liveTencentPlayer.dispose();
          window.liveTencentPlayer = null;
          // 显示警告信息
          this.noTeacher = true;
        });
      });
    },
    initVodPlayer() {
      this.vodPlayer = new window.DPlayer({
        container: document.getElementById("meedu-vod-player"),
        autoplay: false,
        video: {
          quality: this.playUrl,
          defaultQuality: 0,
          pic: this.poster,
        },
        bulletSecret: {
          enabled: this.enabledBulletSecret,
          text: this.bulletSecretText,
          size: this.bulletSecretFontSize,
          color: this.bulletSecretColor,
          opacity: this.config.player.bullet_secret.opacity,
        },
      });
      this.vodPlayer.on("timeupdate", () => {
        this.playRecord(parseInt(this.vodPlayer.video.currentTime));
      });
      this.vodPlayer.on("ended", () => {
        this.playRecord(parseInt(this.vodPlayer.video.currentTime), true);
      });
    },
    playRecord(duration, isEnd) {
      if (duration - this.timeValue >= 10 || isEnd === true) {
        this.timeValue = duration;
        this.$goApi.VodWatchRecord(this.video.course_id, this.video.id, {
          duration: this.timeValue,
        });
      }
    },
    livePlayRecord(duration, isEnd) {
      if (duration - this.timeValue >= 10 || isEnd === true) {
        this.timeValue = duration;
        this.$goApi.LiveWatchRecord(this.video.course_id, this.video.id, {
          duration: this.timeValue,
        });
      }
    },
    saveChat(content) {
      this.$goApi
        .chatMsgSend(this.course.id, this.video.id, {
          content: content,
          duration: this.curDuration,
        })
        .catch((e) => {
          this.$msg.error(e.message);
        });
    },
    submitMessage() {
      if (!this.message.content || this.messageDisabled) {
        return;
      }
      this.saveChat(this.message.content);
      this.message.content = null;
    },
  },
};
</script>
<style lang="less" scoped>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: #dddddd;
}
::-webkit-scrollbar-track {
  background: #fff;
  border-radius: 0px;
}
.content {
  width: 100%;
  height: 100%;
  position: relative;
  margin: 0;
  .navheader {
    width: 100%;
    height: 70px;
    background: #ffffff;
    .top {
      width: 1200px;
      height: 70px;
      margin: 0 auto;
      font-size: 16px;
      font-weight: 500;
      color: #333333;
      line-height: 16px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      .icon-back {
        width: 24px;
        height: 24px;
        margin-right: 10px;
        cursor: pointer;
      }
      span {
        cursor: pointer;
      }
      .button {
        display: inline-block;
        width: auto;
        height: auto;
        font-size: 14px;
        font-weight: 400;
        color: #fff;
        line-height: 18px;
        cursor: pointer;
        background: #3ca7fa;
        padding: 12px 20px;
        border-radius: 4px;
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
  .live-banner {
    width: 100%;
    height: 100vh;
    padding-top: 50px;
    box-sizing: border-box;
    padding-bottom: 270px;
    background: url(../../../assets/img/commen/bg-zhibo.png) no-repeat;
    -moz-background-size: 100% 100%;
    background-size: 100% 100%;
    .live-box {
      width: 1200px;
      height: auto;
      margin: 0 auto;
      background-color: #fff;
      display: flex;
      flex-direction: row;
      .live-item {
        width: 950px;
        height: auto;
        position: relative;
        display: flex;
        flex-direction: column;
        .live-item-title {
          width: 100%;
          height: 76px;
          background: #000000;
          box-sizing: border-box;
          padding: 30px;
          .name {
            height: 16px;
            font-size: 16px;
            font-weight: 500;
            color: #ffffff;
            line-height: 16px;
            margin-right: 30px;
          }
          .time {
            height: 16px;
            font-size: 16px;
            font-weight: 400;
            color: #3ca7fa;
            line-height: 16px;
          }
        }
        .live-item-video {
          width: 100%;
          height: 535px;
          background-color: #000000;

          .play {
            width: 100%;
            height: 100%;
            background-color: #000000;
          }

          .alert-message {
            width: 100%;
            height: 535px;
            display: flex;
            align-items: center;
            justify-content: center;
            .play-button {
              width: auto;
              height: auto;
              background: #3ca7fa;
              border-radius: 32px;
              display: inline-block;
              margin-top: -76px;
              cursor: pointer;
              font-size: 14px;
              box-sizing: border-box;
              padding: 15px 20px;
              font-weight: 400;
              line-height: 14px;
              color: #ffffff;
              &:hover {
                opacity: 0.8;
              }
            }

            .message {
              background: rgba(255, 255, 255, 0.3);
              padding: 20px 30px;
              font-size: 24px;
              font-weight: 400;
              color: #ffffff;
              line-height: 24px;
              border-radius: 32px;
              span {
                color: #3ca7fa;
                cursor: pointer;
              }
              a {
                color: #3ca7fa;
                cursor: pointer;
                &:hover {
                  opacity: 0.8;
                }
              }
            }
          }
        }
        .replybox {
          width: 100%;
          height: 78px;
          background: #ffffff;
          box-sizing: border-box;
          padding: 15px 30px;
          position: relative;

          input {
            width: 400px;
            height: 48px;
            box-sizing: border-box;
            background: #f1f3f5;
            border-radius: 24px;
            outline: none;
            padding-left: 20px;
            padding-right: 64px;
            float: right;
            font-size: 14px;
            font-weight: 400;
          }

          .submit {
            position: absolute;
            width: 48px;
            height: 48px;
            background: #3ca7fa;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 400;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            top: 15px;
            right: 30px;
            z-index: 10;
            &:hover {
              opacity: 0.8;
            }
            &.disabled {
              background: #cccccc;
            }
          }
        }
      }
      .chat-item {
        width: 250px;
        height: auto;
        float: left;
        .tabs {
          width: 100%;
          height: 46px;
          display: flex;
          flex-direction: row;
          position: relative;
          border-bottom: 1px solid #e5e5e5;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 0px 40px;
          overflow: hidden;
          .item-tab {
            display: flex;
            width: auto;
            min-width: 50px;
            height: 46px;
            font-size: 16px;
            font-weight: 400;
            color: #333333;
            line-height: 16px;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
            padding-top: 15px;
            cursor: pointer;
            position: relative;
            &.active {
              font-weight: 600;
              color: #3ca7fa;
            }
            .actline {
              display: block;
              width: 50px;
              height: 4px;
              background: #3ca7fa;
              margin-top: 11px;
            }
          }
        }
      }
    }
  }
}
</style>
