<template>
  <div class="sheexcel-sheet-container">
    <header class="sheexcel-sheet-header">
      <h1>{{ actor.name }}</h1>
    </header>
    <section class="sheexcel-sheet-body">
      <div class="sheexcel-main-content">
        <iframe
          class="sheexcel-iframe"
          :style="{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: `top left`,
            width: `${100 * (100 / zoomLevel)}%`,
            height: `${100 * (100 / zoomLevel)}%`
          }"
          :src="iframeSrc"
          frameborder="0"
          v-show="sheetUrl !== ''"
        ></iframe>
        <p v-show="sheetUrl === ''">
          {{ localize("SHEEXCELREFRESH.NoSheetURL") }}
        </p>
      </div>
    </section>
    <nav class="sheexcel-sheet-tabs">
      <a class="sheexcel-sheet-toggle" @click="toggleSidebar">
        <div class="sheexcel-sheet-tab-icon">
          <svg
            width="30"
            height="24"
            viewBox="0 -4 27 26"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#eeeeee"
              stroke="#000000"
              stroke-width="2"
            />
            <rect
              x="18"
              y="1"
              width="1"
              height="20"
              fill="#151515"
              v-if="sidebarCollapsed"
            />
            <rect
              x="18"
              y="1"
              width="7"
              height="20"
              fill="#151515"
              v-if="!sidebarCollapsed"
            />
          </svg>
        </div>
      </a>
      <a
        class="sheexcel-sheet-references"
        :class="{ active: activeTab === 'references' }"
        @click="toggleTab('references')"
      >
        <div class="sheexcel-sheet-tab-icon">
          <svg
            width="30"
            height="24"
            viewBox="0 -4 27 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#262626"
              stroke="#000000"
              stroke-width="2"
            />
            <rect x="5" y="6" width="15" height="2" fill="#eeeeee" />
            <rect x="5" y="10" width="15" height="2" fill="#eeeeee" />
            <rect x="5" y="14" width="15" height="2" fill="#eeeeee" />
          </svg>
        </div>
      </a>
      <a
        class="sheexcel-sheet-ranges"
        :class="{ active: activeTab === 'ranges' }"
        @click="toggleTab('ranges')"
      >
        <div class="sheexcel-sheet-tab-icon">
          <svg width="30" height="24" viewBox="0 -4 27 26" fill="none">
            <rect
              x="1"
              y="1"
              width="25"
              height="20"
              fill="#262626"
              stroke="#000000"
              stroke-width="2"
            />
            <rect x="5" y="6" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="6" width="10" height="2" fill="#eeeeee" />

            <rect x="5" y="10" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="10" width="10" height="2" fill="#eeeeee" />

            <rect x="5" y="14" width="2" height="2" fill="#eeeeee" />
            <rect x="10" y="14" width="10" height="2" fill="#eeeeee" />
          </svg>
        </div>
      </a>
      <a
        class="sheexcel-sheet-settings"
        :class="{ active: activeTab === 'settings' }"
        @click="toggleTab('settings')"
      >
        <div class="sheexcel-sheet-tab-icon">
          <svg
            width="30"
            height="30"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#151515"
              d="M12 8.595C10.1315 8.595 8.595 10.1315 8.595 12C8.595 13.8685 10.1315 15.405 12 15.405C13.8685 15.405 15.405 13.8685 15.405 12C15.405 10.1315 13.8685 8.595 12 8.595ZM22 12.9415V11.0585L19.6615 9.91477C19.5254 9.16677 19.2908 8.44523 18.9754 7.76923L20.2754 5.53846L18.4615 3.72462L16.2308 5.02462C15.5548 4.70923 14.8332 4.47462 14.0852 4.33846L12.9415 2H11.0585L9.91477 4.33846C9.16677 4.47462 8.44523 4.70923 7.76923 5.02462L5.53846 3.72462L3.72462 5.53846L5.02462 7.76923C4.70923 8.44523 4.47462 9.16677 4.33846 9.91477L2 11.0585V12.9415L4.33846 14.0852C4.47462 14.8332 4.70923 15.5548 5.02462 16.2308L3.72462 18.4615L5.53846 20.2754L7.76923 18.9754C8.44523 19.2908 9.16677 19.5254 9.91477 19.6615L11.0585 22H12.9415L14.0852 19.6615C14.8332 19.5254 15.5548 19.2908 16.2308 18.9754L18.4615 20.2754L20.2754 18.4615L18.9754 16.2308C19.2908 15.5548 19.5254 14.8332 19.6615 14.0852L22 12.9415ZM12 16.5C9.51477 16.5 7.5 14.4852 7.5 12C7.5 9.51477 9.51477 7.5 12 7.5C14.4852 7.5 16.5 9.51477 16.5 12C16.5 14.4852 14.4852 16.5 12 16.5Z"
            />
          </svg>
        </div>
      </a>
    </nav>

    <div class="sheexcel-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sheexcel-sidebar-tab" v-show="activeTab === 'references'">
        <div class="sheexcel-references-container">
          <h3>{{ localize("SHEEXCELREFRESH.References") }}</h3>
          <div class="sheexcel-references" ref="referencesEl">
            <div
              class="sheexcel-reference-cell"
              v-for="(ref, idx) in adjustedReferences"
              ref="referenceEls"
            >
              <input
                class="sheexcel-cell"
                type="text"
                v-model="ref.cell"
                :placeholder="localize('SHEEXCELREFRESH.Cell')"
                @input.prevent.stop="onCellReferenceChange(idx, ref)"
              />
              <input
                class="sheexcel-keyword"
                type="text"
                v-model="ref.keyword"
                :placeholder="localize('SHEEXCELREFRESH.Keyword')"
                @input.prevent.stop="onKeywordReferenceChange(idx)"
              />
              <div v-show="sheetNames.length > 1">
                <select
                  class="sheexcel-sheet"
                  name="sheet"
                  v-model="ref.sheet"
                  @change.prevent.stop="onCellReferenceChange(idx, ref)"
                >
                  <option
                    :value="sheetName"
                    v-for="sheetName in sheetNames"
                    :selected="sheetName === ref.sheet"
                  >
                    {{ sheetName }}
                  </option>
                </select>
              </div>
              <div v-show="sheetNames.length < 1">
                <span class="sheexcel-reference-cell-sheet">{{
                  ref.sheet
                }}</span>
              </div>
              <div class="sheexcel-reference-remove">
                <button
                  type="button"
                  class="sheexcel-reference-remove-button"
                  @click.stop="onRemoveReference(idx)"
                >
                  {{ localize("SHEEXCELREFRESH.Remove") }}
                </button>
                <span class="sheexcel-reference-remove-value">{{
                  ref.value
                }}</span>
              </div>
            </div>
          </div>
          <div class="sheexcel-references-add">
            <button
              type="button"
              class="sheexcel-reference-add-button"
              @click.stop="onAddReference"
            >
              {{ localize("SHEEXCELREFRESH.AddReference") }}
            </button>
          </div>
        </div>
      </div>
      <div class="sheexcel-sidebar-tab" v-show="activeTab === 'ranges'">
        <h3>{{ localize("SHEEXCELREFRESH.Ranges") }}</h3>
        <div class="sheexcel-ranges-container">
          <div class="sheexcel-ranges" ref="rangeSortableEl">
            <div v-for="(header, idx) in adjustedRangeHeaders">
              <div class="range-sort-handle">
                <div class="fa fa-sort"></div>
              </div>
            </div>
          </div>
          <div class="sheexcel-ranges">
            <div
              class="sheexcel-reference-range"
              v-for="(ref, idx) in adjustedRanges"
            >
              <input
                class="sheexcel-range"
                type="text"
                v-model="ref.range"
                :placeholder="localize('SHEEXCELREFRESH.Range')"
                @input.prevent.stop="onCellRangeChange(idx)"
              />
              <div v-show="sheetNames.length > 1">
                <select
                  class="sheexcel-sheet"
                  name="sheet"
                  v-model="ref.sheet"
                  @change.prevent.stop
                >
                  <option
                    :value="sheetName"
                    v-for="sheetName in sheetNames"
                    :selected="sheetName === ref.sheet"
                  >
                    {{ sheetName }}
                  </option>
                </select>
              </div>
              <div v-show="sheetNames.length < 1">
                <span class="sheexcel-range-cell-sheet">{{ ref.sheet }}</span>
              </div>
              <div class="sheexcel-range-remove">
                <a
                  class="sheexcel-range-remove-button"
                  @click="onRemoveRange(idx)"
                >
                  {{ localize("SHEEXCELREFRESH.Remove") }}
                </a>
              </div>
            </div>
          </div>
          <div class="sheexcel-ranges-add">
            <button
              type="button"
              class="sheexcel-range-add-button"
              @click="onAddRange"
            >
              {{ localize("SHEEXCELREFRESH.AddRange") }}
            </button>
          </div>
        </div>
      </div>
      <div class="sheexcel-sidebar-tab" v-show="activeTab === 'settings'">
        <h3>{{ localize("SHEEXCELREFRESH.Settings") }}</h3>
        <div class="sheexcel-settings">
          <div class="sheexcel-settings-container">
            <input
              type="text"
              class="sheexcel-setting-url"
              v-model="sheetUrl"
              @input.prevent.stop
              :placeholder="localize('SHEEXCELREFRESH.GoogleSheetURL')"
            />
            <button
              type="button"
              class="sheexcel-setting-update-sheet"
              @click.prevent="onUpdateSheet"
            >
              {{ localize("SHEEXCELREFRESH.UpdateSheet") }}
            </button>
          </div>
          <div class="sheexcel-settings-container">
            <input
              class="sheexcel-setting-zoom-slider"
              type="range"
              min="25"
              max="175"
              v-model="zoomLevel"
              step="5"
            />
            <span class="sheexcel-setting-zoom-value">{{ zoomLevel }}%</span>
          </div>
          <div class="sheexcel-settings-container">
            <input
              class="sheexcel-setting-hide-menu"
              type="checkbox"
              v-model="hideMenu"
            />
            <span>{{ localize("SHEEXCELREFRESH.HideMenu") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef
} from "vue";
import { useSortable } from "@vueuse/integrations/useSortable";
import { localize } from "../libs/vue/VueHelpers";

const actor = inject("actor");
const actorSheet = inject("actorSheet");

const data = ref(actorSheet.getData());

const activeTab = ref(data.value.activeTab);
const sheetUrl = ref(data.value.sheetUrl);
const sheetNames = ref(data.value.sheetNames);
const hideMenu = ref(data.value.hideMenu);
const sidebarCollapsed = ref(data.value.sidebarCollapsed);
const zoomLevel = ref(data.value.zoomLevel);
const referencesElm = useTemplateRef("referencesEl");
const referenceElms = useTemplateRef("referenceEls");
const adjustedReferences = ref(data.value.adjustedReferences);
const adjustedRangeHeaders = ref(data.value.adjustedRangeHeaders);
const adjustedRanges = ref(data.value.adjustedRanges);
const rangeSortableElm = useTemplateRef("rangeSortableEl");
const system = ref(
  foundry.utils.duplicate(actorSheet.actor.system.sheexcelrefresh)
);

const iframeSrc = computed(() => {
  return `${sheetUrl.value}?embedded=true&rm=${
    hideMenu.value ? "minimal" : "embedded"
  }`;
});

useSortable(rangeSortableElm, adjustedRanges, { handle: ".range-sort-handle" });

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  actorSheet._sidebarCollapsed = sidebarCollapsed.value;
};

const toggleTab = active => {
  sidebarCollapsed.value = false;
  activeTab.value = active;
  actorSheet._sidebarCollapsed = sidebarCollapsed.value;
  actorSheet._activeTab = activeTab.value;
};

const onAddReference = async () => {
  actorSheet._fetchSheetNames();
  adjustedReferences.value.push({
    sheet: actorSheet._currentSheetName,
    cell: "",
    keyword: "",
    value: ""
  });
  actorSheet._cellReferences = adjustedReferences.value;
  await nextTick();
  referencesElm.value.scrollTop = referencesElm.value.scrollHeight;
};

const onRemoveReference = async idx => {
  const prevSibling = referenceElms.value[idx].previousElementSibling;
  adjustedReferences.value.splice(idx, 1);
  if (prevSibling !== null) {
    await nextTick();
    prevSibling.scrollIntoView();
  }
  actorSheet._cellReferences = adjustedReferences.value;
};

const onCellReferenceChange = async (index, currentRef) => {
  if (
    actorSheet._cellReferences[index].cell &&
    actorSheet._cellReferences[index].cell.length &&
    actorSheet._cellReferences[index].sheet
  ) {
    actorSheet._cellReferences[index].value = await actorSheet._fetchCellValue(
      actorSheet._sheetId,
      actorSheet._cellReferences[index].sheet,
      actorSheet._cellReferences[index].cell
    );
  }
  const ref = system.value;
  ref[actorSheet._cellReferences[index].keyword] =
    actorSheet._cellReferences[index].value;
  currentRef.value = actorSheet._cellReferences[index].value;
};

const onKeywordReferenceChange = index => {
  const ref = system.value;
  ref[actorSheet._cellReferences[index].keyword] =
    actorSheet._cellReferences[index].value;
};

const onUpdateSheet = async () => {
  if (!sheetUrl.value) {
    actorSheet.sheetId = null;
    actorSheet.currentSheetName = null;
    actorSheet.sheetNames = [];
    return;
  }

  const sheetIdMatch = sheetUrl.value.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );
  if (sheetIdMatch) {
    actorSheet._sheetId = sheetIdMatch[1];
    await actorSheet._fetchSheetNames();
  }

  await actor.setFlag("sheexcelrefresh", "sheetId", actorSheet._sheetId);
  await actor.setFlag(
    "sheexcelrefresh",
    "sheetName",
    actorSheet._currentSheetName
  );
  await actor.setFlag("sheexcelrefresh", "sheetNames", actorSheet._sheetNames);
  await actor.setFlag("sheexcelrefresh", "sheetUrl", sheetUrl.value);
};

onMounted(() => {
  data.value = actorSheet.getData();
});

onUnmounted(async () => {
  await actorSheet._saveFlags();
  await actorSheet.actor.update({ "system.sheexcelrefresh": system.value });
});
</script>

<style lang="scss" scoped>
.sheexcel-sheet-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 5px 5px;
  position: relative;

  .sheexcel-sheet-header {
    flex: 0 0 auto;
    padding: 0px 265px 0px 0px;
    border-bottom: 1px solid #ddd;
  }

  .sheexcel-sheet-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sheexcel-main-content {
    flex: 1;
    overflow: hidden;
  }

  .sheexcel-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .sheexcel-sheet-tabs {
    position: absolute;
    display: flex;
    flex-direction: row;
    top: 5px;
    right: 5px;
    width: 504px;
    height: 35px;
    background: #eeeeee;
    color: #151515;
    border: none;
  }

  .sheexcel-sheet-tabs a {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0;
  }

  .sheexcel-sheet-tabs a:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .sheexcel-sheet-tabs a.active {
    box-shadow: inset 0 0 5px rgba(255, 165, 0, 0.2),
      inset 0 0 10px rgba(255, 100, 0, 0.3);
    transition: box-shadow 0.3s ease;
  }

  .sheexcel-sidebar {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 5px;
    top: 50px;
    right: 5px;
    bottom: 5px;
    width: 504px;
    background-color: #f0f0f0;
    color: #151515;
    padding: 10px 10px;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 100;
    transition: transform 0.3s ease;
    &.collapsed {
      transform: translateX(calc(100% + 20px));
    }
  }

  .sheexcel-sidebar-tab {
    flex-direction: column;
    height: 100%;
  }

  .sheexcel-sidebar-tab-icon {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .sheexcel-references-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sheexcel-references {
    flex-grow: 1;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .sheexcel-reference-cell {
    flex: 1;
    flex-direction: row;
    padding: 5px 5px;
    margin-bottom: 5px;
    width: 100%;
    justify-self: center;
    background-color: #ffffff;
  }

  .sheexcel-reference-cell input.sheexcel-cell {
    width: 45px;
  }

  .sheexcel-reference-cell input.sheexcel-keyword {
    width: 98px;
  }

  .sheexcel-reference-cell select.sheexcel-sheet {
    max-width: calc(45px + 98px);
  }

  .sheexcel-reference-remove {
    flex-direction: row;
    justify-content: stretch;
    margin-top: 5px;
  }

  .sheexcel-reference-remove-value {
    text-align: center;
    width: 100%;
    margin-left: 10px;
  }

  .sheexcel-reference-remove-button {
    width: 143px;
  }

  .sheexcel-reference-remove-save {
    display: none;
  }

  .sheexcel-references-add {
    flex-shrink: 0;
    margin-top: auto;
  }

  .sheexcel-settings-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px 5px;
    margin-bottom: 5px;
    width: 100%;
    justify-self: center;
    align-items: center;
    text-align: center;
    background-color: #ffffff;
  }

  input.sheexcel-settings-container {
    width: 100%;
  }

  .sheexcel-settings-zoom-value {
    min-width: 40px;
    text-align: center;
  }
}
</style>
