<script setup lang="ts">
import {onMounted, ref} from "vue";
import renderEngine from '@/plugins/renderEngine.ts'

const roomX = ref(0)
const roomY = ref(0)

onMounted(() => {
  const engine = new renderEngine("#engine")
  engine.createView()
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
}
</style>