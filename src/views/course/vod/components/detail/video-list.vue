<template>
  <div>
    <div
      class="video-item"
      @click="switchVideo(videoItem)"
      v-for="videoItem in videos"
      :key="videoItem.id"
    >
      <template v-if="isBuy || course.is_free === 1"></template>
      <img class="play-icon" v-else src="@/assets/img/commen/icon-lock.png" />
      <div class="video-title">
        <div class="text">
          {{ videoItem.title }}
        </div>
        <div
          class="free"
          v-if="
            isBuy === false &&
              course.is_free !== 1 &&
              videoItem.free_seconds > 0
          "
        >
          试看
        </div>
      </div>
      <div class="video-duration">
        <duration :seconds="videoItem.duration"></duration>
      </div>
    </div>
  </div>
</template>
<script>
import Duration from "@/components/duration.vue";
export default {
  components: {
    Duration,
  },
  props: ["videos", "isBuy", "course", "buyVideos"],
  methods: {
    switchVideo(item) {
      this.$emit("switchVideo", item);
    },
  },
};
</script>

<style lang="less" scoped>
.video-item {
  width: 100%;
  height: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;
  margin-top: 30px;
  cursor: pointer;
  &:first-child {
    margin-top: 0px;
  }
  &:hover {
    opacity: 0.8;
    .video-title {
      color: #3ca7fa;
    }
  }

  .play-icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    margin-right: 15px;
  }
  .video-title {
    height: 22px;
    font-size: 14px;
    font-weight: 400;
    color: #333333;
    line-height: 14px;
    display: flex;
    flex-direction: row;
    align-items: center;
    .free {
      margin-left: 15px;
      width: 44px;
      height: 22px;
      background: #04c877;
      border-radius: 2px;
      color: #fff;
      font-size: 12px;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .video-duration {
    position: absolute;
    height: 14px;
    font-size: 14px;
    font-weight: 400;
    color: #999999;
    line-height: 14px;
    top: 5px;
    right: 0;
  }
}
</style>
