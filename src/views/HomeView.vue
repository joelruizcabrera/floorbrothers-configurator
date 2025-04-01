<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import renderEngine from '@/plugins/renderEngine.ts'

const roomX = ref(2)
const roomY = ref(3)

let engine:any;

const tilesSum = ref(null)

onMounted(() => {
  engine = new renderEngine("#engine", {
    tileX: 39.5,
    tileY: 39.5,
    tileZ: 1.8,
    showGrid: true,
    showAxes: false,
    tileFactor: 0.005,
    roomX: roomX.value,
    roomY: roomY.value
  })
  engine.createView()
  tilesSum.value = engine.getTilesCount()
})

watch(roomX, async (newX, oldX) => {
  if (newX !== oldX) {
   if (newX >= 0) {
     engine.updateFloor(roomX.value, roomY.value)
     tilesSum.value = engine.getTilesCount()
   }
  }
})

watch(roomY, async (newY, oldY) => {
  if (newY !== oldY) {
    if (newY >= 0) {
      engine.updateFloor(roomX.value, roomY.value)
      tilesSum.value = engine.getTilesCount()
    }
  }
})

function switch2d() {
  engine.switch2d()
}
</script>

<template>
  <div class="app__engine">
    <div class="app__engine__sidebar">
      <img src="/logo.png" alt="FloorBrothers" class="app__engine__sidebar__logo">
      <div class="app__engine__sidebar__config">
        <p style="margin: .75rem 0">Fliesen benötigt: <span v-html="tilesSum"></span></p>
        <div class="form-group">
          <label for="roomX">Breite (m)</label>
          <input type="number" v-model.lazy="roomX" name="roomX">
        </div>
        <div class="form-group">
          <label for="roomX">Länge (m)</label>
          <input type="number" v-model.lazy="roomY" name="roomY">
        </div>
      </div>
    </div>
    <!--<div class="app__engine__view__actions">
      <button @click="switch2d()" class="switch">2D</button>
    </div>-->
    <div class="app__engine__view">
      <div id="engine"></div>
    </div>
  </div>
</template>

<style lang="scss">
.app__engine {
  min-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: row;
  --sidebar--width: 20rem;
  &__sidebar {
    max-width: var(--sidebar--width);
    min-width: var(--sidebar--width);
    min-height: 100%;
    background-color: var(--vt-c-black-soft);
    padding: 1rem;
    border-radius: .5rem;

    &__logo {
      max-width: 100%;
      height: auto;
    }
    &__config {
      .form-group {
        margin-bottom: 0.25rem;
        display: flex;
        flex-direction: column;
        input {
          min-height: 2rem;
          border-radius: 0;
          border: none;
          padding: .5rem .75rem;
          &:focus {
            outline: none;
          }
        }
      }
    }
  }
  &__view {
    padding: 0 1rem;
    padding-right: 0;
    max-width: calc(100vw - var(--sidebar--width));
    width: 100%;
    position: relative;
    canvas {
      border-radius: .5rem;
    }
    #engine {
      position: static;
      top: 0;
      left: 0;
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
    }
    &__actions {
      position: absolute;
      right: 0;
      margin: .75rem;
      top: 0;
    }
  }
  @media (max-width: 991.98px) {
    --sidebar--width: 12rem;
    &__sidebar {
      padding: .5rem;
    }
  }
  @media (max-width: 767.98px) {
    --sidebar--width: 0rem;
    min-height: calc(100vh - 1rem);
    &__sidebar {
      position: fixed;
      padding: .5rem;
      margin: .5rem;
      min-width: min-content;
      min-height: calc(100% - 2rem);
    }
    &__view {
      padding: 0;
      max-width: calc(100vw - 1rem - var(--sidebar--width));
    }
  }
}
</style>