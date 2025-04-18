<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import renderEngine from '@/plugins/renderEngine.ts'

const roomX = ref(2)
const roomY = ref(3)
const showWalls = ref(true)
const addStripTile = ref(true)
const configFileInput = ref()

let engine:any;

const tilesSum = ref(null)
const stripTileSum = ref(null)

let activeColor = ref('black')
let activeStripColor = ref('grey')

const colors = [
  {
    key: 'black',
    hex: '191919',
    title: 'Schwarz'
  },
  {
    key: 'white',
    hex: 'ffffff',
    title: 'Weiß'
  },
  {
    key: 'grey',
    hex: '63666a',
    title: 'Grau'
  },
  {
    key: 'red',
    hex: 'da291c',
    title: 'Rot'
  },
  {
    key: 'blue',
    hex: '06038d',
    title: 'Blau'
  },
  {
    key: 'yellow',
    hex: 'ffd700',
    title: 'Gelb'
  },
  {
    key: 'pink',
    hex: 'df1995',
    title: 'Pink'
  },
  {
    key: 'orange',
    hex: 'fe5000',
    title: 'Orange'
  },
  {
    key: 'green',
    hex: '046a38',
    title: 'Grün'
  },
  {
    key: 'turquoise',
    hex: '40e0d0',
    title: 'Türkis'
  },
  {
    key: 'olive',
    hex: 'dfc51a',
    title: 'Olive'
  },
  {
    key: 'khaki',
    hex: '6a5f31',
    title: 'Khaki'
  },
  {
    key: 'neongreen',
    hex: 'acee42',
    title: 'Neon Grün'
  },
  {
    key: 'lightblue',
    hex: '4fc2f3',
    title: 'Hellblau'
  }
]

onMounted(() => {
  engine = new renderEngine("#engine", {
    tileX: 39.5,
    tileY: 39.5,
    tileZ: 1.8,
    showWalls: showWalls.value,
    showGrid: false,
    showAxes: false,
    showStrips: addStripTile.value,
    tileFactor: 0.005,
    roomX: roomX.value,
    roomY: roomY.value
  })
  engine.createView()
  tilesSum.value = engine.getTilesCount()
  stripTileSum.value = engine.getStripCount()
  engine.setClickColor('191919')
  engine.setClickStripColor('63666a')
})

watch(roomX, async (newX, oldX) => {
  if (newX !== oldX) {
   if (newX >= 0) {
     engine.updateFloor(roomX.value, roomY.value)
     tilesSum.value = engine.getTilesCount()
     stripTileSum.value = engine.getStripCount()
   }
  }
})

watch(roomY, async (newY, oldY) => {
  if (newY !== oldY) {
    if (newY >= 0) {
      engine.updateFloor(roomX.value, roomY.value)
      tilesSum.value = engine.getTilesCount()
      stripTileSum.value = engine.getStripCount()
    }
  }
})

watch(showWalls, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    engine.switchWalls(showWalls.value)
  }
})
watch(addStripTile, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    engine.switchStrips(addStripTile.value)
    tilesSum.value = engine.getTilesCount()
    stripTileSum.value = engine.getStripCount()
  }
})
function switch2d() {
  engine.switch2d()
}
function openImport() {
  configFileInput.value.click()
}
async function importLayout(event: any) {
  let configFile = event.target.files || event.dataTransfer.files;
  if (!configFile.length) return;
  let jsonConfig = JSON.parse(await configFile[0].text())

  if (jsonConfig.layoutConfig) {
    roomX.value = jsonConfig.layoutConfig.roomX
    roomY.value = jsonConfig.layoutConfig.roomY
    showWalls.value = jsonConfig.layoutConfig.showWalls
    addStripTile.value = jsonConfig.layoutConfig.showStrips
  }
  engine.renderTiles()

  if (jsonConfig.objects.length > 0) {
    engine.loadConfig(jsonConfig.objects)
  }

  if (jsonConfig.layoutConfig.showStrips && jsonConfig.stripObjects.length > 0) {
    engine.loadConfigStrips(jsonConfig.stripObjects)
  }

  console.log(jsonConfig)
}

function exportScreenshot() {
  let a = document.createElement("a")
  engine.render()
  const canvas = engine.container.querySelector("canvas")
  // @ts-ignore
  canvas.toBlob((blob) => {
    a.href = window.URL.createObjectURL(blob)
    a.download = "FB_SCREENSHOT_" + roomX.value + "m_x_" + roomY.value + "m_" + Date.now() + ".png"
    a.click()
  })
}
</script>

<template>
  <div class="app__engine">
    <div class="app__engine__sidebar">
      <img src="/logo.png" alt="FloorBrothers" class="app__engine__sidebar__logo">
      <div class="app__engine__sidebar__config">
        <div style="margin: .75rem 0">
          <p>Fliesen benötigt: <span v-html="tilesSum"></span></p>
          <p v-if="addStripTile">Seitenleisten benötigt: <span v-html="stripTileSum"></span></p>
        </div>
        <div class="form-group" style="margin-bottom: 0">
          <label for="showWalls">Zeige Wände</label>
          <input type="checkbox" v-model.lazy="showWalls" name="showWalls">
        </div>
        <div class="form-group">
          <label for="stripTile">Seitenleisten hinzufügen</label>
          <input type="checkbox" v-model.lazy="addStripTile" name="stripTile">
        </div>
        <div class="form-group">
          <label for="roomX">Breite (m)</label>
          <input type="number" v-model.lazy="roomX" name="roomX">
        </div>
        <div class="form-group">
          <label for="roomY">Länge (m)</label>
          <input type="number" v-model.lazy="roomY" name="roomY">
        </div>
        <div class="form-group">
          <label for="color">Fliesenfarbe auswählen</label>
          <div class="form-group-select">
            <button name="color" v-for="color in colors" :key="color.key" :class="{'active': color.key == activeColor}" :style="'--element-color: #' + color.hex  + '; background: #' + color.hex + '72'" @click="() => {activeColor = color.key; engine.setClickColor(color.hex)}">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Pn" x="0px" y="0px" viewBox="0 0 4981 4981" style="enable-background:new 0 0 4981 4981;" xml:space="preserve">
                <g>
                  <defs>
                    <rect id="SVGID_1_" width="4981" height="4981"/>
                  </defs>
                                  <clipPath id="SVGID_2_">
                    <use xlink:href="#SVGID_1_" style="overflow:visible;"/>
                  </clipPath>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <rect class="st0" width="4981" height="4981"/>
                                  <g class="st1">
                    <path class="st2" d="M2490.5-2259.8l-4750.2,4750.3l4750.2,4750.3l4750.2-4750.3L2490.5-2259.8z M6847.3,2490.5L2490.5,6847.3    l-4356.7-4356.8l4356.8-4356.8L6847.3,2490.5z"/>
                                    <path class="st2" d="M2490.5,6242.4l3751.9-3751.9L2490.5-1261.4l-3751.9,3751.9L2490.5,6242.4z M2490.5-868l3358.4,3358.5    L2490.5,5849L-867.9,2490.5L2490.5-868z"/>
                                    <path class="st2" d="M5244.1,2490.5L2490.5-263.1L-263,2490.5l2753.6,2753.6L5244.1,2490.5z M130.4,2490.5L2490.5,130.4    l2360.1,2360.1L2490.5,4850.6L130.4,2490.5z"/>
                                    <path class="st2" d="M2490.5,735.3L735.3,2490.5l1755.2,1755.2l1755.2-1755.2L2490.5,735.3z M2490.5,1128.7l1361.8,1361.8    L2490.5,3852.3L1128.7,2490.5L2490.5,1128.7z"/>
                                    <path class="st2" d="M3247.4,2490.5l-756.9-756.9l-756.9,756.9l756.9,756.9L3247.4,2490.5z M2490.5,2854.1l-363.4-363.6    l363.4-363.4l363.4,363.5L2490.5,2854.1z"/>
                  </g>
                </g>
              </svg>
            </button>
          </div>
          <button class="form-group-fill-all" @click="engine.changeAllColor()">
            <svg fill="#fff" width="64px" height="64px" viewBox="-2.4 -2.4 28.80 28.80" xmlns="http://www.w3.org/2000/svg" stroke="#fff" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#fffCCCCCC" stroke-width="0.144"></g><g id="SVGRepo_iconCarrier"><path d="M20 14c-.092.064-2 2.083-2 3.5 0 1.494.949 2.448 2 2.5.906.044 2-.891 2-2.5 0-1.5-1.908-3.436-2-3.5zM9.586 20c.378.378.88.586 1.414.586s1.036-.208 1.414-.586l7-7-.707-.707L11 4.586 8.707 2.293 7.293 3.707 9.586 6 4 11.586c-.378.378-.586.88-.586 1.414s.208 1.036.586 1.414L9.586 20zM11 7.414 16.586 13H5.414L11 7.414z"></path></g></svg>
            <p><span v-html="colors.filter((e) => e.key === activeColor).map(obj => obj.title)"></span> füllen.</p>
          </button>
        </div>
        <div class="form-group" v-if="addStripTile">
          <label for="color">Seitenleistenfarbe auswählen</label>
          <div class="form-group-select">
            <button name="color" v-for="color in colors" :key="color.key" :class="{'active': color.key == activeStripColor}" :style="'--element-color: #' + color.hex  + '; background: #' + color.hex + '72'" @click="() => {activeStripColor = color.key; engine.setClickStripColor(color.hex)}">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Pn" x="0px" y="0px" viewBox="0 0 4981 4981" style="enable-background:new 0 0 4981 4981;" xml:space="preserve">
                <g>
                  <defs>
                    <rect id="SVGID_1_" width="4981" height="4981"/>
                  </defs>
                  <clipPath id="SVGID_2_">
                    <use xlink:href="#SVGID_1_" style="overflow:visible;"/>
                  </clipPath>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <rect class="st0" width="4981" height="4981"/>
                  <g class="st1">
                    <path class="st2" d="M2490.5-2259.8l-4750.2,4750.3l4750.2,4750.3l4750.2-4750.3L2490.5-2259.8z M6847.3,2490.5L2490.5,6847.3    l-4356.7-4356.8l4356.8-4356.8L6847.3,2490.5z"/>
                    <path class="st2" d="M2490.5,6242.4l3751.9-3751.9L2490.5-1261.4l-3751.9,3751.9L2490.5,6242.4z M2490.5-868l3358.4,3358.5    L2490.5,5849L-867.9,2490.5L2490.5-868z"/>
                    <path class="st2" d="M5244.1,2490.5L2490.5-263.1L-263,2490.5l2753.6,2753.6L5244.1,2490.5z M130.4,2490.5L2490.5,130.4    l2360.1,2360.1L2490.5,4850.6L130.4,2490.5z"/>
                    <path class="st2" d="M2490.5,735.3L735.3,2490.5l1755.2,1755.2l1755.2-1755.2L2490.5,735.3z M2490.5,1128.7l1361.8,1361.8    L2490.5,3852.3L1128.7,2490.5L2490.5,1128.7z"/>
                    <path class="st2" d="M3247.4,2490.5l-756.9-756.9l-756.9,756.9l756.9,756.9L3247.4,2490.5z M2490.5,2854.1l-363.4-363.6    l363.4-363.4l363.4,363.5L2490.5,2854.1z"/>
                  </g>
                </g>
              </svg>
            </button>
          </div>
          <button class="form-group-fill-all" @click="engine.changeAllStripColor()">
            <svg fill="#fff" width="64px" height="64px" viewBox="-2.4 -2.4 28.80 28.80" xmlns="http://www.w3.org/2000/svg" stroke="#fff" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#fffCCCCCC" stroke-width="0.144"></g><g id="SVGRepo_iconCarrier"><path d="M20 14c-.092.064-2 2.083-2 3.5 0 1.494.949 2.448 2 2.5.906.044 2-.891 2-2.5 0-1.5-1.908-3.436-2-3.5zM9.586 20c.378.378.88.586 1.414.586s1.036-.208 1.414-.586l7-7-.707-.707L11 4.586 8.707 2.293 7.293 3.707 9.586 6 4 11.586c-.378.378-.586.88-.586 1.414s.208 1.036.586 1.414L9.586 20zM11 7.414 16.586 13H5.414L11 7.414z"></path></g></svg>
            <p><span v-html="colors.filter((e) => e.key === activeStripColor).map(obj => obj.title)"></span> füllen.</p>
          </button>
        </div>
        <div class="form-group">
          <label for="exportLayout">Layout exportieren</label>
          <button class="btn" name="exportLayout" @click="engine.exportLayout()">Export (.json)</button>
          <button class="btn outline" name="exportLayout" @click="exportScreenshot()">Export (.png)</button>
        </div>
        <div class="form-group">
          <label for="importLayout">Layout importieren</label>
          <input type="file" ref="configFileInput" accept="application/json" style="display: none" @change="importLayout($event)"/>
          <button class="btn" name="importLayout" @click="openImport()">Konfiguration laden</button>
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
button.btn {
  background: #fff;
  border: 1px solid #fff;
  color: #000;
  padding: .5rem .75rem;
  font-weight: 700;
  cursor: pointer;
  margin: .25rem 0;
  transition: background .3s ease, color .3s ease;
  &:hover {
    background: rgba(255,255,255,.5);
    color: #fff;
  }
  &.outline {
    background: rgba(255,255,255,0);
    color: #fff;
    &:hover {
      background: rgba(255,255,255,1);
      color: #000;
    }
  }
}
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
    max-height: calc(100vh - 2rem);
    overflow-y: scroll;

    &__logo {
      max-width: 100%;
      height: auto;
    }
    &__config {
      .form-group {
        margin-bottom: 0.75rem;
        display: flex;
        flex-direction: column;
        &-fill-all {
          display: flex;
          flex-direction: row;
          align-items: center;

          margin-top: .25rem;
          padding: .5rem 0;

          column-gap: .3rem;
          svg {
            width: 1.75rem;
            height: 1.75rem;
          }
          & > p > span {
            font-weight: 900;
          }
          border: none;
          background: none;
          color: white;
          text-align: start;
          cursor: pointer;
        }
        &-select {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          column-gap: .25rem;
          row-gap: .25rem;
          & > button {
            border: 1px solid rgba(255,255,255,0.2);
            aspect-ratio: 1;
            padding: 0;
            margin: 0;
            width: 2rem;
            height: 2rem;
            cursor: pointer;
            &:hover, &.active {
              border-color: rgba(255,255,255,1)
            }
            svg {
              .st0{clip-path:url(#SVGID_2_);fill:none;}
              .st1{clip-path:url(#SVGID_2_);}
              .st2{fill:var(--element-color);}
            }
          }
        }
        input {
          min-height: 2rem;
          border-radius: 0;
          border: none;
          padding: .5rem .75rem;
          &:focus {
            outline: none;
          }
          &[type="checkbox"] {
            width: 1rem;
            height: 1rem;
          }
        }
        &:has(> input[type="checkbox"]) {
          flex-direction: row-reverse;
          justify-content: start;
          align-items: center;
          column-gap: .5rem;
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
      min-height: auto;
      z-index: 1;
      box-shadow: 0px 0px 6px 2px rgb(0 0 0 / 35%);
    }
    &__view {
      padding: 0;
      max-width: calc(100vw - 1rem - var(--sidebar--width));
    }
  }
  @media (max-width: 575.98px) {
    &__sidebar {
      bottom: .5rem;
      min-width: calc(50% - 1rem);
      max-height: 40vh;
      overflow-y: scroll;
      &__logo {
        display: block;
        margin: 0 auto;
        max-height: 3rem;
        width: auto;
      }
    }
  }
}
</style>