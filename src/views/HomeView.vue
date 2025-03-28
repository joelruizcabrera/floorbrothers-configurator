<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import renderEngine from '@/plugins/renderEngine.ts'

const roomX = ref(1)
const roomY = ref(1)

let engine:any;

onMounted(() => {
  engine = new renderEngine("#engine")
  engine.createView()
})

watch(roomX, async (newX, oldX) => {
  if (newX !== oldX) {
    engine.updateFloor(roomX.value, roomY.value)
  }
})

watch(roomY, async (newY, oldY) => {
  if (newY !== oldY) {
    engine.updateFloor(roomX.value, roomY.value)
  }
})
</script>

<template>
  <div class="app__engine">
    <div class="app__engine__sidebar">
      <img src="/logo.png" alt="FloorBrothers" class="app__engine__sidebar__logo">
      <div class="app__engine__sidebar__config">
        <div class="form-group">
          <label for="roomX">Breite</label>
          <input type="number" v-model.lazy="roomX" name="roomX">
        </div>
        <div class="form-group">
          <label for="roomX">Länge</label>
          <input type="number" v-model.lazy="roomY" name="roomY">
        </div>
      </div>
    </div>
    <div class="app__engine__view" id="engine">

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
  }
  &__view {
    padding: 0 1rem;
    max-width: calc(100vw - 3rem - var(--sidebar--width));
    width: 100%;
    canvas {
      border-radius: .5rem;
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